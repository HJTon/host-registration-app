import type { Context } from '@netlify/functions';
import { google } from 'googleapis';
import { timingSafeEqual } from 'node:crypto';

// Shared host-resource documents (info pack, guidelines, maps…).
//
// Coordinators upload PDFs from the password-gated dashboard; every host can
// then download them from the public Host documents page. Files live in a
// dedicated "Host Documents" Drive folder and are made public-readable.
//
// To keep large files off Netlify (whose request body tops out near 6 MB), the
// browser uploads straight to Drive via a resumable session this function
// hands out. Flow:
//
// Browser → Drive directly is blocked by CORS, so the bytes are relayed through
// this function in chunks: each chunk stays under Netlify's request limit, and
// the function → Drive hop is server-side (no CORS).
//
//   action: 'list'                  — public, returns the documents
//   action: 'create-upload-session' — gated, returns a Drive upload URL
//   action: 'upload-chunk'         — gated, relays one chunk to Drive
//   action: 'finalize'             — gated, makes the uploaded file public
//   action: 'delete'               — gated, removes a PDF by id

const UPLOAD_URL_PREFIX = 'https://www.googleapis.com/upload/drive/v3/files';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const DOCS_SUBFOLDER = 'Host Documents';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
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

function getCredentials() {
  return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
}

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({ credentials: getCredentials(), scopes: [DRIVE_SCOPE] });
  return google.drive({ version: 'v3', auth });
}

type Drive = ReturnType<typeof getDriveClient>;

async function getAccessToken(): Promise<string> {
  const auth = new google.auth.GoogleAuth({ credentials: getCredentials(), scopes: [DRIVE_SCOPE] });
  const client = await auth.getClient();
  const res = await client.getAccessToken();
  const token = typeof res === 'string' ? res : res?.token;
  if (!token) throw new Error('Could not obtain access token');
  return token;
}

function pdfName(filename: string): string {
  const clean = filename.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'document.pdf';
  return clean.toLowerCase().endsWith('.pdf') ? clean : `${clean}.pdf`;
}

