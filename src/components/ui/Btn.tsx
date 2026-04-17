import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'dark' | 'ghost' | 'cream' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-brand-green text-white hover:brightness-[0.96] active:brightness-[0.92] disabled:opacity-60',
  dark:
    'bg-brand-green-ink text-white hover:brightness-110 active:brightness-95 disabled:opacity-60',
  ghost:
    'bg-transparent text-ink border border-line hover:bg-cream-soft disabled:opacity-60',
  cream:
    'bg-cream text-brand-green-ink hover:brightness-[0.97] active:brightness-[0.94] disabled:opacity-60',
  danger:
    'bg-danger text-white hover:brightness-[0.96] active:brightness-[0.92] disabled:opacity-60',
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-[52px] px-6 text-base gap-2',
};

export default function Btn({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth,
  className = '',
  children,
  ...rest
}: BtnProps) {
  return (
    <button
      {...rest}
      className={[
        'inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap transition-[filter,background-color,border-color] select-none',
        'disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {iconLeft && <span className="shrink-0 inline-flex">{iconLeft}</span>}
      <span className="truncate">{children}</span>
      {iconRight && <span className="shrink-0 inline-flex">{iconRight}</span>}
    </button>
  );
}
