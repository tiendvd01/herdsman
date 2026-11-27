import * as React from 'react';
import * as S from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Select = S.Root;
export const SelectValue = S.Value;
export const SelectGroup = S.Group;

export function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof S.Trigger>) {
  return (
    <S.Trigger
      className={cn('flex h-8 min-w-[160px] items-center justify-between gap-2 rounded-md border border-input bg-surface px-3 text-sm shadow-raised hover:bg-accent active:shadow-recessed focus:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
      {...props}
    >
      {children}
      <S.Icon>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </S.Icon>
    </S.Trigger>
  );
}

export function SelectContent({ className, children, ...props }: React.ComponentProps<typeof S.Content>) {
  return (
    <S.Portal>
      <S.Content position="popper" sideOffset={6} collisionPadding={8} className={cn('z-[60] flex min-w-[min(var(--popup-anchor-width),var(--popup-width))] max-h-(--popup-height) max-w-(--popup-width) flex-col rounded-lg border border-border bg-surface p-1 shadow-overlay', className)} {...props}>
        <S.Viewport className="min-h-0">{children}</S.Viewport>
      </S.Content>
    </S.Portal>
  );
}

export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof S.Item>) {
  return (
    <S.Item className={cn('flex h-7 cursor-pointer select-none items-center gap-2 rounded-md px-2 text-sm data-[highlighted]:bg-accent', className)} {...props}>
      <S.ItemText>{children}</S.ItemText>
      <S.ItemIndicator className="ml-auto">
        <Check className="size-3.5" />
      </S.ItemIndicator>
    </S.Item>
  );
}
