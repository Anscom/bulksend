import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'coral' | 'ghost' | 'subtle';
type ButtonSize = 'default' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  coral:   'btn-coral',
  ghost:   'btn-ghost',
  subtle:  'btn-subtle',
};

export function Button({ variant = 'primary', size = 'default', className = '', children, ...props }: ButtonProps) {
  const cls = [
    'btn',
    variantClass[variant],
    size === 'sm' ? 'btn-sm' : '',
    className,
  ].filter(Boolean).join(' ');

  return <button className={cls} {...props}>{children}</button>;
}
