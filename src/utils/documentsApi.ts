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

// Read a Blob (a file slice) into bare base64 (no data: prefix).
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Drive resumable chunks must be a multiple of 256 KB (except the last). 3 MB
// keeps each relayed request well under Netlify's ~6 MB body limit once base64
// inflates it.
const CHUNK_BYTES = 3 * 1024 * 1024;

// Upload by relaying chunks through our function (browser → Drive directly is
// blocked by CORS). 1) get a resumable session, 2) relay each chunk, 3) make
// the finished file public.
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

  const total = file.size;
  let start = 0;
  let id: string | undefined;

  while (start < total) {
    const end = Math.min(start + CHUNK_BYTES, total);
    const chunk = await blobToBase64(file.slice(start, end));
    const res = await call<{ done: boolean; id?: string }>('upload-chunk', {
      password: getDashboardKey(),
      uploadUrl,
      chunk,
      start,
      total,
    });
    onProgress?.(end / total);
    if (res.done) {
      id = res.id;
      break;
    }
    start = end;
  }

  if (!id) throw new Error('Upload did not complete — please try again');
  await call('finalize', { password: getDashboardKey(), id });
}

export async function deleteDocument(id: string): Promise<void> {
  await call('delete', { password: getDashboardKey(), id });
}
