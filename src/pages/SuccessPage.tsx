import { Link, useSearchParams } from 'react-router-dom';
import { getPropertyCategory } from '../types/form';
import { BrandHeader, Card, CategoryChip, Btn } from '../components/ui';
import { getCategoryTheme } from '../utils/category';

function getTrailLabel(propertyType: string): string {
  const cat = getPropertyCategory(propertyType);
  switch (cat) {
    case 'build': return 'Builds';
    case 'farm': return 'Farms';
    case 'lifestyle-block': return 'Lifestyle Blocks';
    default: return 'Backyards';
  }
}

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const propertyType = searchParams.get('type') || '';
  const trailLabel = getTrailLabel(propertyType);
  const theme = getCategoryTheme(propertyType);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      <BrandHeader />

      {/* Cream hero */}
      <section className="bg-cream rounded-[22px] px-6 py-8 sm:px-10 sm:py-10 mt-2 text-center">
        <div className="flex justify-center mb-5">
          <div
            className="rounded-full p-5"
            style={{ backgroundColor: theme.soft }}
          >
            <svg
              className="w-12 h-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.accent}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <p className="italic text-[13px] text-ink-soft">Ngā mihi nui</p>
        <h1 className="font-display text-[34px] sm:text-[44px] leading-[1.02] text-brand-green-deep mt-1">
          You're registered
        </h1>
        <div className="flex items-center justify-center gap-2 mt-3">
          <CategoryChip propertyType={propertyType} size="sm" label={trailLabel} />
        </div>
        <p className="text-ink-soft mt-3 text-[14px] max-w-prose mx-auto">
          Thank you for registering your property for Taranaki Sustainable Trails 2026.
        </p>
      </section>

      {/* Next steps */}
      <Card className="mt-6 space-y-4">
        <h2 className="eyebrow text-brand-green-deep">What happens next</h2>

        {[
          {
            title: "We'll be in touch",
            body: 'Suzy will review your registration and contact you if she has any questions or needs extra information.',
          },
          {
            title: 'Host information pack',
            body: "Closer to the event you'll receive a host information pack with everything you need to prepare for visitors.",
          },
          {
            title: 'Check your preparation checklist',
            body: 'Use the checklist on the host portal to track everything you need to do before, during, and after the event.',
          },
        ].map((step, i) => (
          <div key={i} className="flex gap-3">
            <div
              className="rounded-full w-7 h-7 flex items-center justify-center text-[13px] font-bold shrink-0 mt-0.5 font-display"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              {i + 1}
            </div>
            <div>
              <p className="font-semibold text-ink">{step.title}</p>
              <p className="text-[13px] text-ink-soft mt-0.5">{step.body}</p>
            </div>
          </div>
        ))}
      </Card>

      <div className="mt-6 text-center text-[13px] text-ink-soft">
        <p>Questions? Contact Suzy Randall:</p>
        <a
          href="mailto:Suzy.Randall@sustainabletaranaki.org.nz"
          className="text-brand-green-deep hover:underline"
        >
          Suzy.Randall@sustainabletaranaki.org.nz
        </a>
        {' · '}
        <a href="tel:+64215661850" className="text-brand-green-deep hover:underline">
          021 566 185
        </a>
      </div>

      <div className="mt-6 flex justify-center">
        <Link to="/">
          <Btn variant="ghost" size="md">Back to home</Btn>
        </Link>
      </div>
    </div>
  );
}
