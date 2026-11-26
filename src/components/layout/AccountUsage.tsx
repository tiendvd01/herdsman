import { useState } from 'react';
import { ChartNoAxesColumnIncreasing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EngineIcon } from '@/components/ui/engine-icon';
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
  const [open, setOpen] = useState(false);
  const now = Date.now();
  const providers = (['claude', 'codex'] as const).flatMap((engine) => {
    const snapshot = limits[engine];
    if (!snapshot) return [];
    const windows = [
      { label: 'Session (5h)', view: limitView(snapshot.five_hour, snapshot.ts, now) },
      { label: 'Week', view: limitView(snapshot.seven_day, snapshot.ts, now) },
    ];
    return windows.some(({ view }) => view !== null) ? [{ engine, windows }] : [];
  });

  return (
    <Tooltip open={open} onOpenChange={setOpen} side="top" align="end"
      contentClassName="w-64 rounded-lg border border-border bg-popover p-3 text-sm text-popover-foreground shadow-md"
      content={
        <div className="flex flex-col gap-3">
          <strong className="font-semibold">Usage</strong>
          {providers.length ? providers.map(({ engine, windows }) => (
            <div key={engine} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 font-medium"><EngineIcon engine={engine} />{engine === 'claude' ? 'Claude' : 'Codex'}</div>
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
          )) : <span className="text-muted-foreground">Usage data unavailable.</span>}
        </div>
      }>
      <Button variant="muted" size="xs">
        <ChartNoAxesColumnIncreasing data-icon="inline-start" aria-hidden="true" />
        Usage
      </Button>
    </Tooltip>
  );
}
