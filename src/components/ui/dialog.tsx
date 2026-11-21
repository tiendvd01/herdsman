import * as React from 'react';
import * as D from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({ className, children, hideClose, ...props }: React.ComponentProps<typeof D.Content> & { hideClose?: boolean }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-scrim" />
      <D.Content
        className={cn(
          'fixed left-1/2 top-[120px] z-50 flex w-[min(480px,calc(100vw-32px))] -translate-x-1/2 flex-col gap-4 rounded-xl border border-border bg-background p-6 shadow-lg focus:outline-none',
          className,
        )}
        {...props}
      >
        {children}
        {hideClose ? null : (
          <D.Close className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close">
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
      <D.Title className="text-[16px] font-semibold leading-tight">{title}</D.Title>
      {description ? <D.Description className="text-[13px] text-muted-foreground">{description}</D.Description> : <D.Description />}
    </div>
  );
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex justify-end gap-2 pt-1', className)} {...props} />;
}
