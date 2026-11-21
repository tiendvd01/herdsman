// Center column: workspace header, session tab row, conversation (BR 3.1; FR-009, FR-018, FR-027, FR-029).
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight, PanelLeft, PanelRight, Plus, X } from 'lucide-react';
import { Button, Kbd } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Tooltip } from '@/components/ui/tooltip';
import { StatusDot } from '@/components/ui/status-dot';
import { EngineIcon } from '@/components/ui/engine-icon';
import { HistoryPopover } from '@/components/history/HistoryPopover';
import { SessionView } from '@/components/conversation/SessionView';
import { api } from '@/lib/api';
import { createSession } from '@/lib/actions';
import { qk, useProjects, useSessions, useWorkspaces } from '@/lib/queries';
import type { Session, SessionStatus, Workspace } from '@/lib/types';
import { cn } from '@/lib/utils';
import { IS_MAC, TRAFFIC_LIGHTS_PAD } from '@/lib/platform';
import { SHORTCUT_ARIA, SHORTCUT_LABEL } from '@/lib/sidebarShortcuts';
import { useUiStore } from '@/stores/useUiStore';

export function useLiveStatus(s: Session | undefined): SessionStatus {
  const live = useUiStore((st) => (s ? st.statuses[s.id]?.state : undefined));
  return live ?? s?.status ?? 'idle';
}

export function WorkspaceView() {
  const projectId = useUiStore((s) => s.projectId);
  const workspaceId = useUiStore((s) => s.workspaceId);
  const { data: projects = [] } = useProjects();
  const { data: workspaces = [] } = useWorkspaces(projectId);
  const project = projects.find((p) => p.id === projectId);
  const ws = workspaces.find((w) => w.id === workspaceId);

  if (!project || !ws) {
    return (
      <>
        <TopBar />
        <EmptyState hasProjects={projects.length > 0} />
      </>
    );
  }
  return <WorkspacePane key={ws.id} projectName={project.name} ws={ws} />;
}

function SidebarToggle() {
  const open = useUiStore((s) => s.sidebarOpen);
  return (
    <Tooltip content={<ShortcutHint label={open ? 'Collapse sidebar' : 'Expand sidebar'} kbd={SHORTCUT_LABEL.left} />}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-keyshortcuts={SHORTCUT_ARIA.left}
        onClick={() => useUiStore.getState().setSidebarOpen(!open)}>
        <PanelLeft />
      </Button>
    </Tooltip>
  );
}

function RightPanelToggle() {
  const rightOpen = useUiStore((s) => s.rightOpen);
  return (
    <Tooltip content={<ShortcutHint label={rightOpen ? 'Hide side panel' : 'Show side panel'} kbd={SHORTCUT_LABEL.right} />}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => useUiStore.getState().setRightOpen(!rightOpen)}
        aria-label={rightOpen ? 'Hide side panel' : 'Show side panel'}
        aria-keyshortcuts={SHORTCUT_ARIA.right}
      >
        <PanelRight />
      </Button>
    </Tooltip>
  );
}

/** Tooltip text with its keyboard shortcut (spec 007). */
function ShortcutHint({ label, kbd }: { label: string; kbd: string }) {
  return (
    <span className="flex items-center gap-2">
      {label}
      <Kbd className="border-primary-foreground/25 bg-transparent text-primary-foreground/80">{kbd}</Kbd>
    </span>
  );
}

const Sep = () => <span aria-hidden="true" className="mx-0.5 h-4 w-px shrink-0 bg-border" />;

/** When the sidebar is hidden on macOS, the traffic lights float over the header's left edge. */
function useHeaderPad() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  return !sidebarOpen && IS_MAC ? TRAFFIC_LIGHTS_PAD : 'pl-4';
}

function TopBar() {
  const pad = useHeaderPad();
  return (
    <header data-tauri-drag-region className={cn('flex min-h-14 shrink-0 items-center gap-2 border-b border-border py-2 pr-4', pad)}>
      <SidebarToggle />
      <span data-tauri-drag-region className="flex-1 self-stretch" />
      <RightPanelToggle />
    </header>
  );
}

