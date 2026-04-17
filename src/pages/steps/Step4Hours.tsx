import type { FormData, TimeSlotKey, SlotState } from '../../types/form';
import type { ChangeHandler } from '../FormPage';
import TimeSlotGrid from '../../components/TimeSlotGrid';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
  onTimeSlotChange: (key: TimeSlotKey, value: SlotState) => void;
}

export default function Step4Hours({ data, errors: _errors, onChange, onTimeSlotChange }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-ink-soft text-sm">
        Choose which midweek slots you'd like to be open. Weekends are required for all hosts.
      </p>

      {/* Weekend notice */}
      <div className="bg-brand-green-soft rounded-xl p-4">
        <p className="text-sm font-semibold text-ink">
          Weekends — required for all hosts
        </p>
        <p className="text-sm text-ink-soft mt-1">
          Sat 31 Oct, Sun 1 Nov, Sat 7 Nov, Sun 8 Nov — open 10am to 4pm
        </p>
      </div>

      {/* Midweek slots */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-1">
          Midweek hours <span className="text-ink-soft font-normal">(optional)</span>
        </h3>
        <p className="text-xs text-ink-soft mb-3">
          Tap a slot to toggle it open or closed.
        </p>
        <TimeSlotGrid timeSlots={data.timeSlots} onChange={onTimeSlotChange} />
      </div>

      {/* Additional hours */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="additionalHours">
          Any other hours or arrangements? <span className="text-ink-soft font-normal">(optional)</span>
        </label>
        <p className="text-xs text-ink-soft mb-2">
          e.g. evening events, school group visits, special appointments
        </p>
        <textarea
          id="additionalHours"
          value={data.additionalHours}
          onChange={e => onChange('additionalHours', e.target.value)}
          rows={3}
          placeholder="Describe any additional opening times or arrangements…"
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green resize-y"
        />
      </div>
    </div>
  );
}
