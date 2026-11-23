import * as React from 'react';
import * as T from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export const TooltipProvider = T.Provider;

type TooltipProps = Pick<React.ComponentProps<typeof T.Root>, 'open' | 'onOpenChange' | 'disableHoverableContent'> & {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  contentClassName?: string;
};

export function Tooltip({ content, children, side = 'bottom', contentClassName, ...rootProps }: TooltipProps) {
  return (
    <T.Root delayDuration={300} {...rootProps}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={side} sideOffset={6} className={cn('z-50 rounded-md bg-primary px-2 py-1.5 text-xs text-primary-foreground', contentClassName)}>
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
