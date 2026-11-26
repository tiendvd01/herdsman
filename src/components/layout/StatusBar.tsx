import { isTauri } from '@tauri-apps/api/core';
import { AlertTriangle, SquareTerminal } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FloatingTerminalPanel, type PanelPosition } from '@/components/terminal/FloatingTerminalPanel';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { Tooltip } from '@/components/ui/tooltip';
import { api, errMsg } from '@/lib/api';
import { useAppInfo } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/useUiStore';
import { AccountUsage } from './AccountUsage';

export function StatusBar({ workspaceId, projectId }: {
  workspaceId: string | null;
  projectId: string | null;
}) {
  const { data, isError } = useAppInfo();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [position, setPosition] = useState<PanelPosition>();
  const client = useQueryClient();
  const desktop = isTauri();
  const list = useQuery({
    queryKey: ['floating-terminals'],
    queryFn: api.floatingTerminalList,
    enabled: open && desktop,
    refetchInterval: 2000,
  });
  const terminals = list.data ?? [];
  const active = terminals.find((terminal) => terminal.address === selected) ?? terminals[0];
  const create = useMutation({
    mutationFn: () => api.floatingTerminalCreate(workspaceId, projectId),
    onSuccess: async (terminal) => {
      await client.cancelQueries({ queryKey: ['floating-terminals'] });
      client.setQueryData<typeof terminals>(['floating-terminals'], (current) =>
        current?.some(({ address }) => address === terminal.address)
          ? current : [...(current ?? []), terminal]);
      setSelected(terminal.address);
      void client.invalidateQueries({ queryKey: ['floating-terminals'] });
    },
    onError: (error) => toast(errMsg(error), 'error'),
  });
  const close = useMutation({
    mutationFn: (address: string) => api.floatingTerminalStop(address),
    onSuccess: async (_, address) => {
      await client.cancelQueries({ queryKey: ['floating-terminals'] });
      client.setQueryData<typeof terminals>(['floating-terminals'], (current) =>
        current?.filter((terminal) => terminal.address !== address));
      setSelected((current) => current === address ? undefined : current);
      void client.invalidateQueries({ queryKey: ['floating-terminals'] });
    },
    onError: (error) => toast(errMsg(error), 'error'),
  });
  const statuses = useUiStore((s) => s.statuses);
  const running = Object.values(statuses).filter(({ state }) => state === 'working' || state === 'blocked').length;
  const connected = data?.hc_connected;
  const label = isError ? 'hc status unavailable'
    : !data ? 'Checking hc…'
    : connected ? 'hc connected'
    : data.hc_path ? 'hc not connected'
    : 'hc not installed';

  return (
    <footer aria-label="App status" className="shrink-0 border-t border-border bg-surface text-xs text-muted-foreground">
      <div className="flex h-8 items-center justify-between gap-3 px-3">
        <div className="flex items-center gap-2">
          <span aria-live="polite" className="inline-flex items-center gap-2">
            <span aria-hidden="true" className={cn('size-1.5 rounded-full',
              isError || (data && !connected) ? 'bg-st-error' : connected ? 'bg-st-done' : 'bg-muted-foreground')} />
            {label}
          </span>
          {connected && !isError && running > 0 && (
            <span className="border-l border-border pl-2">{running} {running === 1 ? 'session' : 'sessions'} running</span>
          )}
          {data && !data.node_path && (
            <Tooltip content="Node.js not found — agents cannot run">
              <AlertTriangle className="size-3.5 text-st-blocked" aria-label="Node.js not found" />
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-1">
          <AccountUsage />
          <Button variant="muted" size="xs" aria-expanded={open} aria-controls={open ? "floating-terminal-panel" : undefined}
            onClick={() => desktop ? setOpen(!open) : toast('Terminal is available in the desktop app.', 'error')}>
            <SquareTerminal data-icon="inline-start" aria-hidden="true" />
            Terminal
          </Button>
        </div>
      </div>
      {open && (
        <FloatingTerminalPanel terminal={active?.address} terminals={terminals.map(({ address }) => address)}
          position={position} onMove={setPosition} onHide={() => setOpen(false)}
          onSelect={setSelected} onClose={close.mutate} closing={close.isPending} onCreate={() => create.mutate()} creating={create.isPending}
          error={list.isError ? errMsg(list.error) : undefined} loading={list.isPending} />
      )}
    </footer>
  );
}
