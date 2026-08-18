// Shared Google Sheets access for the form-submission functions.
// Kept in a subdirectory so Netlify does not expose it as its own endpoint.

import { google, type sheets_v4 } from 'googleapis';

export type Sheets = sheets_v4.Sheets;

export function getSheets(): Sheets {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// Netlify gives a synchronous function ~10s in total, and that budget covers the
// cold start and the service-account token exchange as well as the Sheets calls
// themselves. Overrunning it gets the function killed by the platform, which
// returns a non-JSON 502 — the browser then has no error message to show and the
// host just sees "Submission failed", with their answers lost.
//
// So we run every request against a deadline that expires *before* the platform
// one. Whatever happens, the function gets to return a real JSON error.
const PLATFORM_BUDGET_MS = 8000;

export class Deadline {
  private readonly expiresAt: number;

  constructor(budgetMs: number = PLATFORM_BUDGET_MS) {
    this.expiresAt = Date.now() + budgetMs;
  }

  get remaining(): number {
    return Math.max(0, this.expiresAt - Date.now());
  }

  // Reject as soon as the call would push us past the budget, naming the call so
  // the failure is identifiable in the function logs.
  run<T>(promise: Promise<T>, label: string): Promise<T> {
    const ms = this.remaining;
    if (ms === 0) return Promise.reject(new Error(`${label} skipped: out of time budget`));
    let timer: ReturnType<typeof setTimeout>;
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]).finally(() => clearTimeout(timer));
  }
}

// Sheets reports an append to a non-existent tab as a 400 "Unable to parse
// range". Anything else — auth, permissions, quota — must not be mistaken for a
// missing tab, or we would create duplicate tabs on a transient failure.
function isMissingTabError(error: unknown): boolean {
  const err = error as { code?: number | string; message?: string };
  const message = String(err?.message ?? '');
  return Number(err?.code) === 400 && /unable to parse range/i.test(message);
}

async function createTab(
  sheets: Sheets,
  spreadsheetId: string,
  tabName: string,
  headers: string[],
  deadline: Deadline,
): Promise<void> {
  try {
    await deadline.run(
      sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
      }),
      `addSheet ${tabName}`,
    );
  } catch (error) {
    // A concurrent submission may have created the tab first; that is a success
    // for our purposes. Any other failure is real.
    const message = String((error as { message?: string })?.message ?? '');
    if (!/already exists/i.test(message)) throw error;
    return;
  }
  await deadline.run(
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${tabName}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    }),
    `header update ${tabName}`,
  );
}

// Append a row, creating the tab only if the append shows it is missing.
//
// The previous shape of this — fetch the whole spreadsheet's metadata, check the
// tab exists, then append — spent a round trip on every single submission to
// confirm something that is true in all but the first. `spreadsheets.get` with
// no field mask returns metadata for every tab in the file, which grows with the
// season, so that check got steadily slower until it was eating the function's
// whole time budget.
export async function appendRow(
  sheets: Sheets,
  spreadsheetId: string,
  tabName: string,
  headers: string[],
  row: string[],
  deadline: Deadline,
): Promise<void> {
  const append = (label: string) =>
    deadline.run(
      sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${tabName}'!A:A`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      }),
      label,
    );

  try {
    await append(`values.append ${tabName}`);
  } catch (error) {
    if (!isMissingTabError(error)) throw error;
    await createTab(sheets, spreadsheetId, tabName, headers, deadline);
    await append(`values.append ${tabName} (after create)`);
  }
}
