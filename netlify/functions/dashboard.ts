import type { Context } from '@netlify/functions';
import { google } from 'googleapis';
import { timingSafeEqual } from 'node:crypto';
import { getHSTabName, rowToHSResponse, type HSType } from './lib/hsShared';

// Private coordinator dashboard data endpoint. All access is gated here by a
// shared password (env DASHBOARD_PASSWORD) — the /dashboard page is just UI.

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
    // read/write — the dashboard maintains the "Withdrawn Properties" tab
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// Registration tabs (one per property type) — see submit-host-form.ts.
const REGISTRATION_TABS = [
  'Backyards', 'Community Gardens', 'School Gardens', 'Builds', 'Farms', 'Lifestyle Blocks',
];

// Coordinators can "hide" a property (e.g. withdrawn / stale) without deleting
// its registration row. The hidden set lives in this tab, keyed by registration
// Submission ID, so it is shared across all coordinators.
const WITHDRAWN_TAB = 'Withdrawn Properties';
const WITHDRAWN_HEADERS = ['Registration ID', 'Property Name', 'Withdrawn At'];

async function ensureTab(
  sheets: ReturnType<typeof getSheets>,
  spreadsheetId: string,
  tabName: string,
  headers: string[],
): Promise<void> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  if (meta.data.sheets?.some(s => s.properties?.title === tabName)) return;
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

async function readWithdrawnSet(
  sheets: ReturnType<typeof getSheets>,
  spreadsheetId: string,
): Promise<Set<string>> {
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${WITHDRAWN_TAB}'!A2:A` });
    const ids = (res.data.values ?? []).map(r => String(r[0] ?? '').trim()).filter(Boolean);
    return new Set(ids);
  } catch {
    return new Set(); // tab doesn't exist yet
  }
}
const HS_TABS: Record<HSType, string> = {
  backyards: getHSTabName('backyards'),
  builds: getHSTabName('builds'),
  farms: getHSTabName('farms'),
  lifestyle: getHSTabName('lifestyle'),
};

function hsTypeForProperty(propertyType: string): HSType {
  if (propertyType === 'build') return 'builds';
  if (propertyType === 'farm') return 'farms';
  if (propertyType === 'lifestyle-block') return 'lifestyle';
  return 'backyards'; // private-property, community-garden, school-garden
}

function passwordOk(provided: unknown): boolean {
  const expected = process.env.DASHBOARD_PASSWORD || '';
  if (!expected || typeof provided !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// Build a header→index lookup and return a row accessor.
function rowReader(headers: string[]) {
  const map = new Map(headers.map((h, i) => [h, i]));
  return (row: string[], name: string) => {
    const i = map.get(name);
    return i === undefined ? '' : String(row[i] ?? '');
  };
}

// Fetch the values of every requested tab that actually exists in the sheet.
async function fetchTabs(
  sheets: ReturnType<typeof getSheets>,
  spreadsheetId: string,
  wanted: string[],
): Promise<Record<string, string[][]>> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = new Set((meta.data.sheets ?? []).map(s => s.properties?.title).filter(Boolean) as string[]);
  const ranges = wanted.filter(t => existing.has(t)).map(t => `'${t}'!A:ZZ`);
  const out: Record<string, string[][]> = {};
  if (ranges.length === 0) return out;
  const res = await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges });
  for (const vr of res.data.valueRanges ?? []) {
    // valueRange.range looks like 'Tab Name'!A1:ZZ123 — recover the title
    const raw = vr.range ?? '';
    const m = raw.match(/^'?(.*?)'?!/);
    const title = m ? m[1].replace(/''/g, "'") : raw;
    out[title] = (vr.values as string[][]) ?? [];
  }
  return out;
}

interface HostRow {
  regId: string;
  email: string;
  propertyName: string;
  hostNames: string;
  contactNumber: string;
  propertyType: string;
  hsType: HSType;
  status: 'done' | 'not-started';
  signedBy: string;
  signedAt: string;
  hsSubmissionId: string;
  withdrawn: boolean;
}

