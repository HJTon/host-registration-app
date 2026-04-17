import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';
import { getPropertyCategory, isTourType } from '../../types/form';
import VoiceInput from '../../components/VoiceInput';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
}

const KID_FRIENDLY_OPTIONS = [
  { value: 'yes', label: "Yes — we'd love to be promoted as having kid activities" },
  { value: 'maybe', label: 'Maybe — open to the idea' },
  { value: 'no', label: "No — we don't have specific activities for kids" },
];

export default function StepActivities({ data, errors: _errors, onChange }: Props) {
  const category = getPropertyCategory(data.propertyType);
  const isBackyard = category === 'backyard' || category === '';
  const isTour = isTourType(data.propertyType);

  return (
    <div className="space-y-6">
      <p className="text-ink-soft text-sm">All optional — skip what doesn't apply.</p>

      {isBackyard && (
        <div>
          <p className="text-sm font-medium text-ink mb-3">
            Are you interested in being promoted as having kid activities?
          </p>
          <div className="space-y-2">
            {KID_FRIENDLY_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors min-h-[52px] ${
                  data.kidFriendly === value
                    ? 'border-primary bg-brand-green-soft/30'
                    : 'border-line hover:border-line'
                }`}
              >
                <input
                  type="radio"
                  name="kidFriendly"
                  value={value}
                  checked={data.kidFriendly === value}
                  onChange={() => onChange('kidFriendly', value)}
                  className="w-5 h-5 accent-brand-green shrink-0"
                />
                <span className="text-sm text-ink">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {!isTour && (
        <div>
          <label className="block text-sm font-medium text-ink mb-1" htmlFor="talkTopic">
            Do you want to give a talk on a specific topic?
          </label>
          <p className="text-xs text-ink-soft mb-2">
            If you know the topic/s, please share them. e.g. "Yes — tips for keeping chooks" or "Maybe — composting demo"
          </p>
          <VoiceInput
            id="talkTopic"
            value={data.talkTopic}
            onChange={v => onChange('talkTopic', v)}
            rows={3}
            fieldHint="whether the host wants to give a talk at Sustainable Backyards 2026 and what topic"
          />
        </div>
      )}
    </div>
  );
}
