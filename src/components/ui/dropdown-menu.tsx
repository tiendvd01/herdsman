import * as React from 'react';
import * as M from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

export const DropdownMenu = M.Root;
export const DropdownMenuTrigger = M.Trigger;

export function DropdownMenuContent({ className, sideOffset = 4, align = 'start', ...props }: React.ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        sideOffset={sideOffset}
        collisionPadding={8}
        align={align}
        className={cn('z-50 min-w-[min(180px,var(--popup-width))] max-h-(--popup-height) max-w-(--popup-width) overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-overlay', className)}
        {...props}
      />
    </M.Portal>
  );
}

export function DropdownMenuItem({ className, destructive, ...props }: React.ComponentProps<typeof M.Item> & { destructive?: boolean }) {
  return (
    <M.Item
      className={cn(
        'flex min-h-8 cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-xs data-[highlighted]:bg-accent data-[disabled]:opacity-50 [&_svg]:size-4',
        destructive && 'text-destructive',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator() {
  return <M.Separator className="my-1 h-px bg-border" />;
}
