import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', leadingIcon, trailingIcon, className, children, ...props }: ButtonProps) {
  return (
    <button className={cn('button', `button-${variant}`, `button-${size}`, className)} {...props}>
      {leadingIcon}{children}{trailingIcon}
    </button>
  );
}
