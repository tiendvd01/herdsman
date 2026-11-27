import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EngineIcon, ENGINE_LABEL } from '@/components/ui/engine-icon';
import { Tooltip } from '@/components/ui/tooltip';
import { limitView, type UsageLevel } from '@/lib/usageFormat';
import { useSessionStore } from '@/stores/useSessionStore';

const fill: Record<UsageLevel, string> = {
  normal: 'bg-primary',
  warn: 'bg-st-blocked',
  danger: 'bg-destructive',
};

export function AccountUsage() {
  const limits = useSessionStore((s) => s.limits);
  const [, refreshClock] = useState(0);
  useEffect(() => {
    if (!limits.claude && !limits.codex) return;
    const timer = window.setInterval(() => refreshClock((tick) => tick + 1), 60_000);
    return () => window.clearInterval(timer);
  }, [limits]);
  const now = Date.now();
  const providers = (['claude', 'codex'] as const).map((engine) => {
    const snapshot = limits[engine];
    const week = limitView(snapshot?.seven_day, snapshot?.ts ?? now, now);
    const windows = [
      { label: 'Session (5h)', view: limitView(snapshot?.five_hour, snapshot?.ts ?? now, now) },
      { label: 'Week', view: week },
    ];
    return { engine, windows, week };
  });

  return providers.map(({ engine, windows, week }) => {
    const name = ENGINE_LABEL[engine];
    const summary = `${week?.text ?? '—'} 7d`;
    return (
      <Tooltip key={engine} side="top" align="end"
        contentClassName="w-64 rounded-lg border border-border bg-background p-3 text-sm text-foreground shadow-md"
        content={
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 font-medium"><EngineIcon engine={engine} tooltip={false} />{name}</div>
            {windows.every(({ view }) => !view) && <span>Usage data unavailable.</span>}
            {windows.map(({ label, view }) => view && (
              <div key={label} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span>{label}</span>
                  <span className="tabular-nums text-muted-foreground">{view.text}</span>
                </div>
                <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${fill[view.level]}`}
                    style={{ width: view.text === '—' ? '0%' : view.text.replace('~', '') }} />
                </div>
                {view.resetText && <span className="text-xs text-muted-foreground">Resets in {view.resetText}</span>}
              </div>
            ))}
          </div>
        }>
        <Button variant="muted" size="xs" aria-label={`${name} usage ${summary}`}>
          <EngineIcon engine={engine} tooltip={false} />
          <span className="tabular-nums">{summary}</span>
        </Button>
      </Tooltip>
    );
  });
}
