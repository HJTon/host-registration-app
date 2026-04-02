import { Link, useSearchParams } from 'react-router-dom';
import { getPropertyCategory } from '../types/form';

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Success icon */}
      <div className="flex justify-center mb-6">
        <div className="bg-secondary rounded-full p-5">
          <svg className="w-14 h-14 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-text-primary text-center">
        You're registered!
      </h1>
      <p className="text-text-secondary text-center mt-2 text-base">
        Thank you for registering your property for Taranaki Sustainable Trails 2026 — {trailLabel}.
      </p>

      {/* Next steps */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-text-primary text-lg">What happens next</h2>

        <div className="flex gap-3">
          <div className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</div>
          <div>
            <p className="font-medium text-text-primary">We'll be in touch</p>
            <p className="text-sm text-text-secondary mt-0.5">
              Suzy will review your registration and contact you if she has any questions or needs extra information.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</div>
          <div>
            <p className="font-medium text-text-primary">Host information pack</p>
            <p className="text-sm text-text-secondary mt-0.5">
              Closer to the event you'll receive a host information pack with everything you need to prepare for visitors.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</div>
          <div>
            <p className="font-medium text-text-primary">Check your preparation checklist</p>
            <p className="text-sm text-text-secondary mt-0.5">
              Use the checklist on the host portal to track everything you need to do before, during, and after the event.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-text-secondary">
        <p>Questions? Contact Suzy Randall:</p>
        <a href="mailto:Suzy.Randall@sustainabletaranaki.org.nz" className="text-primary hover:underline">
          Suzy.Randall@sustainabletaranaki.org.nz
        </a>
        {' · '}
        <a href="tel:+64215661850" className="text-primary hover:underline">021 566 185</a>
      </div>

      <Link
        to="/"
        className="block mt-6 text-center text-primary font-medium hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}
