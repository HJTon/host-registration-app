import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';
import FieldError from '../../components/FieldError';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
}

export default function Step1Details({ data, errors, onChange }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-ink-soft text-sm">
        Let's start with some basic information about you and your property.
      </p>

      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="email">
          Email address <span className="text-danger">*</span>
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={data.email}
          onChange={e => onChange('email', e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green min-h-[48px]"
        />
        {errors.email && <FieldError message={errors.email} />}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="propertyName">
          Property name <span className="text-danger">*</span>
        </label>
        <input
          id="propertyName"
          type="text"
          value={data.propertyName}
          onChange={e => onChange('propertyName', e.target.value)}
          placeholder="e.g. The Green Acre, Smith's Farm"
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green min-h-[48px]"
        />
        {errors.propertyName && <FieldError message={errors.propertyName} />}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="hostNames">
          Host name(s) <span className="text-danger">*</span>
        </label>
        <input
          id="hostNames"
          type="text"
          autoComplete="name"
          value={data.hostNames}
          onChange={e => onChange('hostNames', e.target.value)}
          placeholder="e.g. Jane & John Smith"
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green min-h-[48px]"
        />
        {errors.hostNames && <FieldError message={errors.hostNames} />}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="contactNumber">
          Contact phone number <span className="text-danger">*</span>
        </label>
        <input
          id="contactNumber"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={data.contactNumber}
          onChange={e => onChange('contactNumber', e.target.value)}
          placeholder="e.g. 021 123 4567"
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green min-h-[48px]"
        />
        {errors.contactNumber && <FieldError message={errors.contactNumber} />}
      </div>
    </div>
  );
}
