import { useNavigate } from 'react-router-dom';
import {
  getSubmissions,
  isEditable,
  editDeadline,
  EDIT_WINDOW_DAYS,
  REGISTRATION_CHANGES_EMAIL,
} from '../utils/storage';
import { BrandHeader, Card, CategoryChip } from '../components/ui';
import { getCategoryTheme } from '../utils/category';

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
    <div className="max-w-2xl mx-auto px-4 pb-12">
      <BrandHeader backTo="/" />

      <div className="mt-2 mb-5">
        <p className="italic text-[12px] text-ink-soft mb-0.5">Taku whare · My listings</p>
        <h1 className="font-display text-[28px] sm:text-[32px] leading-[1.05] text-brand-green-deep">
          Edit property details
        </h1>
      </div>

      {submissions.length === 0 ? (
        <Card className="text-center">
          <p className="text-4xl mb-3">📱</p>
          <h2 className="font-display text-[20px] text-brand-green-deep mb-2">
            No registrations found on this device
          </h2>
          <p className="text-sm text-ink-soft leading-relaxed mb-4 max-w-prose mx-auto">
            Registrations can only be edited from the same device and browser they were
            submitted on. If you registered on a different device, please contact Suzy
            to make changes.
          </p>
          <div className="bg-cream rounded-[10px] p-4 text-sm text-ink-soft space-y-1">
            <p className="font-semibold text-brand-green-ink">Contact Suzy Randall</p>
            <p>
              <a
                href="mailto:suzy.randall@sustainabletaranaki.org.nz"
                className="text-brand-green-deep hover:underline"
              >
                suzy.randall@sustainabletaranaki.org.nz
              </a>
            </p>
            <p>
              <a href="tel:+6421566185" className="text-brand-green-deep hover:underline">
                021 566 185
              </a>
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-soft mb-1">
            Select a property to update its details. Registrations can be edited for{' '}
            {EDIT_WINDOW_DAYS} days after they are submitted — after that, please email
            any changes to{' '}
            <a
              href={`mailto:${REGISTRATION_CHANGES_EMAIL}`}
              className="text-brand-green-deep hover:underline"
            >
              {REGISTRATION_CHANGES_EMAIL}
            </a>
            .
          </p>
          {submissions.map(sub => {
            const theme = getCategoryTheme(sub.propertyType);
            const editable = isEditable(sub);

            const details = (
              <>
                <span className="text-3xl shrink-0">
                  {PROPERTY_TYPE_ICONS[sub.propertyType] ?? '🏠'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-ink truncate">
                      {sub.propertyName || 'Unnamed property'}
                    </p>
                    <CategoryChip propertyType={sub.propertyType} size="sm" />
                  </div>
                  <p className="text-xs text-ink-soft mt-1">
                    {PROPERTY_TYPE_LABELS[sub.propertyType] ?? sub.propertyType}
                    {' · '}Submitted {formatDate(sub.submittedAt)}
                  </p>
                </div>
              </>
            );

            if (!editable) {
              return (
                <div
                  key={sub.id}
                  className="text-left bg-paper border border-line rounded-[14px] p-4 shadow-card opacity-90"
                  style={{ borderLeft: `4px solid ${theme.accent}` }}
                >
                  <div className="flex items-center gap-4">{details}</div>
                  <div className="mt-3 pt-3 border-t border-line text-xs text-ink-soft leading-relaxed">
                    <p className="font-semibold text-brand-green-ink mb-0.5">
                      Editing closed on {formatDate(editDeadline(sub).toISOString())}
                    </p>
                    <p>
                      The {EDIT_WINDOW_DAYS}-day editing window for this registration has
                      passed. Please email any changes to{' '}
                      <a
                        href={`mailto:${REGISTRATION_CHANGES_EMAIL}?subject=${encodeURIComponent(
                          `Registration change — ${sub.propertyName || 'my property'}`,
                        )}`}
                        className="text-brand-green-deep hover:underline"
                      >
                        {REGISTRATION_CHANGES_EMAIL}
                      </a>{' '}
                      and the team will update it for you.
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={sub.id}
                onClick={() => navigate(`/form?edit=${encodeURIComponent(sub.id)}`)}
                className="text-left bg-paper border border-line rounded-[14px] p-4 flex items-center gap-4 shadow-card hover:-translate-y-[1px] transition-all active:scale-[0.99]"
                style={{ borderLeft: `4px solid ${theme.accent}` }}
              >
                {details}
                <svg className="w-5 h-5 shrink-0 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
