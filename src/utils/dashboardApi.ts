// Client helper for the password-gated coordinator dashboard function.
// The shared password is held in sessionStorage (cleared when the tab closes)
// and sent with every request; the function enforces it server-side.

import type { HSResponse, HSType } from '../types/healthSafety';

const KEY = 'dashboard-key';

export function getDashboardKey(): string {
  return sessionStorage.getItem(KEY) ?? '';
}
export function setDashboardKey(key: string): void {
  sessionStorage.setItem(KEY, key);
}
export function clearDashboardKey(): void {
  sessionStorage.removeItem(KEY);
}

export class DashboardAuthError extends Error {}

export interface DashboardHost {
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

export interface HSCounts {
  total: number;
  done: number;
  byType: Record<HSType, { total: number; done: number }>;
}

async function call<T>(action: string, extra: Record<string, unknown> = {}, password?: string): Promise<T> {
  const res = await fetch('/.netlify/functions/dashboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: password ?? getDashboardKey(), action, ...extra }),
  });
  if (res.status === 401) throw new DashboardAuthError('Incorrect password');
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? 'Request failed');
  }
  return (await res.json()) as T;
}

// Verify a password (used by the login form before storing it).
export async function dashboardLogin(password: string): Promise<void> {
  await call<{ ok: boolean }>('login', {}, password);
  setDashboardKey(password);
}

export async function fetchHSList(): Promise<{ hosts: DashboardHost[]; counts: HSCounts }> {
  return call('hs-list');
}

export async function fetchHSRecord(submissionId: string): Promise<{ found: boolean; response?: HSResponse }> {
  return call('hs-record', { submissionId });
}