function WorkspacePane({ projectName, ws }: { projectName: string; ws: Workspace }) {
  const qc = useQueryClient();
  const { data: sessions = [] } = useSessions(ws.id);
  const statuses = useUiStore((s) => s.statuses);
  const current = useUiStore((s) => s.sessionByWorkspace[ws.id]);
  const temp = useUiStore((s) => s.tempTabs[ws.id]) ?? [];

  const statusOf = (s: Session) => statuses[s.id]?.state ?? s.status;
  // FR-029: the tab row only shows unfinished sessions + the one being viewed + temporary tabs.
  const tabs = useMemo(
    () =>
      sessions
        .filter((s) => s.id === current || temp.includes(s.id) || (s.pinned_tab && statusOf(s) !== 'done'))
        .sort((a, b) => a.created_at - b.created_at),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, current, temp, statuses],
  );
  const active = sessions.find((s) => s.id === current) ?? tabs[0];

  useEffect(() => {
    if (active && active.id !== current) useUiStore.getState().selectSession(ws.id, active.id);
  }, [active, current, ws.id]);

  const pad = useHeaderPad();

  const [closing, setClosing] = useState<Session | null>(null);

  function requestClose(s: Session) {
    const st = statusOf(s);
    if (st === 'working' || st === 'blocked') setClosing(s);
    else closeTab(s);
  }

  async function closeTab(s: Session) {
    useUiStore.getState().removeTempTab(ws.id, s.id);
    await api.sessionSetPinned(s.id, false).catch(() => {});
    await api.sessionClose(s.id).catch(() => {});
    qc.invalidateQueries({ queryKey: qk.sessions(ws.id) });
    if (s.id === current) {
      const next = tabs.find((t) => t.id !== s.id);
      if (next) useUiStore.getState().selectSession(ws.id, next.id);
    }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <ConfirmDialog
        open={!!closing}
        onOpenChange={(o) => !o && setClosing(null)}
        destructive
        title="Close a session that is still running?"
        description="The agent has not finished. Closing the tab stops it. You can resume it later from the history."
        confirmLabel="Stop and close"
        onConfirm={() => {
          const s = closing;
          setClosing(null);
          if (s) void closeTab(s);
        }}
      />
      {/* Workspace header */}
      <header data-tauri-drag-region className={cn('flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-border py-2 pr-4', pad)}>
        <SidebarToggle />
        <Sep />
        <nav data-tauri-drag-region aria-label="Breadcrumb" className="flex flex-1 items-center self-stretch">
          <ol data-tauri-drag-region className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] text-muted-foreground">
            <li className="shrink-0 whitespace-nowrap">{projectName}</li>
            <li aria-hidden="true" className="flex">
              <ChevronRight className="size-3.5" />
            </li>
            <li data-tauri-drag-region aria-current="page" className="w-24 min-w-0 grow truncate font-medium text-foreground" title={ws.name ?? undefined}>
              {ws.name ?? 'New workspace'}
            </li>
          </ol>
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <RightPanelToggle />
        </div>
      </header>

      {/* Session tab row */}
      <div className="flex min-h-11 shrink-0 items-end gap-1 border-b border-border px-3">
        <div className="flex min-w-0 items-end gap-0.5 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Sessions in workspace">
          {tabs.map((s) => {
            const st = statusOf(s);
            const selected = s.id === active?.id;
            return (
              <div
                key={s.id}
                className={cn(
                  'group flex h-[39px] shrink-0 items-center gap-1 border-b-2 pl-3 pr-1',
                  selected ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={cn('flex max-w-[240px] items-center gap-2 whitespace-nowrap text-[12px]', selected && 'font-medium')}
                  onClick={() => useUiStore.getState().selectSession(ws.id, s.id)}
                >
                  <span className="flex size-3 shrink-0 items-center justify-center">
                    <StatusDot status={st} spin />
                  </span>
                  <span className="truncate">{s.title ?? 'New session'}</span>
                  <EngineIcon engine={s.engine} />
                  {s.permission_mode === 'bypass' ? (
                    <Badge variant="warn" className="h-[18px] px-1.5 text-[11px]">
                      bypass
                    </Badge>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => requestClose(s)}
                  className="flex size-5 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label={`Hide tab ${s.title ?? 'session'}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
        <Tooltip content="New session in workspace">
          <Button
            variant="muted"
            size="icon-sm"
            className="mb-2 shrink-0"
            onClick={() => createSession(qc, ws.id, active?.engine === 'echo' ? 'echo' : 'claude')}
            aria-label="New session in workspace"
          >
            <Plus />
          </Button>
        </Tooltip>
        <span className="flex-1" />
        <HistoryPopover ws={ws} sessions={sessions} />
      </div>

      {active ? <SessionView key={active.id} session={active} ws={ws} /> : <div className="flex-1" />}
    </div>
  );
}

function EmptyState({ hasProjects }: { hasProjects: boolean }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-[420px] flex-col items-center gap-3 text-center">
        <h2 className="text-[18px] font-semibold tracking-tight">{hasProjects ? 'Pick or create a workspace' : 'Start with a project'}</h2>
        <p className="text-[13px] text-muted-foreground">
          {hasProjects
            ? 'Click + next to a project in the sidebar to create a workspace. Each workspace comes with a session ready for your first prompt.'
            : 'Click + next to Projects in the sidebar and pick a folder on this machine. The agent runs in that folder and keeps running when you close the app.'}
        </p>
        {!hasProjects ? (
          <Button className="mt-2" onClick={() => useUiStore.getState().setAddProjectOpen(true)}>
            <Plus /> Add project
          </Button>
        ) : null}
      </div>
    </div>
  );
}
