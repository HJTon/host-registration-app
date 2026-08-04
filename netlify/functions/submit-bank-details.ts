import type { Context } from '@netlify/functions';
import { google } from 'googleapis';

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

// Netlify functions have a hard ~10s limit; fail each Google call fast and
// loudly rather than burning the whole budget on a hung request.
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
    sheets.spreadsheets.get({ spreadsheetId }),
    7000,
    'spreadsheets.get',
  );
  if (spreadsheet.data.sheets?.some(s => s.properties?.title === TAB_NAME)) return;

  await withTimeout(
    sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: TAB_NAME } } }] },
    }),
    7000,
    'addSheet',
  );

  await withTimeout(
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${TAB_NAME}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [BANK_HEADERS] },
    }),
    7000,
    'header update',
  );
}

interface SubmitBody {
  propertyName?: string;
  accountName?: string;
  accountNumber?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export default async (request: Request, _context: Context) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const spreadsheetId = process.env[SPREADSHEET_ID_ENV];
    if (!spreadsheetId) return json({ error: 'Spreadsheet ID not configured' }, 500);

    let body: SubmitBody;
    try {
      body = (await request.json()) as SubmitBody;
    } catch {
      return json({ error: 'Invalid body' }, 400);
    }

    const accountName = (body.accountName ?? '').trim();
    const accountNumber = (body.accountNumber ?? '').trim();
    if (!accountName) return json({ error: 'Account name is required' }, 400);

    const digits = accountNumber.replace(/\D/g, '');
    if (digits.length !== 15 && digits.length !== 16) {
      return json({ error: 'Account number must be a full NZ account number' }, 400);
    }

    const sheets = getSheets();
    await ensureTab(sheets, spreadsheetId);

    const row = [
      new Date().toISOString(),
      (body.propertyName ?? '').trim(),
      accountName,
      // Leading apostrophe keeps Sheets from mangling the hyphens into a date
      // or dropping the leading zero of a suffix.
      `'${accountNumber}`,
    ];

    await withTimeout(
      sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${TAB_NAME}'!A:A`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      }),
      7000,
      'values.append',
    );

    return json({ success: true });
  } catch (error) {
    // Never echo the submitted values back in an error — they'd end up in logs
    // and in the browser.
    console.error('Error saving bank details:', error instanceof Error ? error.message : error);
    return json({ error: 'Could not save your bank details. Please try again.' }, 500);
  }
};
