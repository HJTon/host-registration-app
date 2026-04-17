import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
}

const CONTACT_METHODS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'msg', label: 'Messenger' },
  { value: 'text', label: 'Text / SMS' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone call' },
];

export default function StepContact({ data, errors: _errors, onChange }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-ink-soft text-sm">
        Who will be hosting visitors on the day?
      </p>

      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="hostNames">
          Host name(s)
        </label>
        <input
          id="hostNames"
          type="text"
          autoComplete="name"
          value={data.hostNames}
          onChange={e => onChange('hostNames', e.target.value)}
          placeholder="e.g. Jane & John Smith"
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green min-h-[52px]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="contactNumber">
          Contact phone number
        </label>
        <input
          id="contactNumber"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={data.contactNumber}
          onChange={e => onChange('contactNumber', e.target.value)}
          placeholder="e.g. 021 123 4567"
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green min-h-[52px]"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-ink mb-1">
          Best ways to communicate with you
        </p>
        <p className="text-xs text-ink-soft mb-2">Select all that apply</p>
        <div className="space-y-1.5">
          {CONTACT_METHODS.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-3 px-3 py-2.5 border border-line rounded-lg cursor-pointer hover:bg-cream-soft transition-colors min-h-[44px]"
            >
              <input
                type="checkbox"
                checked={data.preferredContact.includes(value)}
                onChange={() => {
                  const next = data.preferredContact.includes(value)
                    ? data.preferredContact.filter(v => v !== value)
                    : [...data.preferredContact, value];
                  onChange('preferredContact', next);
                }}
                className="w-5 h-5 accent-brand-green shrink-0"
              />
              <span className="text-sm text-ink">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
