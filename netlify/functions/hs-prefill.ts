import type { Context } from '@netlify/functions';
import { google } from 'googleapis';

// Pre-fill a returning host's 2026 H&S form from their 2025 response.
//
// Reads last year's Google Form response sheet (frozen historical data) and maps
// its columns onto the 2026 schema field ids. Matching is by email address.
// Builds had no 2025 responses sheet, so it returns nothing.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type HSType = 'backyards' | 'builds' | 'farms';

function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

// 2025 response sheets (defaults can be overridden via env). Builds → none.
const SOURCE: Record<HSType, { env: string; id: string } | null> = {
  backyards: { env: 'HS_2025_BACKYARDS_SHEET_ID', id: '19XR2tG-T0ex2JHVOslVnzbStCf3oGGnvW0CTV4X9qmU' },
  farms: { env: 'HS_2025_FARMS_SHEET_ID', id: '1v-bGDM0dQneFFS1yB7gS_SQEuBrlLRCen6qxQR3nUPw' },
  builds: null,
};

// Hazard / checkbox option labels used to recover selections from the stored,
// comma-joined 2025 text (option labels themselves contain commas, so we match
// by substring rather than splitting).
const OPTS = {
  bk: {
    parking: ['On street', 'On highway/main road', 'In a paddock or other area on the property'],
    paths: ['Slippery', 'Uneven surfaces eg no steps on slopes, protruding roots', 'Holes, such as old post holes etc', 'Steep gradients without steps'],
    steps: ['Drop off greater than 1m that is not fenced', 'Unexpected drop offs', 'Steep steps without handrails'],
    water: ['Pool - unfenced', 'Lakes and ponds', 'Rivers or streams'],
    other: ['Chemicals accessible', 'Garden tools accessible, particularly with sharp blades.', 'Animals that may potentially harm people eg dogs, horses, bulls, bees', 'Low hanging or exposed power lines', 'Machines in operation'],
  },
  fm: {
    parking: ['On street', 'On highway/main road', 'In a paddock or other area on the property'],
    age: ['Young children are suitable visitors', 'Older children are suitable visitors', 'Elderly or mobility challenges are suitable visitors', 'Adults with reasonable mobility are suitable visitors'],
    trails: ['Slippery surfaces', 'Uneven surfaces eg paddocks, no steps on slopes, protruding roots', 'Hidden holes e.g. from rabbits or old post holes etc', 'Steep gradients without steps'],
    steep: ['Drop off greater than 1m that is not fenced', 'Unexpected drop-offs', 'Steep steps without handrails'],
    water: ['Accessible lakes or ponds', 'Accessible rivers or streams'],
    animals: ['Animals roaming', 'Accessible platforms or equipment used with animals', 'Disease passed from touching of animals'],
    machinery: ['Machinery in operation', 'Crushing hazards', 'Chemicals accessible', 'Agricultural tools accessible, particularly with sharp blades.'],
    biosecurity: ['Risk of disease or invasive species from outside farm transferred to livestock', 'Risk of disease or invasive species from outside farm transferred to plant species'],
    other: ['Low hanging or exposed power lines', 'Accessible farm rubbish'],
  },
};

interface ColMap {
  col: number;
  field: string;
  kind: 'group' | 'plan' | 'value' | 'yesno';
  options?: string[];
}

