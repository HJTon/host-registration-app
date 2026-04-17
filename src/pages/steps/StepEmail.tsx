import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
}

export default function StepEmail({ data, errors, onChange }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-ink-soft text-sm">
        We'll use this to follow up with you about your registration.
      </p>

      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="email">
          Your email address
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={data.email}
          onChange={e => onChange('email', e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green min-h-[52px]"
        />
        {errors.email && (
          <p className="text-danger text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="propertyName">
          Property name
        </label>
        <input
          id="propertyName"
          type="text"
          value={data.propertyName}
          onChange={e => onChange('propertyName', e.target.value)}
          placeholder="e.g. The Green Acre, Smith's Farm"
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green min-h-[52px]"
        />
      </div>

      <p className="text-xs text-ink-soft">
        All questions are optional except your email — skip anything you don't have to hand and come back to it later.
      </p>
    </div>
  );
}
