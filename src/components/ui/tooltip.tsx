import * as React from 'react';
import * as T from '@radix-ui/react-tooltip';

export const TooltipProvider = T.Provider;

export function Tooltip({ content, children, side = 'bottom' }: { content: React.ReactNode; children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <T.Root delayDuration={300}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={side} sideOffset={6} className="z-50 rounded-md bg-primary px-2 py-1.5 text-xs text-primary-foreground">
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
