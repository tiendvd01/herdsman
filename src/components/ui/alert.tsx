import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4',
  { variants: { variant: { default: 'text-foreground', destructive: 'text-destructive' } }, defaultVariants: { variant: 'default' } },
);

export function Alert({ className, variant, ...props }: ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div role="alert" data-slot="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-description" className={cn('col-start-2 min-w-0 break-words', className)} {...props} />;
}
