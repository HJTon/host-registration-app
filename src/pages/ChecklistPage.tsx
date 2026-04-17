import { useState, useEffect } from 'react';
import { BrandHeader, Card, Divider, ProgressBar } from '../components/ui';

const STORAGE_KEY = 'host-checklist-2026';

interface ChecklistItem {
  id: string;
  label: string;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

const SECTIONS: ChecklistSection[] = [
  {
    title: 'Before the event',
    items: [
      { id: 'submit-registration', label: 'Submit your registration' },
      { id: 'send-photos', label: 'Upload your photos to the host portal (or email to Suzy)' },
      { id: 'confirm-hours', label: 'Confirm your open hours with the team' },
      { id: 'read-info-pack', label: 'Read the host information pack when it arrives' },
      { id: 'walk-property', label: 'Walk your property and fix any trip hazards, low branches, or unsafe areas' },
      { id: 'plan-visitor-flow', label: 'Plan how visitors will move through the property and where they\'ll park' },
    ],
  },
  {
    title: 'The week before',
    items: [
      { id: 'check-corflute', label: 'Check your corflute sign has arrived — contact the team if not' },
      { id: 'brief-helpers', label: 'Brief any family members or helpers on the plan for each day' },
      { id: 'prepare-activities', label: 'Prepare materials for any kids activities or workshops you\'re running' },
      { id: 'check-toilets', label: 'Check toilet facilities are accessible and well-stocked' },
    ],
  },
  {
    title: 'The day before',
    items: [
      { id: 'put-out-arrows', label: 'Put out directional arrows or signs around your property' },
      { id: 'setup-parking', label: 'Clear and set up your parking area' },
      { id: 'display-number', label: 'Display your property number prominently at the entrance' },
    ],
  },
  {
    title: 'On the day',
    items: [
      { id: 'corflute-road', label: 'Put your corflute sign out at the road' },
      { id: 'have-water', label: 'Have water on hand — you\'ll be talking a lot!' },
      { id: 'count-visitors', label: 'Keep an accurate count of visitor numbers (your helper should take care of this)' },
    ],
  },
  {
    title: 'After the event',
    items: [
      { id: 'bring-in-signs', label: 'Bring in your corflute sign and any directional signs' },
      { id: 'share-numbers', label: 'Share your visitor numbers and any feedback with the team' },
    ],
  },
];

const ALL_IDS = SECTIONS.flatMap(s => s.items.map(i => i.id));

function loadChecklist(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export default function ChecklistPage() {
  const [ticked, setTicked] = useState<Record<string, boolean>>(loadChecklist);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ticked));
  }, [ticked]);

  const toggle = (id: string) => {
    setTicked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReset = () => {
    if (window.confirm('Clear all ticks? This cannot be undone.')) {
      setTicked({});
    }
  };

  const tickedCount = ALL_IDS.filter(id => ticked[id]).length;
  const allDone = tickedCount === ALL_IDS.length;

  const percent = Math.round((tickedCount / ALL_IDS.length) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      <BrandHeader backTo="/" />

      {/* Heading */}
      <div className="mt-2 mb-5">
        <p className="italic text-[12px] text-ink-soft mb-0.5">Takatū · Getting ready</p>
        <h1 className="font-display text-[28px] sm:text-[32px] leading-[1.05] text-brand-green-deep">
          Preparation checklist
        </h1>
        <p className="meta mt-1">{tickedCount} of {ALL_IDS.length} complete</p>
      </div>

      <ProgressBar
        value={percent}
        rightLabel={`${percent}%`}
        className="mb-6"
      />

      {allDone && (
        <Card className="mb-6 bg-brand-green-soft border-brand-green-soft text-center">
          <p className="font-display text-[20px] text-brand-green-deep">You're all set · Ka pai!</p>
          <p className="text-sm text-ink-soft mt-1">All items are checked off. Have a great event!</p>
        </Card>
      )}

      <div className="space-y-4">
        {SECTIONS.map(section => (
          <Card key={section.title}>
            <Divider label={section.title} className="mb-3" />
            <ul className="space-y-3">
              {section.items.map(item => {
                const done = !!ticked[item.id];
                return (
                  <li key={item.id}>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <span
                        className={[
                          'mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 transition-colors',
                          done
                            ? 'bg-brand-green border-brand-green text-white'
                            : 'bg-paper border border-line group-hover:border-brand-green',
                        ].join(' ')}
                        aria-hidden
                      >
                        {done && (
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggle(item.id)}
                        className="sr-only"
                      />
                      <span
                        className={`text-[14px] leading-snug transition-all ${done ? 'line-through text-ink-soft opacity-55' : 'text-ink'}`}
                      >
                        {item.label}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>

      {tickedCount > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={handleReset}
            className="text-sm text-ink-soft hover:text-danger transition-colors underline underline-offset-2"
          >
            Reset all ticks
          </button>
        </div>
      )}
    </div>
  );
}
