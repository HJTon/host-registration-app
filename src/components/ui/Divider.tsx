import type { ReactNode } from 'react';

interface DividerProps {
  label: ReactNode;
  sublabel?: ReactNode;
  className?: string;
}

/**
 * Section header — display-type uppercase label followed by a trailing
 * hairline rule. Optional italic sublabel in the muted secondary colour.
 *
 * Used at the top of every content block across the Trails brand.
 */
export default function Divider({ label, sublabel, className = '' }: DividerProps) {
  return (
    <div className={['flex items-center gap-3', className].join(' ')}>
      {/* min-w-0 + break-words lets long headings wrap instead of overflowing */}
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="font-display text-[14px] sm:text-[16px] text-brand-green-ink break-words">
          {label}
        </span>
        {sublabel && (
          <span className="italic text-[12px] text-ink-soft shrink-0">{sublabel}</span>
        )}
      </div>
      <span aria-hidden className="flex-1 h-px bg-line shrink-0" />
    </div>
  );
}
