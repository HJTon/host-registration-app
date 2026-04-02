import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      {/* Header */}
      <div className="pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-primary hover:text-primary-dark p-1 -ml-1"
          aria-label="Back"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Preparation checklist</h1>
          <p className="text-sm text-text-secondary mt-0.5">{tickedCount} of {ALL_IDS.length} complete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full mb-6">
        <div
          className="h-2 bg-primary rounded-full transition-all duration-300"
          style={{ width: `${(tickedCount / ALL_IDS.length) * 100}%` }}
        />
      </div>

      {/* All done banner */}
      {allDone && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <p className="text-lg font-bold text-green-800">You're all set! 🎉</p>
          <p className="text-sm text-green-700 mt-1">All items are checked off. Have a great event!</p>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {SECTIONS.map(section => (
          <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-primary mb-3">{section.title}</h2>
            <ul className="space-y-3">
              {section.items.map(item => (
                <li key={item.id}>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={!!ticked[item.id]}
                      onChange={() => toggle(item.id)}
                      className="w-5 h-5 accent-primary shrink-0 mt-0.5"
                    />
                    <span className={`text-sm leading-snug transition-colors ${ticked[item.id] ? 'line-through text-text-secondary' : 'text-text-primary group-hover:text-primary'}`}>
                      {item.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Reset button */}
      {tickedCount > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={handleReset}
            className="text-sm text-text-secondary hover:text-red-600 transition-colors underline underline-offset-2"
          >
            Reset all ticks
          </button>
        </div>
      )}
    </div>
  );
}
