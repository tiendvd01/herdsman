// Session context usage (spec 014).
import { useSessionStore } from '@/stores/useSessionStore';
import { formatPct, levelOf, type UsageLevel } from '@/lib/usageFormat';
import { cn } from '@/lib/utils';

const TONE: Record<UsageLevel, string> = {
  normal: 'text-foreground',
  warn: 'text-warn-fg',
  danger: 'text-destructive',
};

export function UsageIndicators({ sessionId, onCompact, compactDisabled }: {
  sessionId: string;
  onCompact?: () => void;
  compactDisabled?: boolean;
}) {
  const ctxPct = useSessionStore((s) => s.sessions[sessionId]?.ctxPct ?? null);
  const value = formatPct(ctxPct);
  const level = levelOf(ctxPct);
  return (
    <>
      <span role="status" aria-label={ctxPct == null ? 'Context usage unavailable' : `Context used ${value}`}
        data-level={level} className="inline-flex shrink-0 items-baseline gap-1 whitespace-nowrap rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs leading-4">
        <span className="text-muted-foreground">Ctx</span>
        <span className={cn('font-medium tabular-nums', value === '—' ? 'text-muted-foreground' : TONE[level])}>{value}</span>
      </span>
      {onCompact && level !== 'normal' && (
        <button type="button" className="rounded-md border px-2 py-0.5 text-xs hover:bg-accent disabled:opacity-50"
          disabled={compactDisabled} onClick={onCompact}>
          Compact
        </button>
      )}
    </>
  );
}
