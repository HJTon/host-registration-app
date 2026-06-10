import type { Context } from '@netlify/functions';
import { google } from 'googleapis';
import { HS_COLUMNS, getHSTabName, getHSHeaders, buildHSRow, type HSSubmitBody } from './lib/hsShared';

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

async function ensureTab(
  sheets: ReturnType<typeof getSheets>,
  spreadsheetId: string,
  tabName: string,
  headers: string[],
): Promise<void> {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = spreadsheet.data.sheets?.some(s => s.properties?.title === tabName);
  if (exists) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headers] },
  });
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

    const body = (await request.json()) as HSSubmitBody;
    if (!body.submissionId || !body.hsType || !HS_COLUMNS[body.hsType]) {
      return new Response(JSON.stringify({ error: 'Missing submissionId or hsType' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const sourceTab = getHSTabName(body.originalHsType || body.hsType);
    const destTab = getHSTabName(body.hsType);
    const sheets = getSheets();

    // Locate the row by Submission ID (column B) in the source tab.
    const read = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sourceTab}'!A:B`,
    });
    const rows = read.data.values ?? [];
    const rowIndex = rows.findIndex((row, i) => i > 0 && row[1] === body.submissionId);

    // Not found in the existing tab — fall back to appending so the edit isn't lost.
    if (rowIndex === -1) {
      await ensureTab(sheets, spreadsheetId, destTab, getHSHeaders(body.hsType));
      const { row } = buildHSRow(body, body.submittedAt || new Date().toISOString());
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${destTab}'!A:A`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      });
      return new Response(JSON.stringify({ success: true, appended: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const originalSubmittedAt = rows[rowIndex][0] ?? body.submittedAt ?? new Date().toISOString();
    const sheetRowNumber = rowIndex + 1;
    const { row: newRow } = buildHSRow(body, originalSubmittedAt);

    if (sourceTab === destTab) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sourceTab}'!A${sheetRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
      });
    } else {
      // H&S type changed — clear the old row and append to the new tab.
      const emptyRow = new Array((rows[rowIndex] as string[]).length).fill('');
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sourceTab}'!A${sheetRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [emptyRow] },
      });
      await ensureTab(sheets, spreadsheetId, destTab, getHSHeaders(body.hsType));
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${destTab}'!A:A`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [newRow] },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (error) {
    console.error('Error updating H&S submission:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update H&S plan',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    );
  }
};
