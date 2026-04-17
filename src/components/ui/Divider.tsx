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
      <div className="flex items-baseline gap-2 shrink-0">
        <span className="font-display text-[14px] sm:text-[16px] text-brand-green-ink">
          {label}
        </span>
        {sublabel && (
          <span className="italic text-[12px] text-ink-soft">{sublabel}</span>
        )}
      </div>
      <span aria-hidden className="flex-1 h-px bg-line" />
    </div>
  );
}
