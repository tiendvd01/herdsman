import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        outline: 'border border-input bg-background text-foreground shadow-xs hover:bg-accent dark:shadow-none',
        secondary: 'bg-muted text-foreground hover:bg-accent',
        ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
        muted: 'text-muted-foreground hover:bg-accent hover:text-foreground',
        destructive: 'bg-destructive text-white shadow-xs hover:bg-destructive/90',
        warn: 'border border-warn-border bg-warn-bg text-warn-fg hover:opacity-90',
      },
      size: {
        default: 'h-9 px-4 text-[13px]',
        sm: 'h-8 px-3 text-[12px]',
        xs: 'h-7 px-2 text-xs',
        icon: 'size-8',
        'icon-sm': 'size-7 [&_svg]:size-[15px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, type, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} type={asChild ? undefined : (type ?? 'button')} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = 'Button';

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn('inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] font-normal leading-none text-muted-foreground', className)}
      {...props}
    />
  );
}
