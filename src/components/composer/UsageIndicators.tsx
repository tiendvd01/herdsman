// Session context usage and account rate limits (spec 014).
import { useEffect, useState } from 'react';
import { useSessionStore } from '@/stores/useSessionStore';
import { formatPct, levelOf, limitView, type UsageLevel } from '@/lib/usageFormat';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

const TONE: Record<UsageLevel, string> = {
  normal: 'text-foreground',
  warn: 'text-warn-fg',
  danger: 'text-destructive',
};

function Stat({ label, value, level, aria, tip }: { label: string; value: string; level: UsageLevel; aria: string; tip?: string }) {
  const el = (
    <span role="status" aria-label={aria} data-level={level} className="inline-flex items-baseline gap-1 whitespace-nowrap px-1.5 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium tabular-nums', value === '—' ? 'text-muted-foreground' : TONE[level])}>{value}</span>
    </span>
  );
  return tip ? <Tooltip content={tip} side="top">{el}</Tooltip> : el;
}

export function UsageIndicators({ sessionId }: { sessionId: string }) {
  const ctxPct = useSessionStore((s) => s.sessions[sessionId]?.ctxPct ?? null);
  const limits = useSessionStore((s) => s.limits);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => setNow(Date.now()), [limits, ctxPct]);

  const five = limits ? limitView(limits.five_hour, limits.ts, now) : null;
  const week = limits ? limitView(limits.seven_day, limits.ts, now) : null;

  return (
    <div className="inline-flex shrink-0 items-center divide-x divide-border rounded-md border border-border/60 bg-muted/40 text-xs leading-4" data-testid="usage-indicators">
      <Stat
        label="Ctx"
        value={formatPct(ctxPct)}
        level={levelOf(ctxPct)}
        aria={ctxPct == null ? 'Context usage unavailable' : `Context used ${formatPct(ctxPct)}`}
      />
      {five ? <Stat label="5h" value={five.text} level={five.level} aria={`5-hour limit used ${five.text}`} tip={five.resetText ? `Resets in ${five.resetText}` : undefined} /> : null}
      {week ? <Stat label="7d" value={week.text} level={week.level} aria={`7-day limit used ${week.text}`} tip={week.resetText ? `Resets in ${week.resetText}` : undefined} /> : null}
    </div>
  );
}
