import type { Context } from '@netlify/functions';
import { HS_COLUMNS, getHSTabName, getHSHeaders, buildHSRow, type HSSubmitBody } from './lib/hsShared';
import { Deadline, appendRow, getSheets } from './lib/sheets';

const SPREADSHEET_ID_ENV = 'HOST_FORM_SPREADSHEET_ID';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export default async (request: Request, _context: Context) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const deadline = new Deadline();

  try {
    const spreadsheetId = process.env[SPREADSHEET_ID_ENV];
    if (!spreadsheetId) {
      return json({ error: 'Spreadsheet ID not configured' }, 500);
    }

    const body = (await request.json()) as HSSubmitBody;
    if (!body.submissionId || !body.hsType || !HS_COLUMNS[body.hsType]) {
      return json({ error: 'Missing submissionId or hsType' }, 400);
    }

    const sourceTab = getHSTabName(body.originalHsType || body.hsType);
    const destTab = getHSTabName(body.hsType);
    const sheets = getSheets();

    // Locate the row by Submission ID (column B) in the source tab.
    const read = await deadline.run(
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sourceTab}'!A:B`,
      }),
      `values.get ${sourceTab}`,
    );
    const rows = read.data.values ?? [];
    const rowIndex = rows.findIndex((row, i) => i > 0 && row[1] === body.submissionId);

    // Not found in the existing tab — fall back to appending so the edit isn't lost.
    if (rowIndex === -1) {
      const { headers, row } = buildHSRow(body, body.submittedAt || new Date().toISOString());
      await appendRow(sheets, spreadsheetId, destTab, headers, row, deadline);
      return json({ success: true, appended: true });
    }

    const originalSubmittedAt = rows[rowIndex][0] ?? body.submittedAt ?? new Date().toISOString();
    const sheetRowNumber = rowIndex + 1;
    const { row: newRow } = buildHSRow(body, originalSubmittedAt);

    if (sourceTab === destTab) {
      await deadline.run(
        sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${sourceTab}'!A${sheetRowNumber}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [newRow] },
        }),
        `values.update ${sourceTab}`,
      );
    } else {
      // H&S type changed — write the new tab first, so a failure part-way through
      // can't leave the host with no plan at all, then clear the old row.
      await appendRow(sheets, spreadsheetId, destTab, getHSHeaders(body.hsType), newRow, deadline);
      const emptyRow = new Array((rows[rowIndex] as string[]).length).fill('');
      await deadline.run(
        sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${sourceTab}'!A${sheetRowNumber}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [emptyRow] },
        }),
        `values.clear ${sourceTab}`,
      );
    }

    return json({ success: true });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating H&S submission:', details);
    return json(
      {
        error:
          'We couldn’t save your changes just now — they’re still on this page, so please try again in a moment.',
        details,
      },
      503,
    );
  }
};
