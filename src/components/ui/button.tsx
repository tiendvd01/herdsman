import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-[color,background-color,box-shadow] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-raised hover:bg-primary/95 active:shadow-recessed',
        outline: 'border border-input bg-surface text-foreground shadow-raised hover:bg-accent active:shadow-recessed',
        secondary: 'bg-muted text-foreground shadow-recessed hover:bg-accent',
        ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent',
        muted: 'text-muted-foreground hover:bg-accent hover:text-foreground active:bg-accent',
        destructive: 'bg-destructive text-destructive-foreground shadow-raised hover:shadow-panel active:shadow-recessed',
        warn: 'border border-warn-border bg-warn-bg text-warn-fg shadow-raised hover:shadow-panel active:shadow-recessed',
      },
      size: {
        default: 'h-9 px-4 text-sm',
        sm: 'h-8 px-3 text-xs',
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
      className={cn('inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 shadow-recessed font-mono text-xs font-normal leading-none text-muted-foreground', className)}
      {...props}
    />
  );
}
