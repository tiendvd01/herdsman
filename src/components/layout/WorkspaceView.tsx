import { FileChanges } from '@/components/files/FileChanges';
import { FileEditor } from '@/components/files/FileEditor';
import { useFileClose } from '@/components/files/FileCloseDialog';
import { isDirty, useFileStore } from '@/stores/useFileStore';
import { TruncatedText } from '@/components/ui/truncated-text';
// Center column: workspace header, session tab row, conversation (BR 3.1; FR-009, FR-018, FR-027, FR-029).
import { lazy, Suspense, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileDiff, FileText, PanelLeft, PanelRight, Plus, Terminal as TerminalIcon, X } from 'lucide-react';
import { Button, Kbd } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Tooltip } from '@/components/ui/tooltip';
import { Spinner } from '@/components/ui/spinner';
import { StatusDot } from '@/components/ui/status-dot';
import { EngineIcon } from '@/components/ui/engine-icon';
import { SessionView } from '@/components/conversation/SessionView';
import { api, errMsg, type WorkspaceTerminalRef } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { createSession } from '@/lib/actions';
import { qk, useProjects, useSessions, useWorkspaces } from '@/lib/queries';
import type { Project, Session, SessionStatus, Workspace } from '@/lib/types';
import { useNavigationOrder } from '@/lib/useNavigationOrder';
import { cn } from '@/lib/utils';
import { effectiveShortcut, shortcutLabel, useShortcutBindings } from '@/lib/keyboardShortcuts';
import { sessionTabStatus, useUiStore } from '@/stores/useUiStore';

const WorkspaceTerminal = lazy(() => import('@/components/terminal/WorkspaceTerminal'));

export function useLiveStatus(s: Session | undefined): SessionStatus {
  const live = useUiStore((st) => (s ? st.statuses[s.id]?.state : undefined));
  return live ?? s?.status ?? 'idle';
}

export function WorkspaceView({ visible = true }: { visible?: boolean } = {}) {
  const projectId = useUiStore((s) => s.projectId);
  const workspaceId = useUiStore((s) => s.workspaceId);
  const { data: projects = [] } = useProjects();
  const { data: workspaces = [] } = useWorkspaces(projectId, true);
  const project = projects.find((p) => p.id === projectId);
  const ws = workspaces.find((w) => w.id === workspaceId);

  if (!project) {
    return (
      <>
        <TopBar />
        <EmptyState hasProjects={projects.length > 0} />
      </>
    );
  }
  return <WorkspacePane key={ws?.id ?? project.id} project={project} ws={ws} visible={visible} />;
}

function SidebarToggle() {
  const binding = effectiveShortcut('sidebar', useShortcutBindings());
  const open = useUiStore((s) => s.sidebarOpen);
  return (
    <Tooltip content={<ShortcutHint label={open ? 'Collapse sidebar' : 'Expand sidebar'} kbd={shortcutLabel(binding)} />}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-keyshortcuts={shortcutLabel(binding, true)}
        onClick={() => useUiStore.getState().setSidebarOpen(!open)}>
        <PanelLeft />
      </Button>
    </Tooltip>
  );
}

function RightPanelToggle({ buttonRef }: { buttonRef?: React.Ref<HTMLButtonElement> } = {}) {
  const binding = effectiveShortcut('side-panel', useShortcutBindings());
  const rightOpen = useUiStore((s) => s.rightOpen);
  return (
    <Tooltip content={<ShortcutHint label={rightOpen ? 'Hide side panel' : 'Show side panel'} kbd={shortcutLabel(binding)} />}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => useUiStore.getState().setRightOpen(!rightOpen)}
        ref={buttonRef}
        data-right-panel-toggle=""
        aria-label={rightOpen ? 'Hide side panel' : 'Show side panel'}
        aria-keyshortcuts={shortcutLabel(binding, true)}
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

function TopBar() {
  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-surface px-4">
      <SidebarToggle />
      <span className="flex-1 self-stretch" />
      <RightPanelToggle />
    </header>
  );
}

