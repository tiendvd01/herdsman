import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function Switch({ checked, onCheckedChange, className, ...props }: SwitchProps) {
  return (
    <button
      {...props}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        checked ? 'bg-primary' : 'bg-muted-foreground',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none size-4 rounded-full bg-background shadow-sm transition-transform motion-reduce:transition-none',
          checked && 'translate-x-4',
        )}
      />
    </button>
  );
}
