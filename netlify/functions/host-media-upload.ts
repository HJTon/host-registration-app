import type { Context } from '@netlify/functions';
import { google } from 'googleapis';
import { Readable } from 'stream';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function getDriveClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

interface UploadRequest {
  mediaData: string;   // base64 encoded
  mimeType: string;
  filename: string;
  propertyName?: string; // used to create a subfolder
}

async function getOrCreateSubfolder(
  drive: ReturnType<typeof getDriveClient>,
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

  if (list.data.files && list.data.files.length > 0) {
    return list.data.files[0].id!;
  }

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
    const folderId = process.env.HOST_PHOTOS_DRIVE_FOLDER_ID;
    if (!folderId) {
      return new Response(JSON.stringify({ error: 'Drive folder ID not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const body: UploadRequest = await request.json();
    const { mediaData, mimeType, filename, propertyName } = body;

    if (!mediaData || !filename) {
      return new Response(JSON.stringify({ error: 'Missing required fields: mediaData, filename' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const base64Data = mediaData.includes(',') ? mediaData.split(',')[1] : mediaData;
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.byteLength > 4 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large — maximum 4 MB per photo' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const drive = getDriveClient();

    const targetFolderId = propertyName
      ? await getOrCreateSubfolder(drive, folderId, propertyName)
      : folderId;

    const uploadStream = new Readable();
    uploadStream.push(buffer);
    uploadStream.push(null);

    const file = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [targetFolderId],
      },
      media: {
        mimeType: mimeType || 'image/jpeg',
        body: uploadStream,
      },
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
    } catch (permErr) {
      console.warn('Could not set public permissions:', permErr instanceof Error ? permErr.message : permErr);
    }

    return new Response(JSON.stringify({
      success: true,
      fileId,
      webViewLink: file.data.webViewLink,
      filename,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });

  } catch (error) {
    console.error('Error uploading host photo:', error);
    return new Response(JSON.stringify({
      error: 'Failed to upload photo',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
};