const tabFrame = 'flex shrink-0 items-center rounded-md border border-transparent pr-0.5 transition-colors hover:bg-muted';
const selectedTabFrame = 'border-border bg-muted';
const tabTrigger = 'max-w-[240px] justify-start gap-1.5 px-2 hover:bg-transparent touch-none select-none';
const tabClose = 'size-6 hover:bg-transparent';
const contentTabFrame = 'm-2 min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-primary';

function WorkspacePane({ project, ws, visible }: { project: Project; ws?: Workspace; visible: boolean }) {
  const workspaceId = ws?.id ?? null;
  const qc = useQueryClient();
  const fileTabs = useFileStore((state) => state.tabs);
  const fileId = useFileStore((state) => state.active[project.id]);
  const diffs = useFileStore((state) => state.diffs);
  const workspaceDiffs = diffs.filter((diff) => diff.workspaceId === workspaceId && diff.projectId === project.id);
  const selectedDiff = workspaceDiffs.find((diff) => diff.id === fileId);
  const selectedFile = fileTabs.find((file) => file.id === fileId);
  const selectedDocument = selectedFile ?? selectedDiff;
  const launcherOpen = useUiStore((s) => s.sessionLauncherOpen);
  const setLauncherOpen = useUiStore((s) => s.setSessionLauncherOpen);
  const launcherShortcut = effectiveShortcut('new-session', useShortcutBindings());
  function launchAgent(engine: 'claude' | 'codex') {
    if (!workspaceId) return;
    void createSession(qc, workspaceId, engine).then((session) => {
      if (!session) return;
      setTerminalAddress(undefined);
      useFileStore.getState().activate(project.id);
    });
  }
  const [terminalAddress, setTerminalAddress] = useState<string>();
  const terminalQueryKey = qk.workspaceTerminals(workspaceId ?? '');
  const { data: workspaceTerminals = [], isSuccess: terminalsLoaded } = useQuery({
    queryKey: terminalQueryKey,
    queryFn: () => api.workspaceTerminalList(workspaceId!),
    enabled: !!workspaceId && ws?.archived_at == null,
    retry: false,
  });
  const terminals = ws?.archived_at == null ? workspaceTerminals : [];
  const selectedTerminal = selectedDocument ? undefined : terminals.find((t) => t.address === terminalAddress);
  const createTerminal = useMutation({
    mutationFn: () => api.workspaceTerminalCreate(workspaceId!),
    onSuccess: (terminal) => {
      void qc.cancelQueries({ queryKey: terminalQueryKey });
      qc.setQueryData<WorkspaceTerminalRef[]>(terminalQueryKey, (items) => [
        ...(items ?? []).filter((item) => item.address !== terminal.address),
        terminal,
      ]);
      if (inContext()) selectTerminal(terminal.address);
    },
    onError: (error) => toast(errMsg(error), 'error'),
  });
  const stopTerminal = useMutation({
    mutationFn: (address: string) => api.workspaceTerminalStop(workspaceId!, address),
    onSuccess: (_, address) => {
      void qc.cancelQueries({ queryKey: terminalQueryKey });
      qc.setQueryData<WorkspaceTerminalRef[]>(terminalQueryKey, (items) => items?.filter((item) => item.address !== address));
      setTerminalAddress((current) => current === address ? undefined : current);
      const target = selectedTerminal?.address === address ? nextTab(terminalKey(address), order) : undefined;
      if (target && inContext()) selectNeighbor(target);
      focusAfterClose(target ?? '');
    },
    onError: (error) => toast(errMsg(error), 'error'),
  });
  function selectTerminal(address: string) {
    useFileStore.getState().activate(project.id);
    setTerminalAddress(address);
  }

  const activeFileTab = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeFileTab.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [fileId, workspaceId]);
  const rowRef = useRef<HTMLDivElement>(null);
  const newSessionRef = useRef<HTMLButtonElement>(null);
  const rightPanelRef = useRef<HTMLButtonElement>(null);
  const closeTrigger = useRef<HTMLButtonElement | null>(null);
  const closedFocus = useRef<string>();
  const tabPrefix = useId();
  const domId = (key: string, part: 'tab' | 'panel') => `${tabPrefix}-${part}-${encodeURIComponent(key)}`;
  const inContext = () => {
    const ui = useUiStore.getState();
    return ui.projectId === project.id && ui.workspaceId === workspaceId;
  };
  function focusAfterClose(key: string) {
    requestAnimationFrame(() => {
      if (!inContext() || !rowRef.current) return;
      const target = document.getElementById(domId(key, 'tab'))
        ?? rowRef.current.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')
        ?? newSessionRef.current ?? rightPanelRef.current;
      target?.focus();
    });
  }
  function restoreCloseFocus(event: Event) {
    event.preventDefault();
    const key = closedFocus.current;
    const trigger = closeTrigger.current;
    closedFocus.current = undefined;
    closeTrigger.current = null;
    if (key !== undefined) focusAfterClose(key);
    else if (inContext()) trigger?.focus();
  }
  const fileClose = useFileClose(restoreCloseFocus);
  const { data: sessions = [], isSuccess: sessionsLoaded } = useSessions(workspaceId);
  const statuses = useUiStore((s) => s.statuses);
  const viewedCompletions = useUiStore((s) => s.viewedCompletions);
  const current = useUiStore((s) => workspaceId ? s.sessionByWorkspace[workspaceId] : undefined);
  const temp = useUiStore((s) => workspaceId ? s.tempTabs[workspaceId] : undefined) ?? [];

  const [pendingClose, setPendingClose] = useState<{ id: string; wasDone: boolean } | null>(null);
  const closePending = pendingClose !== null;
  const statusOf = (s: Session) => statuses[s.id]?.state ?? s.status;
  // FR-029: the tab row only shows unfinished sessions + the one being viewed + temporary tabs.
  const tabs = useMemo(
    () =>
      sessions
        .filter((s) => s.id === current || s.id === pendingClose?.id || temp.includes(s.id) || (s.pinned_tab && statusOf(s) !== 'done'))
        .sort((a, b) => a.created_at - b.created_at),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, current, pendingClose, temp, statuses],
  );
  const active = sessions.find((s) => s.id === current) ?? tabs[0];
  const visibleSession = visible && !selectedTerminal && !selectedDocument ? active : undefined;
  const visibleCompletion = visibleSession ? statuses[visibleSession.id] : undefined;
  useLayoutEffect(() => {
    if (
      visibleSession && visibleCompletion?.completionTs !== undefined
      && visibleCompletion.completionTs >= performance.timeOrigin && document.hasFocus()
    ) {
      useUiStore.getState().acknowledgeCompletion(visibleSession);
    }
  }, [visibleSession, visibleCompletion]);
  const windowBlurred = useRef(false);
  useEffect(() => {
    const onBlur = () => { windowBlurred.current = true; };
    const onFocus = () => {
      if (windowBlurred.current && visibleSession) {
        useUiStore.getState().acknowledgeCompletion(visibleSession);
      }
      windowBlurred.current = false;
    };
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [visibleSession]);
  const projectFiles = fileTabs.filter((file) => file.projectId === project.id);
  const sessionKey = (id: string) => `session:${id}`;
  const fileKey = (id: string) => `file:${id}`;
  const diffKey = (id: string) => `diff:${id}`;
  const terminalKey = (address: string) => `terminal:${address}`;
  const tabKeys = [
    ...tabs.map((session) => sessionKey(session.id)),
    ...terminals.map((terminal) => terminalKey(terminal.address)),
    ...projectFiles.map((file) => fileKey(file.id)),
    ...workspaceDiffs.map((diff) => diffKey(diff.id)),
  ];
  // Reopened file and diff tabs have a new position even if another workspace had them open.
  const reorderKeys = new Map([
    ...projectFiles.map((file) => [fileKey(file.id), fileKey(file.openedId ?? file.id)] as const),
    ...workspaceDiffs.map((diff) => [diffKey(diff.id), diffKey(diff.openedId ?? diff.id)] as const),
  ]);
  const reorderKey = (key: string) => reorderKeys.get(key) ?? key;
  const tabByReorderKey = new Map(tabKeys.map((key) => [reorderKey(key), key]));
  const tabReorder = useNavigationOrder(workspaceId ? `tabs:${workspaceId}` : `project-tabs:${project.id}`,
    [...tabByReorderKey.keys()], 'horizontal', !workspaceId || (sessionsLoaded && (terminalsLoaded || ws?.archived_at != null)));
  const order = tabReorder.order.map((key) => tabByReorderKey.get(key)!);

  function navigateTabs(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!(event.target instanceof HTMLElement) || event.target.getAttribute('role') !== 'tab') return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const index = items.indexOf(event.target as HTMLButtonElement);
    let next: number;
    switch (event.key) {
      case 'ArrowLeft': next = (index + items.length - 1) % items.length; break;
      case 'ArrowRight': next = (index + 1) % items.length; break;
      case 'Home': next = 0; break;
      case 'End': next = items.length - 1; break;
      default: return;
    }
    event.preventDefault();
    items[next]?.focus();
  }

  function nextTab(key: string, prior: string[]) {
    const index = prior.indexOf(key);
    return [...prior.slice(index + 1), ...prior.slice(0, index).reverse()]
      .find((candidate) => {
        if (candidate.startsWith('terminal:')) return terminals.some((t) => terminalKey(t.address) === candidate);
        if (candidate.startsWith('diff:')) return useFileStore.getState().diffs.some((diff) => diffKey(diff.id) === candidate);
        if (candidate.startsWith('file:')) return useFileStore.getState().tabs.some((file) => fileKey(file.id) === candidate);
        const ui = useUiStore.getState();
        return !!workspaceId && (qc.getQueryData<Session[]>(qk.sessions(workspaceId)) ?? []).some((session) =>
          sessionKey(session.id) === candidate &&
          (ui.tempTabs[workspaceId]?.includes(session.id) || (session.pinned_tab && (ui.statuses[session.id]?.state ?? session.status) !== 'done') || ui.sessionByWorkspace[workspaceId] === session.id));
      });
  }

  function selectNeighbor(key: string | undefined) {
    if (key?.startsWith('terminal:')) {
      selectTerminal(key.slice(9));
    } else if (key?.startsWith('file:') || key?.startsWith('diff:')) {
      useFileStore.getState().activate(project.id, key.slice(5));
    } else if (key?.startsWith('session:') && workspaceId) {
      setTerminalAddress(undefined);
      useFileStore.getState().activate(project.id);
      useUiStore.getState().selectSession(workspaceId, key.slice(8));
    }
  }

  function requestFileClose(file: typeof projectFiles[number], trigger: HTMLButtonElement) {
    const key = fileKey(file.id);
    closeTrigger.current = trigger;
    const dirty = isDirty(file);
    fileClose.close(file, () => {
      if (!inContext()) return;
      const target = file.id === fileId ? nextTab(key, order) : undefined;
      if (file.id === fileId) selectNeighbor(target);
      if (dirty) closedFocus.current = target ?? '';
      else {
        closeTrigger.current = null;
        focusAfterClose(target ?? '');
      }
    });
  }

  function closeDiff(id: string) {
    const key = diffKey(id);
    useFileStore.getState().closeDiff(id);
    if (id === fileId) {
      const target = nextTab(key, order);
      selectNeighbor(target);
      focusAfterClose(target ?? '');
    } else {
      focusAfterClose('');
    }
  }

  const previousSession = useRef(current);
  useEffect(() => {
    if (current && previousSession.current !== current) {
      setTerminalAddress(undefined);
      const store = useFileStore.getState();
      const diff = store.diffs.find((tab) => tab.id === store.active[project.id]);
      if (!diff || diff.workspaceId === workspaceId) store.activate(project.id);
    }
    previousSession.current = current;
  }, [current, project.id, workspaceId]);

  useEffect(() => {
    if (workspaceId && !selectedTerminal && !selectedDocument && active && active.id !== current) useUiStore.getState().selectSession(workspaceId, active.id);
  }, [active, current, selectedDocument, selectedTerminal, workspaceId]);


  const [closing, setClosing] = useState<Session | null>(null);
  const [closeWorkspace, setCloseWorkspace] = useState(false);
  const lastTab = !!closing && !terminals.length && tabs.length === 1 && tabs[0]?.id === closing.id;
  const running = !!closing && ['working', 'blocked'].includes(statusOf(closing));

  function requestClose(s: Session, trigger: HTMLButtonElement) {
    closeTrigger.current = trigger;
    const st = statusOf(s);
    if ((!terminals.length && tabs.length === 1) || st === 'working' || st === 'blocked') {
      setCloseWorkspace(false);
      setClosing(s);
    } else {
      void closeTab(s);
    }
  }

  async function closeTab(s: Session, leaveWorkspace = false) {
    if (!ws) return;
    const wasSelected = !selectedTerminal && !selectedDocument && active?.id === s.id;
    let unpinned = false;
    const hadDialog = !!closing;
    setPendingClose({ id: s.id, wasDone: statusOf(s) === 'done' });
    const key = qk.sessions(ws.id);
    try {
      await api.sessionSetPinned(s.id, false);
      unpinned = true;
      await api.sessionClose(s.id);
      qc.setQueryData<Session[]>(key, (items) =>
        items?.map((item) => item.id === s.id ? { ...item, pinned_tab: false } : item),
      );
      const ui = useUiStore.getState();
      const files = useFileStore.getState();
      const activeId = files.active[project.id];
      const hasDocument = files.tabs.some((file) => file.id === activeId)
        || files.diffs.some((diff) => diff.id === activeId && diff.workspaceId === ws.id);
      const stillSelected = wasSelected && !hasDocument
        && (ui.sessionByWorkspace[ws.id] ?? s.id) === s.id;
      ui.removeTempTab(ws.id, s.id);
      if (ui.sessionByWorkspace[ws.id] === s.id) ui.selectSession(ws.id, null);
      if (inContext()) {
        const target = stillSelected ? nextTab(sessionKey(s.id), order) : undefined;
        if (stillSelected) selectNeighbor(target);
        if (leaveWorkspace && !target) {
          ui.selectWorkspace(ws.project_id, null);
          requestAnimationFrame(() => {
            const state = useUiStore.getState();
            if (state.projectId === project.id && state.workspaceId === null)
              document.querySelector<HTMLButtonElement>('main [data-right-panel-toggle]')?.focus();
          });
        } else if (hadDialog) closedFocus.current = target ?? '';
        else {
          closeTrigger.current = null;
          focusAfterClose(target ?? '');
        }
      }
      setClosing(null);
    } catch (error) {
      if (unpinned && s.pinned_tab) {
        await api.sessionSetPinned(s.id, true).catch((rollbackError) => toast(errMsg(rollbackError), 'error'));
      }
      const ui = useUiStore.getState();
      if ((ui.statuses[s.id]?.state ?? s.status) === 'done') ui.addTempTab(ws.id, s.id);
      toast(errMsg(error), 'error');
      if (!hadDialog) {
        const trigger = closeTrigger.current;
        requestAnimationFrame(() => { if (inContext()) trigger?.focus(); });
      }
    } finally {
      void qc.invalidateQueries({ queryKey: key });
      setPendingClose(null);
    }
  }

  const tabNodes = new Map([
    ...tabs.map((s) => {
      const key = sessionKey(s.id);
      const indicator = sessionTabStatus(s, statuses[s.id], viewedCompletions[s.id]);
      const selected = !selectedTerminal && !selectedDocument && s.id === active?.id;
      return (
        <div
          key={key}
          {...tabReorder.row(reorderKey(key))}
          className={cn(tabFrame, tabReorder.indicator, selected && selectedTabFrame)}
        >
          <Button
            variant={selected ? 'ghost' : 'muted'}
            size="xs"
            {...tabReorder.item(reorderKey(key))}
            role="tab"
            id={domId(sessionKey(s.id), 'tab')}
            aria-controls={domId(sessionKey(s.id), 'panel')}
            tabIndex={selected ? 0 : -1}
            aria-selected={selected}
            className={tabTrigger}
            onClick={() => {
              setTerminalAddress(undefined);
              useFileStore.getState().activate(project.id);
              if (workspaceId) {
                const ui = useUiStore.getState();
                ui.selectSession(workspaceId, s.id);
                if (document.hasFocus()) ui.acknowledgeCompletion(s);
              }
            }}
          >
            <span className="flex size-3 shrink-0 items-center justify-center">
              {pendingClose?.id === s.id && !pendingClose.wasDone
                ? <Spinner label="Closing session" className="text-muted-foreground" />
                : <StatusDot status={indicator} spin />}
            </span>
            <TruncatedText className="truncate">{s.title ?? 'New session'}</TruncatedText>
            <EngineIcon engine={s.engine} />
            {s.permission_mode === 'bypass' ? (
              <Badge variant="warn" className="h-[18px] px-1.5 text-[11px]">
                bypass
              </Badge>
            ) : null}
          </Button>
          <Button
            variant="muted"
            size="icon-sm"
            data-close-tab
            onClick={(event) => requestClose(s, event.currentTarget)}
            tabIndex={selected ? 0 : -1}
            disabled={closePending}
            className={tabClose}
            aria-label={`Hide tab ${s.title ?? 'session'}`}
          >
            <X />
          </Button>
        </div>
      );
    }),
    ...terminals.map((terminal) => {
      const key = terminalKey(terminal.address);
      const selected = selectedTerminal?.address === terminal.address;
      return (
        <div key={key} {...tabReorder.row(reorderKey(key))} className={cn(tabFrame, tabReorder.indicator, selected && selectedTabFrame)}>
          <Button variant={selected ? 'ghost' : 'muted'} size="xs"
            {...tabReorder.item(reorderKey(key))}
            role="tab" aria-selected={selected} id={domId(key, 'tab')} aria-controls={domId(key, 'panel')}
            tabIndex={selected || (!active && !selectedDocument && !selectedTerminal && terminals[0] === terminal) ? 0 : -1}
            className={tabTrigger} onClick={() => selectTerminal(terminal.address)}>
            <TerminalIcon aria-hidden="true" />
            Terminal {terminal.address}
          </Button>
          <Button variant="muted" size="icon-sm" data-close-tab aria-label={`Close terminal ${terminal.address}`}
            tabIndex={selected ? 0 : -1} disabled={stopTerminal.isPending}
            className={tabClose} onClick={() => stopTerminal.mutate(terminal.address)}>
            <X />
          </Button>
        </div>
      );
    }),
    ...projectFiles.map((file) => {
      const key = fileKey(file.id);
      return (
        <div key={key} {...tabReorder.row(reorderKey(key))} className={cn(tabFrame, tabReorder.indicator, file.id === fileId && selectedTabFrame)}>
          <Button variant={file.id === fileId ? 'ghost' : 'muted'} size="xs" ref={file.id === fileId ? activeFileTab : undefined} {...tabReorder.item(reorderKey(key))} role="tab" aria-selected={file.id === fileId} title={file.path}
            id={domId(fileKey(file.id), 'tab')} aria-controls={domId(fileKey(file.id), 'panel')}
            tabIndex={file.id === fileId ? 0 : -1}
            className={tabTrigger}
            onClick={() => useFileStore.getState().activate(project.id, file.id)}>
            <FileText data-icon="inline-start" />
            <TruncatedText className="truncate">{file.name}</TruncatedText>
            {isDirty(file) ? <Badge variant="outline" aria-label="Unsaved changes">Unsaved</Badge> : null}
          </Button>
          <Button variant="muted" size="icon-sm" data-close-tab aria-label={`Close ${file.path}`} onClick={(event) => requestFileClose(file, event.currentTarget)} disabled={file.saving} tabIndex={file.id === fileId ? 0 : -1}
            className={tabClose}>
            <X />
          </Button>
        </div>
      );
    }),
    ...workspaceDiffs.map((diff) => {
      const key = diffKey(diff.id);
      const selected = diff.id === fileId;
      return (
        <div key={key} {...tabReorder.row(reorderKey(key))} className={cn(tabFrame, tabReorder.indicator, selected && selectedTabFrame)}>
          <Button variant={selected ? 'ghost' : 'muted'} size="xs" ref={selected ? activeFileTab : undefined}
            {...tabReorder.item(reorderKey(key))}
            role="tab" aria-selected={selected} title={diff.commit ? `${diff.path} (${diff.commit.id})` : diff.path}
            aria-label={`Changes: ${diff.path}${diff.commit ? ` (${diff.commit.shortId})` : ''}`}
            id={domId(key, 'tab')} aria-controls={domId(key, 'panel')}
            tabIndex={selected ? 0 : -1} className={tabTrigger}
            onClick={() => useFileStore.getState().activate(project.id, diff.id)}>
            <FileDiff data-icon="inline-start" />
            <TruncatedText className="truncate">{diff.name}{diff.commit ? ` · ${diff.commit.shortId}` : ''}</TruncatedText>
          </Button>
          <Button variant="muted" size="icon-sm" data-close-tab aria-label={`Close changes for ${diff.path}`}
            onClick={() => closeDiff(diff.id)} tabIndex={selected ? 0 : -1} className={tabClose}>
            <X />
          </Button>
        </div>
      );
    }),
  ].map((node) => [node.key, node]));

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {fileClose.dialog}
      <ConfirmDialog
        open={!!closing}
        onOpenChange={(o) => !o && !closePending && setClosing(null)}
        busy={closePending}
        onCloseAutoFocus={restoreCloseFocus}
        destructive={running}
        title={lastTab ? 'Close the last session?' : 'Close a session that is still running?'}
        description={running
          ? 'Closing the tab stops the agent. You can resume it later from history.'
          : 'Choose whether to keep the workspace open after closing this session.'}
        confirmLabel={running ? 'Stop and close' : 'Close session'}
        onConfirm={() => {
          if (closing) void closeTab(closing, lastTab && closeWorkspace);
        }}
      >
        {lastTab ? (
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={closeWorkspace}
              disabled={closePending}
              onChange={(e) => setCloseWorkspace(e.target.checked)}
            />
            Also close the workspace view
          </label>
        ) : null}
      </ConfirmDialog>
      <header className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-surface px-4">
        <SidebarToggle />
        <div ref={rowRef} data-workspace-tabs data-reorder-scroll onKeyDown={navigateTabs} className="flex min-w-0 items-center gap-1 overflow-x-auto overflow-y-hidden py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label={ws ? "Workspace tabs" : "Project tabs"}>
          {order.map((key) => tabNodes.get(key))}
        </div>
        {ws && ws.archived_at == null ? (
          <DropdownMenu open={visible && launcherOpen} onOpenChange={setLauncherOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="muted" size="icon-sm" ref={newSessionRef}
                className="shrink-0" aria-label="New session in workspace" disabled={createTerminal.isPending}
                aria-keyshortcuts={shortcutLabel(launcherShortcut, true)}
                onClick={(event) => {
                  // Assistive technology can activate the trigger with a click alone.
                  if (event.detail === 0) setLauncherOpen(!launcherOpen);
                }}>
                <Plus />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onKeyDown={(event) => {
              if (event.defaultPrevented || event.nativeEvent.isComposing || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
              const choice = event.key;
              if (choice !== 't' && choice !== '1' && choice !== '2') return;
              event.preventDefault();
              if (event.repeat || (choice === 't' && createTerminal.isPending)) return;
              setLauncherOpen(false);
              if (choice === 't') createTerminal.mutate();
              else launchAgent(choice === '1' ? 'claude' : 'codex');
            }}>
              <DropdownMenuItem aria-keyshortcuts="T" disabled={createTerminal.isPending} onSelect={() => createTerminal.mutate()}>
                <TerminalIcon aria-hidden="true" /> Terminal
                <Kbd aria-hidden="true" className="ml-auto">T</Kbd>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {(['claude', 'codex'] as const).map((engine, index) => (
                <DropdownMenuItem key={engine} aria-keyshortcuts={String(index + 1)} onSelect={() => launchAgent(engine)}>
                  <EngineIcon engine={engine} /> {engine === 'claude' ? 'Claude Code' : 'Codex'}
                  <Kbd aria-hidden="true" className="ml-auto">{index + 1}</Kbd>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <span className="min-w-4 flex-1 self-stretch" />
        <RightPanelToggle buttonRef={rightPanelRef} />
      </header>

      {ws && tabs.map((session) => (
        <SessionTabPanel key={session.id} session={session} ws={ws}
          id={domId(sessionKey(session.id), 'panel')} tabId={domId(sessionKey(session.id), 'tab')}
          visible={session.id === visibleSession?.id} />
      ))}
      {selectedTerminal && ws ? (
        <div role="tabpanel" id={domId(terminalKey(selectedTerminal.address), 'panel')}
          aria-labelledby={domId(terminalKey(selectedTerminal.address), 'tab')}
          className={cn('flex', contentTabFrame)}>
          <Suspense fallback={<Spinner label="Opening terminal" className="m-3 text-muted-foreground" />}>
            <WorkspaceTerminal key={selectedTerminal.address} workspaceId={ws.id} address={selectedTerminal.address}
              live={selectedTerminal.state === 'live'} />
          </Suspense>
        </div>
      ) : null}
      {selectedFile ? (
        <div role="tabpanel" id={domId(fileKey(selectedFile.id), 'panel')} aria-labelledby={domId(fileKey(selectedFile.id), 'tab')}
          className={cn('flex', contentTabFrame)}>
          <FileEditor key={selectedFile.id} file={selectedFile} workspaceId={workspaceId ?? undefined} />
        </div>
      ) : null}
      {selectedDiff ? (
        <div role="tabpanel" id={domId(diffKey(selectedDiff.id), 'panel')} aria-labelledby={domId(diffKey(selectedDiff.id), 'tab')}
          className={cn('flex', contentTabFrame)}>
          <FileChanges key={selectedDiff.id} tab={selectedDiff} />
        </div>
      ) : null}
      {order.filter((key) => !key.startsWith('session:')
        && key !== (selectedTerminal && terminalKey(selectedTerminal.address))
        && key !== (selectedFile && fileKey(selectedFile.id))
        && key !== (selectedDiff && diffKey(selectedDiff.id))).map((key) => (
        <div key={key} role="tabpanel" id={domId(key, 'panel')} aria-labelledby={domId(key, 'tab')} hidden />
      ))}
      {!active && !selectedTerminal && !selectedDocument ? (ws ? <div className="flex-1" /> : (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
          Pick a workspace or open a file from the Files panel.
        </div>
      )) : null}
    </div>
  );
}

function SessionTabPanel({ session, ws, id, tabId, visible }: {
  session: Session;
  ws: Workspace;
  id: string;
  tabId: string;
  visible: boolean;
}) {
  const [opened, setOpened] = useState(visible);
  if (visible && !opened) setOpened(true);

  return (
    <div role="tabpanel" id={id} aria-labelledby={tabId}
      hidden={!visible} className={visible ? cn('flex', contentTabFrame) : undefined}>
      {opened && <SessionView session={session} ws={ws} />}
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
