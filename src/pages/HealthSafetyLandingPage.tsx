import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubmissions, getHSResponseByRegistration } from '../utils/storage';
import type { HSType } from '../types/healthSafety';
import { hsTypeForProperty, HS_TYPE_LABELS } from '../types/healthSafety';
import { BrandHeader, Card, Btn, CategoryChip } from '../components/ui';
import { getCategoryTheme } from '../utils/category';

const PROPERTY_TYPE_ICONS: Record<string, string> = {
  'private-property': '🏡',
  'community-garden': '🌱',
  'school-garden': '🏫',
  build: '🏗️',
  farm: '🌾',
  'lifestyle-block': '🐄',
};

const HS_TYPE_META: Record<HSType, { icon: string; blurb: string }> = {
  backyards: { icon: '🏡', blurb: 'Gardens, community & school gardens' },
  builds: { icon: '🏗️', blurb: 'Builds & sustainable homes' },
  farms: { icon: '🌾', blurb: 'Farms & commercial growing' },
  lifestyle: { icon: '🐄', blurb: 'Lifestyle blocks' },
};

export default function HealthSafetyLandingPage() {
  const navigate = useNavigate();
  const submissions = getSubmissions();

  // Single registration with no plan yet → go straight to its form (req. 2).
  const onlyReg = submissions.length === 1 ? submissions[0] : null;
  const onlyRegHasPlan = onlyReg ? !!getHSResponseByRegistration(onlyReg.id) : false;

  useEffect(() => {
    if (onlyReg && !onlyRegHasPlan) {
      const type = hsTypeForProperty(onlyReg.propertyType);
      navigate(`/health-safety/form?type=${type}&reg=${encodeURIComponent(onlyReg.id)}`, { replace: true });
    }
  }, [onlyReg, onlyRegHasPlan, navigate]);

  const goToType = (type: HSType) => navigate(`/health-safety/form?type=${type}`);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      <BrandHeader backTo="/" />

      <div className="mt-2 mb-5">
        <p className="italic text-[12px] text-ink-soft mb-0.5">Haumaru · Health &amp; safety</p>
        <h1 className="font-display text-[28px] sm:text-[32px] leading-[1.05] text-brand-green-deep">
          Health &amp; Safety plan
        </h1>
        <p className="text-[14px] text-ink-soft mt-2 max-w-prose">
          Every host completes a short risk assessment for their property, signs it, and keeps a
          printable copy. Returning hosts can update last year’s answers.
        </p>
      </div>

      {/* Properties registered on this device */}
      {submissions.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-soft mb-1">
            {submissions.length > 1
              ? 'Choose a property to complete or view its H&S plan.'
              : 'Your registered property:'}
          </p>
          {submissions.map(sub => {
            const type = hsTypeForProperty(sub.propertyType);
            const theme = getCategoryTheme(sub.propertyType);
            const plan = getHSResponseByRegistration(sub.id);
            return (
              <Card key={sub.id} className="flex items-center gap-4" style={{ borderLeft: `4px solid ${theme.accent}` }}>
                <span className="text-3xl shrink-0">{PROPERTY_TYPE_ICONS[sub.propertyType] ?? '🏠'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-ink truncate">{sub.propertyName || 'Unnamed property'}</p>
                    <CategoryChip propertyType={sub.propertyType} size="sm" />
                  </div>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {HS_TYPE_LABELS[type]} H&amp;S form
                    {plan ? ' · plan signed' : ' · not started'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {plan ? (
                      <>
                        <Btn size="sm" variant="primary" onClick={() => navigate(`/health-safety/plan?id=${encodeURIComponent(plan.submissionId)}`)}>
                          View plan
                        </Btn>
                        <Btn size="sm" variant="ghost" onClick={() => navigate(`/health-safety/form?id=${encodeURIComponent(plan.submissionId)}`)}>
                          Edit
                        </Btn>
                      </>
                    ) : (
                      <Btn size="sm" variant="primary" onClick={() => navigate(`/health-safety/form?type=${type}&reg=${encodeURIComponent(sub.id)}`)}>
                        Start H&amp;S plan
                      </Btn>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        // No registration on this device → let the host pick their type.
        <div>
          <p className="text-sm text-ink-soft mb-3">
            We couldn’t find a registration on this device. Choose your host type to start your
            health &amp; safety plan.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {(Object.keys(HS_TYPE_META) as HSType[]).map(type => (
              <button
                key={type}
                onClick={() => goToType(type)}
                className="text-left bg-paper border border-line rounded-[14px] p-4 flex flex-col gap-1.5 shadow-card hover:border-brand-green hover:-translate-y-[1px] transition-all active:scale-[0.98]"
              >
                <span className="text-2xl">{HS_TYPE_META[type].icon}</span>
                <p className="font-semibold text-ink text-sm">{HS_TYPE_LABELS[type]}</p>
                <p className="text-xs text-ink-soft leading-snug">{HS_TYPE_META[type].blurb}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
