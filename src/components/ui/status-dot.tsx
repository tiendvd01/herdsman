import { cn } from '@/lib/utils';
import type { SessionStatus } from '@/lib/types';
import { Spinner } from '@/components/ui/spinner';

const COLOR: Record<SessionStatus, string> = {
  idle: 'bg-st-idle',
  working: 'bg-st-working hs-pulse',
  blocked: 'bg-st-blocked',
  done: 'bg-st-done',
  error: 'bg-st-error',
};

export const STATUS_LABEL: Record<SessionStatus, string> = {
  idle: 'Idle',
  working: 'Working',
  blocked: 'Awaiting approval',
  done: 'Done',
  error: 'Error · can resume',
};

/** `spin`: show a spinner instead of the pulsing dot while working (spec 017; used by session tabs). */
export function StatusDot({ status, className, spin }: { status: SessionStatus; className?: string; spin?: boolean }) {
  if (spin && status === 'working') return <Spinner label={STATUS_LABEL.working} className={className} />;
  return <span role="img" aria-label={STATUS_LABEL[status]} className={cn('inline-block size-1.5 shrink-0 rounded-full', COLOR[status], className)} />;
}
