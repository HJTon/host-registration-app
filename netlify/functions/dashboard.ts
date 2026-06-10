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
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

// Registration tabs (one per property type) — see submit-host-form.ts.
const REGISTRATION_TABS = [
  'Backyards', 'Community Gardens', 'School Gardens', 'Builds', 'Farms', 'Lifestyle Blocks',
];
const HS_TABS: Record<HSType, string> = {
  backyards: getHSTabName('backyards'),
  builds: getHSTabName('builds'),
  farms: getHSTabName('farms'),
};

function hsTypeForProperty(propertyType: string): HSType {
  if (propertyType === 'build') return 'builds';
  if (propertyType === 'farm' || propertyType === 'lifestyle-block') return 'farms';
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
}

export default async (request: Request, _context: Context) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { password?: string; action?: string; submissionId?: string };
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

    if (action === 'hs-list') {
      const wanted = [...REGISTRATION_TABS, ...Object.values(HS_TABS)];
      const data = await fetchTabs(sheets, spreadsheetId, wanted);

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
          });
        }
      }

      // Counts overall + per H&S type.
      const byType: Record<HSType, { total: number; done: number }> = {
        backyards: { total: 0, done: 0 },
        builds: { total: 0, done: 0 },
        farms: { total: 0, done: 0 },
      };
      for (const h of hosts) {
        byType[h.hsType].total += 1;
        if (h.status === 'done') byType[h.hsType].done += 1;
      }
      const counts = {
        total: hosts.length,
        done: hosts.filter(h => h.status === 'done').length,
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
