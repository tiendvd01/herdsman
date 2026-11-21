import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Spec 017: spinner for "an agent is running". Fixed size so toggling it never shifts layout; stops spinning under reduced motion. */
export function Spinner({ className, label = 'Working' }: { className?: string; label?: string }) {
  return <Loader2 role="img" aria-label={label} className={cn('size-3 shrink-0 animate-spin text-st-working motion-reduce:animate-none', className)} />;
}
