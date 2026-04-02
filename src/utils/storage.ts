import type { FormData, SlotState } from '../types/form';
import { getInitialFormData } from '../types/form';

const DRAFT_KEY = 'host-registration-draft-2026';
const SUBMISSIONS_KEY = 'host-submissions-2026';

type DraftData = Omit<FormData, 'photos' | 'parkingPhotos'>;

// A saved submission stored locally so the host can return and edit it
export interface SubmittedRegistration {
  id: string;
  propertyType: string;
  propertyName: string;
  submittedAt: string; // ISO string
  formData: DraftData;
}

// ── Draft ────────────────────────────────────────────────────────────────────

// Migrate old boolean timeSlots values (from before the 3-state toggle) to SlotState strings
function migrateTimeSlots(slots: Record<string, SlotState | boolean>): Record<string, SlotState> {
  const result: Record<string, SlotState> = {};
  for (const [key, value] of Object.entries(slots)) {
    if (typeof value === 'boolean') {
      result[key] = value ? 'open' : 'closed';
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function saveDraft(data: FormData): void {
  const { photos: _photos, parkingPhotos: _parking, ...rest } = data;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
}

export function loadDraft(): FormData | null {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DraftData;
    if (parsed.timeSlots) {
      parsed.timeSlots = migrateTimeSlots(
        parsed.timeSlots as unknown as Record<string, SlotState | boolean>,
      ) as FormData['timeSlots'];
    }
    return { ...getInitialFormData(), ...parsed, photos: [], parkingPhotos: [] };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

export function hasDraft(): boolean {
  return localStorage.getItem(DRAFT_KEY) !== null;
}

// ── Submitted registrations ──────────────────────────────────────────────────

export function getSubmissions(): SubmittedRegistration[] {
  const raw = localStorage.getItem(SUBMISSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SubmittedRegistration[];
  } catch {
    return [];
  }
}

export function saveSubmission(registration: SubmittedRegistration): void {
  const existing = getSubmissions();
  // Replace if same ID already exists, otherwise append
  const idx = existing.findIndex(s => s.id === registration.id);
  if (idx >= 0) {
    existing[idx] = registration;
  } else {
    existing.push(registration);
  }
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(existing));
}

export function getSubmissionById(id: string): SubmittedRegistration | null {
  return getSubmissions().find(s => s.id === id) ?? null;
}

export function generateSubmissionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
