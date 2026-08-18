const NZ_ACCOUNT_DIGIT_COUNTS = new Set([15, 16]);

export const NZ_ACCOUNT_NUMBER_ERROR =
  'Enter a full NZ account number with a 2 or 3 digit suffix, e.g. 12-3456-7890123-00.';

export interface ParsedBankAccountNumber {
  digits: string;
  formatted: string;
}

/**
 * NZ domestic accounts are bank(2)-branch(4)-account(7)-suffix(2 or 3).
 * People commonly paste them with spaces, ASCII hyphens, or typographic
 * dashes, so validation is deliberately based on the digits.
 */
export function parseNzBankAccountNumber(value: unknown): ParsedBankAccountNumber | null {
  if (typeof value !== 'string') return null;

  const digits = value.normalize('NFKC').replace(/\D/g, '');
  if (!NZ_ACCOUNT_DIGIT_COUNTS.has(digits.length)) return null;

  return {
    digits,
    formatted: [digits.slice(0, 2), digits.slice(2, 6), digits.slice(6, 13), digits.slice(13)].join('-'),
  };
}

/** Format progressively while a host types, without ever losing leading zeroes. */
export function formatNzBankAccountInput(value: string): string {
  const digits = value.normalize('NFKC').replace(/\D/g, '');
  const parts = [digits.slice(0, 2), digits.slice(2, 6), digits.slice(6, 13), digits.slice(13)];
  return parts.filter(Boolean).join('-');
}
