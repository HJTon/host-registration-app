import type { Context } from '@netlify/functions';
import { HS_COLUMNS, getHSTabName, buildHSRow, type HSSubmitBody } from './lib/hsShared';
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
    if (!body.hsType || !HS_COLUMNS[body.hsType] || !body.email) {
      return json({ error: 'Missing or invalid H&S submission' }, 400);
    }

    const tabName = getHSTabName(body.hsType);
    const { headers, row } = buildHSRow(body, new Date().toISOString());

    await appendRow(getSheets(), spreadsheetId, tabName, headers, row, deadline);

    return json({ success: true });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error submitting H&S form:', details);
    return json(
      {
        error:
          'We couldn’t save your plan just now — your answers are still on this page, so please try again in a moment.',
        details,
      },
      503,
    );
  }
};
