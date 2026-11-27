import * as React from 'react';
import * as D from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({ className, bodyClassName, children, hideClose, ...props }: React.ComponentProps<typeof D.Content> & { bodyClassName?: string; hideClose?: boolean }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-scrim" />
      <D.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100%_-_2rem)] w-[min(480px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-overlay focus:outline-none',
          className,
        )}
        {...props}
      >
        <div className={cn('flex min-h-0 flex-col gap-4 overflow-y-auto p-6 scroll-pb-2', hideClose ? 'scroll-pt-2' : 'scroll-pt-11', bodyClassName)}>
          {children}
        </div>
        {hideClose ? null : (
          <D.Close className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md bg-surface text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </D.Close>
        )}
      </D.Content>
    </D.Portal>
  );
}

export function DialogHeader({ title, description }: { title: React.ReactNode; description?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 pr-6">
      <D.Title className="text-lg font-semibold leading-tight">{title}</D.Title>
      {description ? <D.Description className="text-sm text-muted-foreground">{description}</D.Description> : <D.Description />}
    </div>
  );
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex justify-end gap-2 pt-1', className)} {...props} />;
}
