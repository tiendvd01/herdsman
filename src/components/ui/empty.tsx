import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Empty({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="empty" className={cn('flex min-w-0 flex-col items-center gap-4 rounded-lg border border-dashed border-border p-4 text-center', className)} {...props} />;
}

export function EmptyHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="empty-header" className={cn('flex min-w-0 flex-col items-center gap-2', className)} {...props} />;
}

export function EmptyMedia({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="empty-icon" className={cn('flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground [&>svg]:size-4', className)} {...props} />;
}

export function EmptyDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="empty-description" className={cn('text-xs text-muted-foreground', className)} {...props} />;
}
