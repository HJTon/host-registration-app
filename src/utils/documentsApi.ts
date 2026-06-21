// Client helpers for the shared host-resource documents.
//
// Listing is public (used by the host-facing Documents page). Uploading and
// deleting reuse the coordinator dashboard password, held in sessionStorage by
// dashboardApi and enforced server-side.

import { getDashboardKey } from './dashboardApi';

export interface HostDocument {
  id: string;
  title: string;
  filename: string;
  webViewLink: string;
  downloadLink: string;
  sizeBytes: number;
  uploadedAt: string;
}

const ENDPOINT = '/.netlify/functions/documents';

async function call<T>(action: string, extra: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...extra }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? 'Request failed');
  }
  return (await res.json()) as T;
}

// Public — no password.
export async function listDocuments(): Promise<HostDocument[]> {
  const { documents } = await call<{ documents: HostDocument[] }>('list');
  return documents;
}

// PUT the file straight to the Drive resumable session URL. Using XHR (rather
// than fetch) so we can report upload progress for large files. The session URL
// is pre-authorised, so no auth header is needed here.
function putToDrive(url: string, file: File, onProgress?: (fraction: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', 'application/pdf');
    xhr.upload.onprogress = e => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { id?: string };
          if (data.id) resolve(data.id);
          else reject(new Error('Upload finished but Drive returned no file id'));
        } catch {
          reject(new Error('Upload finished but the response was unreadable'));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed — check your connection and try again'));
    xhr.send(file);
  });
}

// Direct browser → Drive upload, so there's no Netlify request-size limit.
// 1) ask the function for a resumable upload URL, 2) PUT the bytes to Drive,
// 3) ask the function to make the new file public.
export async function uploadDocument(
  file: File,
  title: string,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  const { uploadUrl } = await call<{ uploadUrl: string }>('create-upload-session', {
    password: getDashboardKey(),
    filename: file.name,
    title: title.trim() || file.name,
    size: file.size,
  });
  const id = await putToDrive(uploadUrl, file, onProgress);
  await call('finalize', { password: getDashboardKey(), id });
}

export async function deleteDocument(id: string): Promise<void> {
  await call('delete', { password: getDashboardKey(), id });
}
