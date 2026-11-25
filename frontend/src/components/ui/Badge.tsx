import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export function Badge({ tone = 'neutral', className, children, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn('badge', `badge-${tone}`, className)} {...props}><i />{children}</span>;
}
