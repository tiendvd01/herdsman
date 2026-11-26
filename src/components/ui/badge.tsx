import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex h-5 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0', {
  variants: {
    variant: {
      default: 'border border-primary bg-primary text-primary-foreground',
      outline: 'border border-border text-foreground',
      muted: 'bg-muted font-mono font-normal text-foreground',
      success: 'border border-st-done/30 bg-diff-add text-diff-add-fg',
      info: 'border border-st-working/30 bg-st-working/10 text-git-rename-fg',
      warn: 'border border-warn-border bg-warn-bg text-warn-fg',
      danger: 'border border-destructive/40 bg-danger-bg text-destructive',
    },
  },
  defaultVariants: { variant: 'outline' },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
