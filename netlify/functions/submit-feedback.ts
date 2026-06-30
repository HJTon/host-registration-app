import type { Context } from '@netlify/functions';
import { google } from 'googleapis';

const TAB_NAME = 'Host Feedback 2026';
const SPREADSHEET_ID_ENV = 'HOST_FORM_SPREADSHEET_ID';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// Netlify functions have a hard ~10s limit. A Google API call that hangs would
// otherwise burn the whole budget and fail with an opaque timeout — losing the
// host's feedback with no clear error. Fail each call fast and loudly instead.
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

const SHEET_HEADERS = [
  'Submitted At',
  'Name',
  'Property Name',
  'Feedback Type',
  'Message',
];

async function ensureTab(
  sheets: ReturnType<typeof getSheets>,
  spreadsheetId: string,
): Promise<void> {
  const spreadsheet = await withTimeout(
    sheets.spreadsheets.get({ spreadsheetId }),
    7000,
    'spreadsheets.get',
  );
  const exists = spreadsheet.data.sheets?.some(
    (s) => s.properties?.title === TAB_NAME,
  );
  if (exists) return;

  await withTimeout(
    sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: TAB_NAME } } }],
      },
    }),
    7000,
    'addSheet',
  );

  await withTimeout(
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${TAB_NAME}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [SHEET_HEADERS] },
    }),
    7000,
    'header update',
  );
}

interface SubmitBody {
  name: string;
  propertyName: string;
  feedbackType: string;
  message: string;
}

export default async (request: Request, _context: Context) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  try {
    const spreadsheetId = process.env[SPREADSHEET_ID_ENV];
    if (!spreadsheetId) {
      return new Response(JSON.stringify({ error: 'Spreadsheet ID not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const body = (await request.json()) as SubmitBody;

    if (!body.message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const sheets = getSheets();
    await ensureTab(sheets, spreadsheetId);

    const row = [
      new Date().toISOString(),
      body.name ?? '',
      body.propertyName ?? '',
      body.feedbackType ?? '',
      body.message,
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

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      },
    );
  }
};
