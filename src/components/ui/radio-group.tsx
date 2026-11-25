import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as Radio from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';

export const RadioGroup = Radio.Root;

export const RadioGroupItem = forwardRef<ElementRef<typeof Radio.Item>, ComponentPropsWithoutRef<typeof Radio.Item>>(
  function RadioGroupItem({ className, ...props }, ref) {
    return <Radio.Item ref={ref} className={cn('rounded-md border border-transparent text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-checked:border-border aria-checked:bg-background aria-checked:text-foreground', className)} {...props} />;
  },
);