export default async (request: Request, _context: Context) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { password?: string; action?: string; submissionId?: string; regId?: string; propertyName?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: 'Invalid body' }, 400);
  }

  if (!passwordOk(body.password)) return json({ error: 'Unauthorised' }, 401);

  const action = body.action ?? 'login';
  if (action === 'login') return json({ ok: true });

  const spreadsheetId = process.env[SPREADSHEET_ID_ENV];
  if (!spreadsheetId) return json({ error: 'Spreadsheet not configured' }, 500);

  try {
    const sheets = getSheets();

    if (action === 'hs-record') {
      if (!body.submissionId) return json({ error: 'Missing submissionId' }, 400);
      const hsData = await fetchTabs(sheets, spreadsheetId, Object.values(HS_TABS));
      for (const hsType of Object.keys(HS_TABS) as HSType[]) {
        const rows = hsData[HS_TABS[hsType]] ?? [];
        if (rows.length < 2) continue;
        const headers = rows[0];
        const read = rowReader(headers);
        const match = rows.slice(1).find(r => read(r, 'Submission ID') === body.submissionId);
        if (match) {
          return json({ found: true, response: rowToHSResponse(hsType, headers, match) });
        }
      }
      return json({ found: false });
    }

    if (action === 'hs-withdraw') {
      if (!body.regId) return json({ error: 'Missing regId' }, 400);
      await ensureTab(sheets, spreadsheetId, WITHDRAWN_TAB, WITHDRAWN_HEADERS);
      const already = await readWithdrawnSet(sheets, spreadsheetId);
      if (!already.has(body.regId)) {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `'${WITHDRAWN_TAB}'!A:A`,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: [[body.regId, body.propertyName || '', new Date().toISOString()]] },
        });
      }
      return json({ ok: true });
    }

    if (action === 'hs-restore') {
      if (!body.regId) return json({ error: 'Missing regId' }, 400);
      const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${WITHDRAWN_TAB}'!A2:C` }).catch(() => null);
      const rows = (res?.data.values as string[][] | undefined) ?? [];
      const kept = rows.filter(r => String(r[0] ?? '').trim() !== body.regId);
      // Rewrite the data range: clear then write the survivors.
      await sheets.spreadsheets.values.clear({ spreadsheetId, range: `'${WITHDRAWN_TAB}'!A2:C` });
      if (kept.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${WITHDRAWN_TAB}'!A2`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: kept },
        });
      }
      return json({ ok: true });
    }

    if (action === 'hs-list') {
      const wanted = [...REGISTRATION_TABS, ...Object.values(HS_TABS)];
      const [data, withdrawnSet] = await Promise.all([
        fetchTabs(sheets, spreadsheetId, wanted),
        readWithdrawnSet(sheets, spreadsheetId),
      ]);

      // Index H&S records by registration id and by email+type.
      interface HSIndexEntry { hsType: HSType; submissionId: string; signedBy: string; signedAt: string; acknowledged: boolean; }
      const byRegId = new Map<string, HSIndexEntry>();
      const byEmailType = new Map<string, HSIndexEntry>();
      for (const hsType of Object.keys(HS_TABS) as HSType[]) {
        const rows = data[HS_TABS[hsType]] ?? [];
        if (rows.length < 2) continue;
        const read = rowReader(rows[0]);
        for (const r of rows.slice(1)) {
          const submissionId = read(r, 'Submission ID');
          if (!submissionId) continue;
          const entry: HSIndexEntry = {
            hsType,
            submissionId,
            signedBy: read(r, 'Signed By'),
            signedAt: read(r, 'Signed At'),
            acknowledged: read(r, 'Acknowledged').toLowerCase() === 'yes',
          };
          const linked = read(r, 'Linked Property');
          if (linked) byRegId.set(linked, entry);
          const email = read(r, 'Email').trim().toLowerCase();
          if (email) byEmailType.set(`${email}|${hsType}`, entry);
        }
      }

      // Build the roster from registration rows.
      const hosts: HostRow[] = [];
      for (const tab of REGISTRATION_TABS) {
        const rows = data[tab] ?? [];
        if (rows.length < 2) continue;
        const read = rowReader(rows[0]);
        for (const r of rows.slice(1)) {
          const regId = read(r, 'Submission ID');
          const email = read(r, 'Email').trim();
          const propertyType = read(r, 'Property Type');
          if (!regId && !email && !propertyType) continue; // skip blank/cleared rows
          const hsType = hsTypeForProperty(propertyType);
          const hs = byRegId.get(regId) ?? byEmailType.get(`${email.toLowerCase()}|${hsType}`);
          hosts.push({
            regId,
            email,
            propertyName: read(r, 'Property Name'),
            hostNames: read(r, 'Host Name(s)'),
            contactNumber: read(r, 'Contact Number'),
            propertyType,
            hsType,
            status: hs ? 'done' : 'not-started',
            signedBy: hs?.signedBy ?? '',
            signedAt: hs?.signedAt ?? '',
            hsSubmissionId: hs?.submissionId ?? '',
            withdrawn: !!regId && withdrawnSet.has(regId),
          });
        }
      }

      // Counts cover active (non-withdrawn) properties only.
      const active = hosts.filter(h => !h.withdrawn);
      const byType: Record<HSType, { total: number; done: number }> = {
        backyards: { total: 0, done: 0 },
        builds: { total: 0, done: 0 },
        farms: { total: 0, done: 0 },
        lifestyle: { total: 0, done: 0 },
      };
      for (const h of active) {
        byType[h.hsType].total += 1;
        if (h.status === 'done') byType[h.hsType].done += 1;
      }
      const counts = {
        total: active.length,
        done: active.filter(h => h.status === 'done').length,
        withdrawn: hosts.length - active.length,
        byType,
      };

      return json({ hosts, counts });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error('dashboard error:', error);
    return json({ error: 'Failed to load dashboard data', details: error instanceof Error ? error.message : 'Unknown' }, 500);
  }
};
