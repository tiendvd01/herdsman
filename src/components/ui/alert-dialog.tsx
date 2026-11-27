import * as React from 'react';
import * as A from '@radix-ui/react-alert-dialog';
import { Button } from './button';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive,
  busy,
  onConfirm,
  onCloseAutoFocus,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCloseAutoFocus?: React.ComponentProps<typeof A.Content>['onCloseAutoFocus'];
  children?: React.ReactNode;
}) {
  return (
    <A.Root open={open} onOpenChange={onOpenChange}>
      <A.Portal>
        <A.Overlay className="fixed inset-0 z-50 bg-scrim" />
        <A.Content onCloseAutoFocus={onCloseAutoFocus} className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100%_-_2rem)] w-[min(460px,calc(100%-32px))] overflow-y-auto -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-border bg-surface p-6 scroll-py-2 shadow-overlay">
          <div className="flex flex-col gap-1.5">
            <A.Title className="text-lg font-semibold leading-tight">{title}</A.Title>
            {description ? <A.Description className="text-sm text-muted-foreground">{description}</A.Description> : <A.Description />}
          </div>
          {children}
          <div className="flex justify-end gap-2 pt-1">
            <A.Cancel asChild>
              <Button variant="outline">Cancel</Button>
            </A.Cancel>
            <Button
              variant={destructive ? 'destructive' : 'default'}
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
            >
              {busy ? 'Working…' : confirmLabel}
            </Button>
          </div>
        </A.Content>
      </A.Portal>
    </A.Root>
  );
}