async function getOrCreateSubfolder(drive: Drive, parentFolderId: string, folderName: string): Promise<string> {
  const safeName = folderName.replace(/[/\\?%*:|"<>]/g, '-').trim();
  const list = await drive.files.list({
    q: `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    fields: 'files(id)',
  });
  if (list.data.files && list.data.files.length > 0) return list.data.files[0].id!;

  const folder = await drive.files.create({
    requestBody: {
      name: safeName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    supportsAllDrives: true,
    fields: 'id',
  });
  return folder.data.id!;
}

// Resolve the documents folder. A dedicated env var wins; otherwise we nest a
// "Host Documents" subfolder under the existing photos folder so no extra
// configuration is required to get going.
async function resolveDocsFolderId(drive: Drive): Promise<string | null> {
  const dedicated = process.env.HOST_DOCS_DRIVE_FOLDER_ID;
  if (dedicated) return dedicated;
  const photosFolder = process.env.HOST_PHOTOS_DRIVE_FOLDER_ID;
  if (!photosFolder) return null;
  return getOrCreateSubfolder(drive, photosFolder, DOCS_SUBFOLDER);
}

interface DocItem {
  id: string;
  title: string;
  filename: string;
  webViewLink: string;
  downloadLink: string;
  sizeBytes: number;
  uploadedAt: string;
}

export default async (request: Request, _context: Context) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: {
    action?: string;
    password?: string;
    filename?: string;
    title?: string;
    size?: number;
    id?: string;
    uploadUrl?: string;
    chunk?: string;
    start?: number;
    total?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: 'Invalid body' }, 400);
  }

  const action = body.action ?? 'list';
  const mutating =
    action === 'create-upload-session' ||
    action === 'upload-chunk' ||
    action === 'finalize' ||
    action === 'delete';
  if (mutating && !passwordOk(body.password)) return json({ error: 'Unauthorised' }, 401);

  // Relaying a chunk needs no Drive folder lookup — handle it before that.
  if (action === 'upload-chunk') {
    const { uploadUrl, chunk, start, total } = body;
    if (!uploadUrl || !chunk || typeof start !== 'number' || typeof total !== 'number') {
      return json({ error: 'Missing chunk fields' }, 400);
    }
    if (!uploadUrl.startsWith(UPLOAD_URL_PREFIX)) {
      return json({ error: 'Invalid upload URL' }, 400);
    }
    const base64 = chunk.includes(',') ? chunk.split(',')[1] : chunk;
    const buffer = Buffer.from(base64, 'base64');
    const end = start + buffer.byteLength - 1;
    try {
      const accessToken = await getAccessToken();
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        redirect: 'manual', // Drive signals "more chunks" with 308 — don't follow it
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Range': `bytes ${start}-${end}/${total}`,
        },
        body: buffer,
      });
      if (res.status === 308) return json({ done: false });
      if (res.status === 200 || res.status === 201) {
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        return json({ done: true, id: data.id });
      }
      const details = await res.text().catch(() => '');
      console.error('chunk relay failed:', res.status, details);
      return json({ error: 'Chunk upload failed', details }, 502);
    } catch (err) {
      console.error('chunk relay error:', err);
      return json({ error: 'Chunk upload failed', details: err instanceof Error ? err.message : 'Unknown' }, 502);
    }
  }

  try {
    const drive = getDriveClient();
    const folderId = await resolveDocsFolderId(drive);
    if (!folderId) return json({ error: 'Documents folder not configured' }, 500);

    if (action === 'list') {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
        orderBy: 'createdTime desc',
        fields: 'files(id,name,description,webViewLink,size,createdTime)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      const documents: DocItem[] = (res.data.files ?? []).map(f => ({
        id: f.id!,
        title: f.description || f.name || 'Untitled document',
        filename: f.name || '',
        webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
        downloadLink: `https://drive.google.com/uc?export=download&id=${f.id}`,
        sizeBytes: f.size ? Number(f.size) : 0,
        uploadedAt: f.createdTime || '',
      }));
      return json({ documents });
    }

    // Start a resumable upload session and hand the URL to the browser, which
    // PUTs the file bytes straight to Drive — bypassing Netlify's size limit.
    if (action === 'create-upload-session') {
      const { filename, title, size } = body;
      if (!filename) return json({ error: 'Missing filename' }, 400);

      const safeName = pdfName(filename);
      const metadata = {
        name: safeName,
        description: (title || safeName).trim(),
        parents: [folderId],
        mimeType: 'application/pdf',
      };

      const accessToken = await getAccessToken();
      const initRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': 'application/pdf',
            ...(size ? { 'X-Upload-Content-Length': String(size) } : {}),
          },
          body: JSON.stringify(metadata),
        },
      );

      if (!initRes.ok) {
        const details = await initRes.text().catch(() => '');
        console.error('resumable init failed:', initRes.status, details);
        return json({ error: 'Could not start the upload', details }, 502);
      }
      const uploadUrl = initRes.headers.get('location');
      if (!uploadUrl) return json({ error: 'Drive did not return an upload URL' }, 502);

      return json({ uploadUrl, filename: safeName });
    }

    // After the browser finishes the PUT, make the file world-readable so hosts
    // can download it, and confirm it really landed in our folder.
    if (action === 'finalize') {
      if (!body.id) return json({ error: 'Missing id' }, 400);
      const meta = await drive.files
        .get({ fileId: body.id, fields: 'id,parents', supportsAllDrives: true })
        .catch(() => null);
      if (!meta?.data.parents?.includes(folderId)) return json({ error: 'Document not found' }, 404);
      try {
        await drive.permissions.create({
          fileId: body.id,
          requestBody: { type: 'anyone', role: 'reader' },
          supportsAllDrives: true,
        });
      } catch (permErr) {
        console.warn('Could not set public permissions:', permErr instanceof Error ? permErr.message : permErr);
      }
      return json({ success: true });
    }

    if (action === 'delete') {
      if (!body.id) return json({ error: 'Missing id' }, 400);
      // Verify the file really sits in our folder before removing it, so a stray
      // id can't be used to touch arbitrary Drive files.
      const meta = await drive.files
        .get({ fileId: body.id, fields: 'id,parents', supportsAllDrives: true })
        .catch(() => null);
      if (!meta?.data.parents?.includes(folderId)) return json({ error: 'Document not found' }, 404);
      // Trash rather than permanently delete: a service account with only
      // content-manager rights on a Shared Drive can trash but not hard-delete,
      // and trashing is reversible. Trashed files drop out of the list query.
      await drive.files.update({
        fileId: body.id,
        requestBody: { trashed: true },
        supportsAllDrives: true,
      });
      return json({ success: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error('documents error:', error);
    return json({ error: 'Request failed', details: error instanceof Error ? error.message : 'Unknown' }, 500);
  }
};
