import * as React from 'react';
import * as S from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Select = S.Root;
export const SelectValue = S.Value;

export function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof S.Trigger>) {
  return (
    <S.Trigger
      className={cn('flex h-8 min-w-[160px] items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus-visible:ring-1 focus-visible:ring-ring', className)}
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
      <S.Content position="popper" sideOffset={6} className={cn('z-[60] min-w-[var(--radix-select-trigger-width)] rounded-lg border border-border bg-background p-1 shadow-lg', className)} {...props}>
        <S.Viewport>{children}</S.Viewport>
      </S.Content>
    </S.Portal>
  );
}

export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof S.Item>) {
  return (
    <S.Item className={cn('flex h-7 cursor-pointer select-none items-center gap-2 rounded-md px-2 text-[13px] outline-none data-[highlighted]:bg-accent', className)} {...props}>
      <S.ItemText>{children}</S.ItemText>
      <S.ItemIndicator className="ml-auto">
        <Check className="size-3.5" />
      </S.ItemIndicator>
    </S.Item>
  );
}
