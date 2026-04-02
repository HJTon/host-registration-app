import { useNavigate } from 'react-router-dom';

interface Deadline {
  date: string;
  description: string;
}

const KEY_DEADLINES: Deadline[] = [
  { date: '15 April 2026', description: 'Registration and property information due' },
  { date: '1 May 2026', description: 'Property photos submitted' },
  { date: 'Mid-September 2026', description: 'Host information pack sent out' },
  { date: 'Early October 2026', description: 'Corflute signs delivered' },
  { date: '30 October 2026', description: 'Backyards Trail opens' },
  { date: '8 November 2026', description: 'Backyards Trail closes' },
  { date: '9 November 2026', description: 'Builds, Lifestyle & Farms Trail opens' },
  { date: '15 November 2026', description: 'Builds, Lifestyle & Farms Trail closes' },
];

export default function DocumentsPage() {
  const navigate = useNavigate();

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
        <h1 className="text-2xl font-bold text-text-primary">Host documents</h1>
      </div>

      {/* Key Deadlines */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-primary mb-3">Key deadlines</h2>
        <div className="space-y-3">
          {KEY_DEADLINES.map((item, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="text-primary font-medium shrink-0 w-36">{item.date}</span>
              <span className="text-text-primary">{item.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder for future documents */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
        <p className="text-sm text-text-secondary">
          More documents (information pack, guidelines, resources) will be added here closer to the event.
        </p>
      </div>
    </div>
  );
}
