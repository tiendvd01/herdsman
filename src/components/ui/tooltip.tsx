import * as React from 'react';
import * as T from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export const TooltipProvider = T.Provider;

type TooltipProps = Pick<React.ComponentProps<typeof T.Root>, 'open' | 'onOpenChange' | 'disableHoverableContent'> &
  Pick<React.ComponentProps<typeof T.Content>, 'align' | 'side' | 'sideOffset'> & {
  content: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
};

export function Tooltip({ content, children, side = 'bottom', align, sideOffset = 6, contentClassName, ...rootProps }: TooltipProps) {
  return (
    <T.Root {...rootProps}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={side} align={align} sideOffset={sideOffset} className={cn('z-50 rounded-md bg-primary px-2 py-1.5 text-xs text-primary-foreground', contentClassName)}>
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
