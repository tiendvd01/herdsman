import * as React from 'react';
import * as P from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export const PopoverAnchor = P.Anchor;

export function PopoverContent({ className, align = 'end', sideOffset = 6, ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        align={align}
        sideOffset={sideOffset}
        className={cn('z-50 rounded-lg border border-border bg-background p-1 shadow-lg focus:outline-none', className)}
        {...props}
      />
    </P.Portal>
  );
}
