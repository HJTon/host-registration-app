import { Link } from 'react-router-dom';

interface BrandHeaderProps {
  /** Show a back chevron + link on the left */
  backTo?: string;
  backLabel?: string;
  rightSlot?: React.ReactNode;
  className?: string;
  /** sm = compact in-page header (default); lg = full-width hero wordmark for the landing page */
  size?: 'sm' | 'lg';
}

/**
 * Top-of-page header showing the Trails wordmark lockup.
 * Reproduces the sidebar brand block from the design handoff:
 *   TARANAKI / SUSTAINABLE (bright) · TRAILS (deep)
 * Barlow Condensed 700, uppercase, tracked.
 */
export default function BrandHeader({
  backTo,
  backLabel = 'Home',
  rightSlot,
  className = '',
  size = 'sm',
}: BrandHeaderProps) {
  if (size === 'lg') {
    // Same lockup as the compact header, just scaled up proportionally
    // (eyebrow : wordmark ≈ 11 : 20 ≈ 0.55, matching the .eyebrow + text-[20px] pairing)
    return (
      <header className={['py-4 sm:py-5', className].join(' ')}>
        <Link to="/" className="flex flex-col leading-none select-none">
          <span className="uppercase font-semibold text-ink-muted text-[20px] sm:text-[30px] md:text-[40px] tracking-[0.16em] mb-1 sm:mb-1.5">
            Taranaki
          </span>
          <span className="font-display text-[36px] sm:text-[56px] md:text-[72px] leading-none">
            <span className="text-brand-green">Sustainable</span>{' '}
            <span className="text-brand-green-deep">Trails</span>
          </span>
        </Link>
      </header>
    );
  }

  return (
    <header
      className={[
        'flex items-center justify-between gap-3 py-3',
        className,
      ].join(' ')}
    >
      <div className="flex items-center gap-3 min-w-0">
        {backTo && (
          <Link
            to={backTo}
            aria-label={`Back to ${backLabel}`}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-ink-soft hover:text-brand-green-deep hover:bg-cream transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        )}
        <Link to="/" className="flex flex-col leading-none select-none shrink-0">
          <span className="eyebrow text-ink-muted mb-0.5">Taranaki</span>
          <span className="font-display text-[18px] sm:text-[20px]">
            <span className="text-brand-green">Sustainable</span>{' '}
            <span className="text-brand-green-deep">Trails</span>
          </span>
        </Link>
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </header>
  );
}
