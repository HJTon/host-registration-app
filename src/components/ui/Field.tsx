import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Form field wrapper — label on top, hint below, children in the middle.
 * Follows the Trails Field spec: 10 px radius inputs, line border, paper bg,
 * focus ring in brandGreen.
 */
export function Field({
  label,
  hint,
  error,
  optional,
  htmlFor,
  children,
  className = '',
}: FieldProps) {
  return (
    <div className={['flex flex-col gap-1.5', className].join(' ')}>
      <label htmlFor={htmlFor} className="flex items-baseline gap-2">
        <span className="text-[13px] font-semibold text-ink">{label}</span>
        {optional && <span className="meta">Optional</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };
export function Input({ invalid, className = '', ...rest }: InputProps) {
  return (
    <input
      {...rest}
      className={[
        'h-11 w-full rounded-[10px] bg-paper px-3.5 text-[14px] text-ink',
        'border outline-none transition-colors',
        invalid ? 'border-danger' : 'border-line',
        'focus:border-brand-green focus:ring-2 focus:ring-brand-green/30',
        'placeholder:text-ink-muted',
        className,
      ].join(' ')}
    />
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };
export function Textarea({ invalid, className = '', rows = 4, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      {...rest}
      className={[
        'w-full rounded-[10px] bg-paper px-3.5 py-2.5 text-[14px] text-ink',
        'border outline-none transition-colors resize-y',
        invalid ? 'border-danger' : 'border-line',
        'focus:border-brand-green focus:ring-2 focus:ring-brand-green/30',
        'placeholder:text-ink-muted',
        className,
      ].join(' ')}
    />
  );
}
