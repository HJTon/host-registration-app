import type { Handler, HandlerResponse } from '@netlify/functions';
import { google } from 'googleapis';
import {
  NZ_ACCOUNT_NUMBER_ERROR,
  parseNzBankAccountNumber,
} from '../../src/utils/bankAccount';

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

function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// Keep an individual Google call from consuming the function's full execution
// window. Seven seconds proved too aggressive for cold authentication plus a
// Sheets request.
const GOOGLE_CALL_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

async function ensureTab(
  sheets: ReturnType<typeof getSheets>,
  spreadsheetId: string,
): Promise<void> {
  const spreadsheet = await withTimeout(
    sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title',
    }),
    GOOGLE_CALL_TIMEOUT_MS,
    'spreadsheets.get',
  );
  if (spreadsheet.data.sheets?.some(s => s.properties?.title === TAB_NAME)) return;

  await withTimeout(
    sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: TAB_NAME } } }] },
    }),
    GOOGLE_CALL_TIMEOUT_MS,
    'addSheet',
  );

  await withTimeout(
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${TAB_NAME}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [BANK_HEADERS] },
    }),
    GOOGLE_CALL_TIMEOUT_MS,
    'header update',
  );
}

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

// Use Netlify's buffered handler contract here. It is supported across all
// Lambda runtimes and avoids response-stream framing failures during deploys.
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const spreadsheetId = process.env[SPREADSHEET_ID_ENV];
    if (!spreadsheetId) return json({ error: 'Spreadsheet ID not configured' }, 500);

    let body: SubmitBody;
    try {
      body = JSON.parse(event.body || '{}') as SubmitBody;
    } catch {
      return json({ error: 'Invalid body' }, 400);
    }

    const accountName = typeof body.accountName === 'string' ? body.accountName.trim() : '';
    if (!accountName) {
      return json({
        error: 'Please enter the name on the account.',
        code: 'INVALID_ACCOUNT_NAME',
        field: 'accountName',
      }, 400);
    }

    const accountNumber = parseNzBankAccountNumber(body.accountNumber);
    if (!accountNumber) {
      return json({
        error: NZ_ACCOUNT_NUMBER_ERROR,
        code: 'INVALID_ACCOUNT_NUMBER',
        field: 'accountNumber',
      }, 400);
    }

    const sheets = getSheets();
    await ensureTab(sheets, spreadsheetId);

    const row = [
      new Date().toISOString(),
      typeof body.propertyName === 'string' ? body.propertyName.trim() : '',
      accountName,
      // Leading apostrophe keeps Sheets from mangling the hyphens into a date
      // or dropping the leading zero of a suffix.
      `'${accountNumber.formatted}`,
    ];

    await withTimeout(
      sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${TAB_NAME}'!A:A`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      }),
      GOOGLE_CALL_TIMEOUT_MS,
      'values.append',
    );

    return json({ success: true });
  } catch (error) {
    // Never echo the submitted values back in an error — they'd end up in logs
    // and in the browser.
    console.error('Error saving bank details:', error instanceof Error ? error.message : error);
    return json({
      error: 'Your details look valid, but secure storage is temporarily unavailable. Nothing was saved; please try again.',
      code: 'BANK_DETAILS_STORAGE_UNAVAILABLE',
    }, 503);
  }
};
