import { useEffect, useState } from 'react';

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** Optional colour override — e.g. category accent hex */
  accent?: string;
  label?: string;
  rightLabel?: string;
  className?: string;
}

/**
 * Trails progress bar — 6 px track with green fill. Animates from 0 to
 * target on mount (200 ms ease-out), per the design handoff.
 */
export default function ProgressBar({
  value,
  accent,
  label,
  rightLabel,
  className = '',
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setWidth(Math.min(100, Math.max(0, value))));
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className={className}>
      {(label || rightLabel) && (
        <div className="flex items-baseline justify-between mb-1.5">
          {label && <span className="eyebrow text-ink-soft">{label}</span>}
          {rightLabel && (
            <span className="meta font-mono tabular-nums">{rightLabel}</span>
          )}
        </div>
      )}
      <div
        className="w-full h-1.5 rounded-full bg-line overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-200 ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: accent ?? 'var(--color-brand-green)',
          }}
        />
      </div>
    </div>
  );
}
