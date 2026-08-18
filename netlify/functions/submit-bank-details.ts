import type { Handler, HandlerResponse } from '@netlify/functions';
import { NZ_ACCOUNT_NUMBER_ERROR, parseNzBankAccountNumber } from '../../src/utils/bankAccount';
import { Deadline, appendRow, getSheets } from './lib/sheets';

// Host bank account details, for reimbursements.
//
// Deliberately write-only: this endpoint appends and never reads. The details
// can only be read back through the password-gated dashboard function, so a
// leaked URL here gives an attacker nothing to harvest.
//
// The rows land in their own sheet tab so the spreadsheet can be shared with
// coordinators at tab level without exposing account numbers to everyone who
// has access to the registration tabs.

const TAB_NAME = 'Host Bank Details 2026';
const SPREADSHEET_ID_ENV = 'HOST_FORM_SPREADSHEET_ID';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const BANK_HEADERS = [
  'Submitted At',
  'Property Name',
  'Account Name',
  'Account Number',
];

interface SubmitBody {
  propertyName?: string;
  accountName?: string;
  accountNumber?: string;
}

function json(body: unknown, status = 200): HandlerResponse {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify(body),
  };
}

// Netlify's buffered (v1) handler, deliberately. In August 2026 every v2
// streaming handler on this site started returning "error decoding lambda
// response" 502s; this endpoint kept working purely because it had already
// been moved onto the buffered contract. Don't move it back to `export
// default` without re-probing the deployed functions first.
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const deadline = new Deadline();

  try {
    const spreadsheetId = process.env[SPREADSHEET_ID_ENV];
    if (!spreadsheetId) return json({ error: 'Spreadsheet ID not configured' }, 500);

    let body: SubmitBody;
    try {
      body = JSON.parse(event.body || '{}') as SubmitBody;
    } catch {
      return json({ error: 'Invalid body' }, 400);
    }

    // `field` lets the page put the message against the input it belongs to,
    // rather than as a general "submission failed".
    const accountName = typeof body.accountName === 'string' ? body.accountName.trim() : '';
    if (!accountName) {
      return json({ error: 'Please enter the name on the account.', field: 'accountName' }, 400);
    }

    const accountNumber = parseNzBankAccountNumber(body.accountNumber);
    if (!accountNumber) {
      return json({ error: NZ_ACCOUNT_NUMBER_ERROR, field: 'accountNumber' }, 400);
    }

    const row = [
      new Date().toISOString(),
      typeof body.propertyName === 'string' ? body.propertyName.trim() : '',
      accountName,
      // Leading apostrophe keeps Sheets from mangling the hyphens into a date
      // or dropping the leading zero of a suffix.
      `'${accountNumber.formatted}`,
    ];

    await appendRow(getSheets(), spreadsheetId, TAB_NAME, BANK_HEADERS, row, deadline);

    return json({ success: true });
  } catch (error) {
    // Never echo the submitted values back in an error — they'd end up in logs
    // and in the browser. The call label is safe and is what identifies the
    // failure in the function logs.
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving bank details:', details);
    return json(
      {
        error:
          'Your details look valid, but we couldn’t save them just now. Nothing was saved — please try again in a moment.',
        details,
      },
      503,
    );
  }
};
