import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubmissions } from '../utils/storage';
import {
  formatNzBankAccountInput,
  NZ_ACCOUNT_NUMBER_ERROR,
  parseNzBankAccountNumber,
} from '../utils/bankAccount';
import { BrandHeader, Card, Btn, Field, Input } from '../components/ui';

// Where hosts give us the account to reimburse them into. The details are
// write-only from here: nothing is echoed back to the browser and nothing is
// kept on the device, so the only place to read them is the password-gated
// coordinator dashboard.

interface Errors {
  accountName?: string;
  accountNumber?: string;
}

export default function BankDetailsPage() {
  const navigate = useNavigate();
  // Pre-fill the property name from a local registration if there is one — it's
  // how coordinators match the account back to a host.
  const [propertyName, setPropertyName] = useState(
    () => getSubmissions().at(-1)?.propertyName ?? '',
  );
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    const next: Errors = {};
    if (!accountName.trim()) {
      next.accountName = 'Please enter the name on the account.';
    }
    if (!accountNumber.trim()) {
      next.accountNumber = 'Please enter your account number.';
    } else if (!parseNzBankAccountNumber(accountNumber)) {
      next.accountNumber = NZ_ACCOUNT_NUMBER_ERROR;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const parsed = parseNzBankAccountNumber(accountNumber);
    if (!parsed) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('/.netlify/functions/submit-bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyName: propertyName.trim(),
          accountName: accountName.trim(),
          accountNumber: parsed.formatted,
        }),
      });
      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as {
          error?: string;
          field?: keyof Errors;
        };
        // A rejected field belongs against that input, not in the red banner.
        if (err.field) {
          setErrors(current => ({ ...current, [err.field!]: err.error ?? 'Please check this field.' }));
          return;
        }
        throw new Error(
          err.error ??
            `We couldn't save your details (error ${response.status}). Nothing was saved — please try again shortly.`,
        );
      }
      // Clear the fields as soon as they're safely stored — no reason to leave
      // an account number sitting in the page.
      setAccountName('');
      setAccountNumber('');
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      <BrandHeader backTo="/" />

      <div className="mt-2 mb-5">
        <p className="italic text-[12px] text-ink-soft mb-0.5">Pūtea · Payment details</p>
        <h1 className="font-display text-[28px] sm:text-[32px] leading-[1.05] text-brand-green-deep">
          Bank account details
        </h1>
        <p className="text-[13px] text-ink-soft mt-1">
          So we can reimburse you for anything agreed during the Trails
        </p>
      </div>

      {submitted ? (
        <Card className="bg-brand-green-soft border-brand-green-soft text-center">
          <p className="font-display text-[22px] text-brand-green-deep">Ngā mihi · Thanks!</p>
          <p className="text-sm text-ink-soft mt-1 mb-4">
            Your account details are saved securely with the Sustainable Taranaki team. For your
            security they aren’t shown again here — if anything changes, just submit them again.
          </p>
          <div className="flex gap-3 justify-center">
            <Btn variant="primary" size="md" onClick={() => navigate('/')}>
              Back to portal
            </Btn>
            <Btn variant="ghost" size="md" onClick={() => setSubmitted(false)}>
              Enter another account
            </Btn>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card className="space-y-5">
            <div className="bg-brand-green-soft border border-brand-green-soft rounded-[10px] p-3">
              <p className="text-[13px] text-brand-green-ink">
                🔒 These details go straight to Sustainable Taranaki and are only visible to the
                coordinator team behind a password. They aren’t saved on this device and aren’t
                shown to other hosts or visitors.
              </p>
            </div>

            <Field
              label="Property name"
              htmlFor="bank-property"
              hint="So we can match the account to your registration."
            >
              <Input
                id="bank-property"
                type="text"
                value={propertyName}
                onChange={e => setPropertyName(e.target.value)}
                placeholder="Your property name"
              />
            </Field>

            <Field
              label="Account name"
              htmlFor="bank-account-name"
              error={errors.accountName}
              hint="Exactly as it appears on your bank account."
            >
              <Input
                id="bank-account-name"
                type="text"
                autoComplete="off"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                invalid={!!errors.accountName}
                placeholder="e.g. J & M Smith"
              />
            </Field>

            <Field
              label="Account number"
              htmlFor="bank-account-number"
              error={errors.accountNumber}
              hint="A 2 or 3 digit suffix is fine. Spaces or hyphens are both accepted."
            >
              <Input
                id="bank-account-number"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={accountNumber}
                onChange={e => setAccountNumber(formatNzBankAccountInput(e.target.value))}
                invalid={!!errors.accountNumber}
                placeholder="12-3456-7890123-00"
              />
            </Field>

            {submitError && (
              <div className="bg-danger/10 border border-danger rounded-[10px] p-3">
                <p className="text-danger text-sm font-medium">{submitError}</p>
                <p className="text-ink-soft text-[13px] mt-1.5">
                  Please try again. If it keeps failing, phone Suzy on{' '}
                  <a href="tel:+6421566185" className="text-brand-green-deep underline">
                    021 566 185
                  </a>{' '}
                  rather than emailing your account number.
                </p>
              </div>
            )}
          </Card>

          <Btn
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isSubmitting}
            className="mt-4"
          >
            {isSubmitting ? 'Saving…' : 'Save bank details'}
          </Btn>
        </form>
      )}
    </div>
  );
}
