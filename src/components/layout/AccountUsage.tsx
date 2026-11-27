import { useEffect, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { queryOptions, useQueries, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { EngineIcon, ENGINE_LABEL } from '@/components/ui/engine-icon';
import { Tooltip } from '@/components/ui/tooltip';
import { limitView, type UsageLevel } from '@/lib/usageFormat';
import { useSessionStore } from '@/stores/useSessionStore';
import { api } from '@/lib/api';
import type { UsageProvider } from '@/lib/types';

const engines = ['claude', 'codex'] as const;
const usageQuery = (engine: UsageProvider) => queryOptions({
  queryKey: ['account-usage', engine],
  queryFn: async () => {
    const snapshot = await api.accountUsage(engine);
    if (snapshot) useSessionStore.getState().applyLimits(engine, snapshot);
    return snapshot ?? null;
  },
  staleTime: 5_000,
  refetchInterval: 30_000,
  retry: false,
});

const fill: Record<UsageLevel, string> = {
  normal: 'bg-primary',
  warn: 'bg-st-blocked',
  danger: 'bg-destructive',
};

export function AccountUsage() {
  const client = useQueryClient();
  const desktop = isTauri();
  useQueries({ queries: engines.map((engine) => ({ ...usageQuery(engine), enabled: desktop })) });
  useEffect(() => {
    if (!desktop) return;
    const refresh = () => {
      for (const engine of engines) void client.fetchQuery(usageQuery(engine)).catch(() => {});
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [client, desktop]);
  const limits = useSessionStore((s) => s.limits);
  const [, refreshClock] = useState(0);
  useEffect(() => {
    if (!limits.claude && !limits.codex) return;
    const timer = window.setInterval(() => refreshClock((tick) => tick + 1), 60_000);
    return () => window.clearInterval(timer);
  }, [limits]);
  const now = Date.now();
  const providers = engines.map((engine) => {
    const snapshot = limits[engine];
    const week = limitView(snapshot?.seven_day, snapshot?.seven_day?.ts ?? now, now);
    const windows = [
      { label: 'Session (5h)', view: limitView(snapshot?.five_hour, snapshot?.five_hour?.ts ?? now, now) },
      { label: 'Week', view: week },
    ];
    return { engine, windows, week };
  });

  return providers.map(({ engine, windows, week }) => {
    const name = ENGINE_LABEL[engine];
    const summary = `${week?.text ?? '—'} 7d`;
    return (
      <Tooltip key={engine} side="top" align="end"
        onOpenChange={(open) => {
          if (open && desktop) void client.fetchQuery(usageQuery(engine)).catch(() => {});
        }}
        contentClassName="w-64 rounded-lg border border-border bg-surface p-3 text-sm text-foreground shadow-overlay"
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
