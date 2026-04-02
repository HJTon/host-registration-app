import type { FormData } from '../types/form';

// Validation only runs at final submit — all steps are freely skippable
export function validateStep(_step: number, data: FormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.email.trim()) {
    errors.email = 'An email address is needed so Suzy can follow up with you. Go back to Step 1 to add it.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'That email address doesn\'t look right. Go back to Step 1 to fix it.';
  }

  return errors;
}
