import type { ComponentProps } from 'react';
import * as Radio from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';

export const RadioGroup = Radio.Root;

export function RadioGroupItem({ className, ...props }: ComponentProps<typeof Radio.Item>) {
  return <Radio.Item className={cn('rounded-md border border-transparent text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 data-[state=checked]:border-border data-[state=checked]:bg-background data-[state=checked]:text-foreground', className)} {...props} />;
}
