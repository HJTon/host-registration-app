import type { Context } from '@netlify/functions';
import { google } from 'googleapis';
import { timingSafeEqual } from 'node:crypto';
import { Readable } from 'stream';

// Shared host-resource documents (info pack, guidelines, maps…).
//
// Coordinators upload PDFs from the password-gated dashboard; every host can
// then download them from the public Host documents page. Files live in a
// dedicated "Host Documents" Drive folder and are made public-readable, so the
// listing itself needs no Drive lookups beyond the folder contents.
//
//   action: 'list'    — public, returns the documents in the folder
//   action: 'upload'  — password-gated, adds a PDF
//   action: 'delete'  — password-gated, removes a PDF by id

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Netlify's synchronous function payload tops out around 6 MB, and base64
// inflates the body by ~33%, so keep the raw file comfortably under that.
const MAX_BYTES = 4 * 1024 * 1024;
const DOCS_SUBFOLDER = 'Host Documents';

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

function getDriveClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

type Drive = ReturnType<typeof getDriveClient>;

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
    fileData?: string;
    filename?: string;
    title?: string;
    id?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: 'Invalid body' }, 400);
  }

  const action = body.action ?? 'list';
  const mutating = action === 'upload' || action === 'delete';
  if (mutating && !passwordOk(body.password)) return json({ error: 'Unauthorised' }, 401);

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

    if (action === 'upload') {
      const { fileData, filename, title } = body;
      if (!fileData || !filename) return json({ error: 'Missing required fields: fileData, filename' }, 400);

      const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.byteLength === 0) return json({ error: 'Empty file' }, 400);
      if (buffer.byteLength > MAX_BYTES) return json({ error: 'File too large — maximum 4 MB per document' }, 413);

      // Keep a stable .pdf name on disk; the human-friendly title rides in the
      // file description so it can contain spaces/punctuation.
      const cleanName = filename.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'document.pdf';
      const safeName = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;

      const uploadStream = new Readable();
      uploadStream.push(buffer);
      uploadStream.push(null);

      const file = await drive.files.create({
        requestBody: {
          name: safeName,
          description: (title || safeName).trim(),
          parents: [folderId],
        },
        media: { mimeType: 'application/pdf', body: uploadStream },
        fields: 'id,name,description,webViewLink,size,createdTime',
        supportsAllDrives: true,
      });

      const fileId = file.data.id!;
      try {
        await drive.permissions.create({
          fileId,
          requestBody: { type: 'anyone', role: 'reader' },
          supportsAllDrives: true,
        });
      } catch (permErr) {
        console.warn('Could not set public permissions:', permErr instanceof Error ? permErr.message : permErr);
      }

      const doc: DocItem = {
        id: fileId,
        title: file.data.description || file.data.name || 'Untitled document',
        filename: file.data.name || safeName,
        webViewLink: file.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
        downloadLink: `https://drive.google.com/uc?export=download&id=${fileId}`,
        sizeBytes: file.data.size ? Number(file.data.size) : buffer.byteLength,
        uploadedAt: file.data.createdTime || new Date().toISOString(),
      };
      return json({ success: true, document: doc });
    }

    if (action === 'delete') {
      if (!body.id) return json({ error: 'Missing id' }, 400);
      // Verify the file really sits in our folder before deleting, so a stray id
      // can't be used to remove arbitrary Drive files.
      const meta = await drive.files.get({
        fileId: body.id,
        fields: 'id,parents',
        supportsAllDrives: true,
      }).catch(() => null);
      if (!meta?.data.parents?.includes(folderId)) {
        return json({ error: 'Document not found' }, 404);
      }
      await drive.files.delete({ fileId: body.id, supportsAllDrives: true });
      return json({ success: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error('documents error:', error);
    return json({ error: 'Request failed', details: error instanceof Error ? error.message : 'Unknown' }, 500);
  }
};
