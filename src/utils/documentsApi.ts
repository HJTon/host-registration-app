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

// Read a File into a base64 data URL for the JSON upload body.
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadDocument(file: File, title: string): Promise<HostDocument> {
  const fileData = await fileToBase64(file);
  const { document } = await call<{ document: HostDocument }>('upload', {
    password: getDashboardKey(),
    fileData,
    filename: file.name,
    title: title.trim() || file.name,
  });
  return document;
}

export async function deleteDocument(id: string): Promise<void> {
  await call('delete', { password: getDashboardKey(), id });
}
