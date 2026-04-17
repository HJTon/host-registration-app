import { getCategoryTheme } from '../../utils/category';

interface CategoryChipProps {
  propertyType: string;
  size?: 'sm' | 'md';
  className?: string;
  showDot?: boolean;
  label?: string;
}

/**
 * Small rounded pill that displays the currently selected Trails category
 * (Backyards / Builds / Farms) using its accent colour + soft tint.
 */
export default function CategoryChip({
  propertyType,
  size = 'md',
  className = '',
  showDot = true,
  label,
}: CategoryChipProps) {
  const theme = getCategoryTheme(propertyType);
  const sizing =
    size === 'sm'
      ? 'h-6 px-2 text-[11px] gap-1.5'
      : 'h-7 px-3 text-[12px] gap-2';

  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-semibold uppercase tracking-[0.14em]',
        sizing,
        className,
      ].join(' ')}
      style={{ backgroundColor: theme.soft, color: theme.accent }}
    >
      {showDot && (
        <span
          aria-hidden
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: theme.accent }}
        />
      )}
      {label ?? theme.label}
    </span>
  );
}
