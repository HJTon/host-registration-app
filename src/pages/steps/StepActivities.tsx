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
  { value: 'yes', label: "Yes — we'd love to be promoted as Kid Friendly" },
  { value: 'maybe', label: 'Maybe — open to the idea' },
  { value: 'no', label: "No — not focusing on children's activities" },
];

export default function StepActivities({ data, errors: _errors, onChange }: Props) {
  const category = getPropertyCategory(data.propertyType);
  const isBackyard = category === 'backyard' || category === '';
  const isTour = isTourType(data.propertyType);

  return (
    <div className="space-y-6">
      <p className="text-text-secondary text-sm">All optional — skip what doesn't apply.</p>

      {isBackyard && (
        <div>
          <p className="text-sm font-medium text-text-primary mb-3">
            Are you interested in being promoted as a 'Kid Friendly' property and running activities for children?
          </p>
          <div className="space-y-2">
            {KID_FRIENDLY_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors min-h-[52px] ${
                  data.kidFriendly === value
                    ? 'border-primary bg-secondary/30'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="kidFriendly"
                  value={value}
                  checked={data.kidFriendly === value}
                  onChange={() => onChange('kidFriendly', value)}
                  className="w-5 h-5 accent-primary shrink-0"
                />
                <span className="text-sm text-text-primary">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {!isTour && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="talkTopic">
            Do you want to give a talk on a specific topic?
          </label>
          <p className="text-xs text-text-secondary mb-2">
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
