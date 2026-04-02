import type { TimeSlotKey, TimeSlots, SlotState } from '../types/form';

interface TimeSlotGridProps {
  timeSlots: TimeSlots;
  onChange: (key: TimeSlotKey, value: SlotState) => void;
}

const WEEKEND_DAYS: { key: string; label: string }[] = [
  { key: 'sat31Oct', label: 'Sat 31 Oct' },
  { key: 'sun1Nov', label: 'Sun 1 Nov' },
  { key: 'sat7Nov', label: 'Sat 7 Nov' },
  { key: 'sun8Nov', label: 'Sun 8 Nov' },
];

const MIDWEEK_DAYS: { key: string; label: string }[] = [
  { key: 'fri30Oct', label: 'Fri 30 Oct' },
  { key: 'mon2Nov', label: 'Mon 2 Nov' },
  { key: 'tue3Nov', label: 'Tue 3 Nov' },
  { key: 'wed4Nov', label: 'Wed 4 Nov' },
  { key: 'thu5Nov', label: 'Thu 5 Nov' },
  { key: 'fri6Nov', label: 'Fri 6 Nov' },
];

function nextState(current: SlotState): SlotState {
  if (current === 'open') return 'possible';
  if (current === 'possible') return 'closed';
  return 'open';
}

function SlotButton({
  slotKey,
  timeSlots,
  onChange,
}: {
  slotKey: TimeSlotKey;
  timeSlots: TimeSlots;
  onChange: (key: TimeSlotKey, value: SlotState) => void;
}) {
  const state = timeSlots[slotKey];
  const buttonClass =
    state === 'open'
      ? 'bg-primary text-white'
      : state === 'possible'
        ? 'bg-amber-400 text-white'
        : 'bg-gray-200 text-gray-600 hover:bg-gray-300';

  return (
    <button
      type="button"
      onClick={() => onChange(slotKey, nextState(state))}
      className={`min-w-[90px] min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${buttonClass}`}
    >
      {state === 'open' ? 'Open' : state === 'possible' ? 'Possible' : 'Closed'}
    </button>
  );
}

function DayTable({ days, timeSlots, onChange, sectionLabel, hint }: {
  days: { key: string; label: string }[];
  timeSlots: TimeSlots;
  onChange: (key: TimeSlotKey, value: SlotState) => void;
  sectionLabel: string;
  hint: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-text-primary mb-1">{sectionLabel}</p>
      <p className="text-xs text-text-secondary mb-2">{hint}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[340px]">
          <thead>
            <tr>
              <th className="text-left py-2 pr-4 text-sm font-medium text-text-secondary w-28"></th>
              <th className="py-2 px-2 text-center text-sm font-semibold text-text-primary">10am – 1pm</th>
              <th className="py-2 px-2 text-center text-sm font-semibold text-text-primary">1pm – 4pm</th>
            </tr>
          </thead>
          <tbody>
            {days.map(({ key, label }) => {
              const morningKey = `${key}_morning` as TimeSlotKey;
              const afternoonKey = `${key}_afternoon` as TimeSlotKey;
              return (
                <tr key={key} className="border-t border-gray-100">
                  <td className="py-2 pr-4 text-sm font-medium text-text-primary">{label}</td>
                  <td className="py-2 px-2 text-center">
                    <SlotButton slotKey={morningKey} timeSlots={timeSlots} onChange={onChange} />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <SlotButton slotKey={afternoonKey} timeSlots={timeSlots} onChange={onChange} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TimeSlotGrid({ timeSlots, onChange }: TimeSlotGridProps) {
  return (
    <div className="space-y-6">
      <DayTable
        days={WEEKEND_DAYS}
        timeSlots={timeSlots}
        onChange={onChange}
        sectionLabel="Weekends"
        hint="All Backyards properties are expected to be open on weekends with two people available (tours & welcome desk). Tap to close a slot if needed (i.e. you are a school or community garden)."
      />
      <DayTable
        days={MIDWEEK_DAYS}
        timeSlots={timeSlots}
        onChange={onChange}
        sectionLabel="Midweek (optional)"
        hint="Tap a slot to mark it open. Tap to 'Possible' if being open is reliant on nearby hosts also being open."
      />
      <p className="text-xs text-text-secondary">
        Toggle: <span className="font-semibold text-primary">Open</span> → <span className="font-semibold text-amber-500">Possible</span> → <span className="font-semibold text-gray-500">Closed</span>
      </p>
    </div>
  );
}
