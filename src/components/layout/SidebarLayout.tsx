import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

type Props = ComponentPropsWithoutRef<'aside'> & { as?: 'aside' | 'nav' };

export function SidebarLayout({ as: Panel = 'aside', children, className, ...props }: Props) {
  return (
    <Panel
      {...props}
      className={cn(
        'relative flex h-full shrink-0 flex-col bg-surface px-2 after:pointer-events-none after:absolute after:top-11 after:right-0 after:bottom-0 after:border-r after:border-border',
        className,
      )}
    >
      <div data-tauri-drag-region className="-mx-2 h-11 shrink-0 select-none border-b border-border" />
      {children}
    </Panel>
  );
}
