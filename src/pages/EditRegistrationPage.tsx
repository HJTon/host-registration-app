import { useNavigate } from 'react-router-dom';
import { getSubmissions } from '../utils/storage';

const PROPERTY_TYPE_ICONS: Record<string, string> = {
  'private-property': '🏡',
  'community-garden': '🌱',
  'school-garden': '🏫',
  'build': '🏗️',
  'farm': '🌾',
  'lifestyle-block': '🐄',
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  'private-property': 'Private property',
  'community-garden': 'Community garden',
  'school-garden': 'School garden',
  'build': 'Build',
  'farm': 'Farm',
  'lifestyle-block': 'Lifestyle block',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-NZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function EditRegistrationPage() {
  const navigate = useNavigate();
  const submissions = getSubmissions();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-text-secondary hover:text-primary transition-colors"
          aria-label="Back to home"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-text-primary">Edit property details</h1>
      </div>

      {submissions.length === 0 ? (
        /* No submissions found on this device */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-4xl mb-4">📱</p>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            No registrations found on this device
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            Registrations can only be edited from the same device and browser they were
            submitted on. If you registered on a different device, please contact Suzy to
            make changes.
          </p>
          <div className="bg-secondary/30 rounded-xl p-4 text-sm text-text-secondary space-y-1">
            <p className="font-medium text-text-primary">Contact Suzy Randall</p>
            <p>
              <a
                href="mailto:suzy.randall@sustainabletaranaki.org.nz"
                className="text-primary hover:underline"
              >
                suzy.randall@sustainabletaranaki.org.nz
              </a>
            </p>
            <p>
              <a href="tel:+64215661850" className="text-primary hover:underline">
                021 566 185
              </a>
            </p>
          </div>
        </div>
      ) : (
        /* List of submissions */
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-secondary mb-1">
            Select a property to update its details.
          </p>
          {submissions.map(sub => (
            <button
              key={sub.id}
              onClick={() => navigate(`/form?edit=${encodeURIComponent(sub.id)}`)}
              className="text-left bg-white border-2 border-gray-100 rounded-2xl p-5 flex items-center gap-4 hover:border-primary hover:shadow-md transition-all active:scale-[0.98]"
            >
              <span className="text-3xl shrink-0">
                {PROPERTY_TYPE_ICONS[sub.propertyType] ?? '🏠'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary truncate">{sub.propertyName || 'Unnamed property'}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {PROPERTY_TYPE_LABELS[sub.propertyType] ?? sub.propertyType}
                  {' · '}Submitted {formatDate(sub.submittedAt)}
                </p>
              </div>
              <svg className="w-5 h-5 shrink-0 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
