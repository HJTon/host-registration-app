import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article';
  padded?: boolean;
  hero?: boolean;
}

export default function Card({
  as: Tag = 'div',
  padded = true,
  hero = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      {...rest}
      className={[
        'bg-paper border border-line',
        hero ? 'rounded-[22px] shadow-hero' : 'rounded-[14px] shadow-card',
        padded ? (hero ? 'p-5 sm:p-6' : 'p-4 sm:p-5') : '',
        className,
      ].join(' ')}
    >
      {children}
    </Tag>
  );
}
