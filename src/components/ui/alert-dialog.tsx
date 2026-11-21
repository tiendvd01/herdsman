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
  children?: React.ReactNode;
}) {
  return (
    <A.Root open={open} onOpenChange={onOpenChange}>
      <A.Portal>
        <A.Overlay className="fixed inset-0 z-50 bg-scrim" />
        <A.Content className="fixed left-1/2 top-[140px] z-50 flex w-[min(460px,calc(100vw-32px))] -translate-x-1/2 flex-col gap-4 rounded-xl border border-border bg-background p-6 shadow-lg">
          <div className="flex flex-col gap-1.5">
            <A.Title className="text-[16px] font-semibold leading-tight">{title}</A.Title>
            {description ? <A.Description className="text-[13px] text-muted-foreground">{description}</A.Description> : <A.Description />}
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
