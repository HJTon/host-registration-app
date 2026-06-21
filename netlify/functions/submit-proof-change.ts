import type { Context } from '@netlify/functions';
import { google } from 'googleapis';
import { Readable } from 'stream';

// Host corrections to a proof document. Each change the host lists becomes its
// own row in the "Proof Changes" tab, so coordinators see every correction in
// one sortable place. An optional photo (e.g. a snap of a marked-up page) is
// uploaded to a "Proof Markups" Drive folder and linked from the row.

const TAB_NAME = 'Proof Changes 2026';
const SPREADSHEET_ID_ENV = 'HOST_FORM_SPREADSHEET_ID';
const MARKUPS_SUBFOLDER = 'Proof Markups';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SHEET_HEADERS = [
  'Submitted At',
  'Name',
  'Property Name',
  'Email',
  'Document',
  'Page',
  'Current Text',
  'Suggested Change',
  'Comment',
  'Photo',
];

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function ensureTab(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string): Promise<void> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  if (meta.data.sheets?.some(s => s.properties?.title === TAB_NAME)) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: TAB_NAME } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${TAB_NAME}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [SHEET_HEADERS] },
  });
}

async function getOrCreateSubfolder(
  drive: ReturnType<typeof google.drive>,
  parentFolderId: string,
  folderName: string,
): Promise<string> {
  const safeName = folderName.replace(/[/\\?%*:|"<>]/g, '-').trim();
  const list = await drive.files.list({
    q: `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    fields: 'files(id)',
  });
  if (list.data.files && list.data.files.length > 0) return list.data.files[0].id!;
  const folder = await drive.files.create({
    requestBody: { name: safeName, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] },
    supportsAllDrives: true,
    fields: 'id',
  });
  return folder.data.id!;
}

async function uploadMarkupPhoto(
  drive: ReturnType<typeof google.drive>,
  photoData: string,
  mimeType: string,
  filename: string,
): Promise<string | null> {
  const parent = process.env.HOST_PHOTOS_DRIVE_FOLDER_ID;
  if (!parent) return null;
  const base64 = photoData.includes(',') ? photoData.split(',')[1] : photoData;
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.byteLength === 0 || buffer.byteLength > 6 * 1024 * 1024) return null;

  const folderId = await getOrCreateSubfolder(drive, parent, MARKUPS_SUBFOLDER);
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const file = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType: mimeType || 'image/jpeg', body: stream },
    fields: 'id,webViewLink',
    supportsAllDrives: true,
  });
  const fileId = file.data.id!;
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { type: 'anyone', role: 'reader' },
      supportsAllDrives: true,
    });
  } catch (err) {
    console.warn('Could not set markup photo public:', err instanceof Error ? err.message : err);
  }
  return file.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
}

interface ChangeItem {
  page?: string;
  current?: string;
  suggested?: string;
}
interface SubmitBody {
  name?: string;
  propertyName?: string;
  email?: string;
  document?: string;
  comment?: string;
  changes?: ChangeItem[];
  photoData?: string;
  photoMime?: string;
}

export default async (request: Request, _context: Context) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return json({ error: 'Invalid body' }, 400);
  }

  const changes = (body.changes ?? []).filter(
    c => (c.page || c.current || c.suggested)?.toString().trim(),
  );
  const hasComment = !!body.comment?.trim();
  const hasPhoto = !!body.photoData;
  if (changes.length === 0 && !hasComment && !hasPhoto) {
    return json({ error: 'Please describe at least one change, add a comment, or attach a photo.' }, 400);
  }

  const spreadsheetId = process.env[SPREADSHEET_ID_ENV];
  if (!spreadsheetId) return json({ error: 'Spreadsheet not configured' }, 500);

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    let photoLink = '';
    if (hasPhoto) {
      const safeProp = (body.propertyName || body.name || 'host').replace(/[^a-zA-Z0-9]/g, '-');
      const ext = (body.photoMime || 'image/jpeg').includes('png') ? 'png' : 'jpg';
      const filename = `${safeProp}_proof-markup_${Date.now().toString(36)}.${ext}`;
      photoLink = (await uploadMarkupPhoto(drive, body.photoData!, body.photoMime || 'image/jpeg', filename)) ?? '';
    }

    await ensureTab(sheets, spreadsheetId);

    const submittedAt = new Date().toISOString();
    const meta = [body.name ?? '', body.propertyName ?? '', body.email ?? '', body.document ?? ''];
    const comment = body.comment ?? '';

    // One row per change. If there are no itemised changes (just a comment or a
    // photo), still write a single summary row so it isn't lost.
    const rows: string[][] = changes.length
      ? changes.map((c, i) => [
          submittedAt,
          ...meta,
          c.page ?? '',
          c.current ?? '',
          c.suggested ?? '',
          i === 0 ? comment : '', // comment + photo belong to the submission, not each row
          i === 0 ? photoLink : '',
        ])
      : [[submittedAt, ...meta, '', '', '', comment, photoLink]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${TAB_NAME}'!A:A`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: rows },
    });

    return json({ success: true, rows: rows.length });
  } catch (error) {
    console.error('Error submitting proof change:', error);
    return json({ error: 'Failed to submit', details: error instanceof Error ? error.message : 'Unknown' }, 500);
  }
};