const MAPS: Record<HSType, ColMap[]> = {
  backyards: [
    { col: 4, field: 'parking', kind: 'group', options: OPTS.bk.parking },
    { col: 5, field: 'parking_plan', kind: 'plan' },
    { col: 6, field: 'paths', kind: 'group', options: OPTS.bk.paths },
    { col: 7, field: 'paths_plan', kind: 'plan' },
    { col: 8, field: 'steps', kind: 'group', options: OPTS.bk.steps },
    { col: 9, field: 'steps_plan', kind: 'plan' },
    { col: 10, field: 'water', kind: 'group', options: OPTS.bk.water },
    { col: 11, field: 'water_plan', kind: 'plan' },
    { col: 12, field: 'other', kind: 'group', options: OPTS.bk.other },
    { col: 13, field: 'other_plan', kind: 'plan' },
    { col: 14, field: 'firstAid', kind: 'yesno' },
    { col: 15, field: 'evacPoint', kind: 'yesno' },
    { col: 16, field: 'vehicleAccess', kind: 'yesno' },
    { col: 19, field: 'siteVisit', kind: 'value' },
  ],
  farms: [
    { col: 4, field: 'parking', kind: 'group', options: OPTS.fm.parking },
    { col: 5, field: 'vehicleCapacity', kind: 'value' },
    { col: 6, field: 'parkingToTour', kind: 'value' },
    { col: 7, field: 'tourOutline', kind: 'value' },
    { col: 8, field: 'ageSuitability', kind: 'group', options: OPTS.fm.age },
    { col: 9, field: 'clothingFootwear', kind: 'value' },
    { col: 10, field: 'trails', kind: 'group', options: OPTS.fm.trails },
    { col: 11, field: 'trails_plan', kind: 'plan' },
    { col: 12, field: 'steepSteps', kind: 'group', options: OPTS.fm.steep },
    { col: 13, field: 'steepSteps_plan', kind: 'plan' },
    { col: 14, field: 'water', kind: 'group', options: OPTS.fm.water },
    { col: 15, field: 'water_plan', kind: 'plan' },
    { col: 16, field: 'animals', kind: 'group', options: OPTS.fm.animals },
    { col: 17, field: 'animals_plan', kind: 'plan' },
    { col: 18, field: 'machinery', kind: 'group', options: OPTS.fm.machinery },
    { col: 19, field: 'machinery_plan', kind: 'plan' },
    { col: 20, field: 'biosecurity', kind: 'group', options: OPTS.fm.biosecurity },
    { col: 21, field: 'biosecurity_plan', kind: 'plan' },
    { col: 22, field: 'other', kind: 'group', options: OPTS.fm.other },
    { col: 23, field: 'other_plan', kind: 'plan' },
    { col: 24, field: 'firstAid', kind: 'yesno' },
    { col: 25, field: 'emergencyPlan', kind: 'value' },
    { col: 28, field: 'siteVisit', kind: 'value' },
  ],
  builds: [],
};

function parseGroup(raw: string, options: string[]): { selected: string[]; other: string } {
  const lower = raw.toLowerCase();
  const selected: string[] = [];
  let remainder = raw;
  for (const opt of options) {
    if (lower.includes(opt.toLowerCase())) {
      selected.push(opt);
      // remove the matched substring (case-insensitive, first occurrence)
      const idx = remainder.toLowerCase().indexOf(opt.toLowerCase());
      if (idx >= 0) remainder = remainder.slice(0, idx) + remainder.slice(idx + opt.length);
    }
  }
  // Whatever readable text remains (minus "None" and separators) becomes "Other".
  const leftover = remainder
    .replace(/\bnone\.?\b/gi, '')
    .replace(/[,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  let other = '';
  if (/[a-z0-9]/i.test(leftover)) {
    other = leftover;
    selected.push('Other');
  }
  return { selected, other };
}

function parseYesNo(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (!t) return '';
  if (t.startsWith('yes')) return 'Yes';
  if (t.startsWith('no')) return 'No';
  return '';
}

export default async (request: Request, _context: Context) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const type = (url.searchParams.get('type') || '') as HSType;
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();

  const ok = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });

  if (!email || !MAPS[type]) return ok({ found: false });

  const source = SOURCE[type];
  if (!source) return ok({ found: false }); // builds → no last-year data

  const spreadsheetId = process.env[source.env] || source.id;

  try {
    const sheets = getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:AZ10000', // first (responses) sheet
    });
    const rows = res.data.values ?? [];
    if (rows.length < 2) return ok({ found: false });

    // Locate the email column from the header row (fallback to column B).
    const header = rows[0].map(h => String(h).toLowerCase());
    let emailCol = header.findIndex(h => h.includes('email'));
    if (emailCol === -1) emailCol = 1;

    // Latest matching row wins (responses are appended chronologically).
    let match: string[] | null = null;
    for (let i = rows.length - 1; i >= 1; i--) {
      const cell = String(rows[i][emailCol] ?? '').trim().toLowerCase();
      if (cell && cell === email) { match = rows[i] as string[]; break; }
    }
    if (!match) return ok({ found: false });

    const fields: Record<string, string | string[]> = {};
    for (const m of MAPS[type]) {
      const raw = String(match[m.col] ?? '').trim();
      if (!raw) continue;
      if (m.kind === 'group') {
        const { selected, other } = parseGroup(raw, m.options ?? []);
        if (selected.length) fields[m.field] = selected;
        if (other) fields[`${m.field}_other`] = other;
      } else if (m.kind === 'yesno') {
        const v = parseYesNo(raw);
        if (v) fields[m.field] = v;
      } else {
        fields[m.field] = raw; // plan + value copy across directly
      }
    }

    return ok({ found: Object.keys(fields).length > 0, fields });
  } catch (error) {
    console.error('hs-prefill error:', error);
    // Degrade gracefully — the form simply starts blank.
    return ok({ found: false });
  }
};
