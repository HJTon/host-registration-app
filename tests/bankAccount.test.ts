import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatNzBankAccountInput,
  parseNzBankAccountNumber,
} from '../src/utils/bankAccount.ts';

test('accepts standard NZ accounts with two and three digit suffixes', () => {
  assert.equal(parseNzBankAccountNumber('12-3456-7890123-00')?.formatted, '12-3456-7890123-00');
  assert.equal(parseNzBankAccountNumber('12-3456-7890123-000')?.formatted, '12-3456-7890123-000');
});

test('normalises spaces, missing separators, and typographic dashes', () => {
  const expected = '12-3456-7890123-00';
  assert.equal(parseNzBankAccountNumber('12 3456 7890123 00')?.formatted, expected);
  assert.equal(parseNzBankAccountNumber('123456789012300')?.formatted, expected);
  assert.equal(parseNzBankAccountNumber(' 12–3456–7890123–00 ')?.formatted, expected);
});

test('preserves leading zeroes in the suffix', () => {
  assert.equal(formatNzBankAccountInput('123456789012300'), '12-3456-7890123-00');
});

test('rejects incomplete and overlong accounts', () => {
  assert.equal(parseNzBankAccountNumber('12-3456-7890123-0'), null);
  assert.equal(parseNzBankAccountNumber('12-3456-7890123-0000'), null);
  assert.equal(formatNzBankAccountInput('12-3456-7890123-0000'), '12-3456-7890123-0000');
});
