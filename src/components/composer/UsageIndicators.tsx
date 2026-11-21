// Chỉ số context của session + hạn mức 5h / tuần của tài khoản, dạng chữ (spec 014).
import { useEffect, useState } from 'react';
import { useSessionStore } from '@/stores/useSessionStore';
import { formatPct, levelOf, limitView, type UsageLevel } from '@/lib/usageFormat';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

const TONE: Record<UsageLevel, string> = {
  normal: 'text-muted-foreground',
  warn: 'text-warn-fg',
  danger: 'text-destructive',
};

function Stat({ label, value, level, aria, tip }: { label: string; value: string; level: UsageLevel; aria: string; tip?: string }) {
  const el = (
    <span role="status" aria-label={aria} data-level={level} className={cn('whitespace-nowrap font-mono text-xs', TONE[level])}>
      {label} {value}
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
    <div className="flex items-center gap-3" data-testid="usage-indicators">
      <Stat
        label="ctx"
        value={formatPct(ctxPct)}
        level={levelOf(ctxPct)}
        aria={ctxPct == null ? 'ctx chưa có dữ liệu' : `ctx đã dùng ${formatPct(ctxPct)}`}
      />
      {five ? <Stat label="5h" value={five.text} level={five.level} aria={`Giới hạn 5 giờ đã dùng ${five.text}`} tip={five.resetText ? `Đặt lại sau ${five.resetText}` : undefined} /> : null}
      {week ? <Stat label="7d" value={week.text} level={week.level} aria={`Giới hạn tuần đã dùng ${week.text}`} tip={week.resetText ? `Đặt lại sau ${week.resetText}` : undefined} /> : null}
    </div>
  );
}
