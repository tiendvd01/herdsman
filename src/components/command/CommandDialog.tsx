import { TruncatedText } from '@/components/ui/truncated-text';
// ⌘K: scoped conversation search and application navigation.
import { useEffect, useId, useRef, useState } from 'react';
import * as D from '@radix-ui/react-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ALargeSmall, Folder, Folders, FolderPlus, Moon, Paintbrush, PanelLeft, PanelRight, Plus, Search, Settings, SquarePlus, ZoomIn, ZoomOut } from 'lucide-react';
import { contentPx, formatZoom } from '@/lib/uiZoom';
import { ZOOM_LABEL } from '@/lib/zoomShortcuts';
import { api, errMsg } from '@/lib/api';
import { createSession, cycleTheme, openClaudeConversation } from '@/lib/actions';
import { usePaletteWorkspaces, useProjects, useSessions } from '@/lib/queries';
import type { Workspace } from '@/lib/types';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/useUiStore';
import { SHORTCUT_LABEL } from '@/lib/sidebarShortcuts';
import { StatusDot } from '@/components/ui/status-dot';

const CATEGORIES = ['All', 'Workspaces', 'Projects', 'Actions', 'Settings'] as const;
type Category = (typeof CATEGORIES)[number];
type Scope = 'all' | 'project' | 'workspace';
type Entry = { key: string; group: string; run: () => void; node: React.ReactNode };

function ResultText({ title, detail }: { title: string; detail?: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col py-1 leading-snug">
      <TruncatedText className="truncate text-[13px]">{title}</TruncatedText>
      {detail && <TruncatedText className="truncate text-xs text-muted-foreground">{detail}</TruncatedText>}
    </span>
  );
}

export function CommandDialog() {
  const qc = useQueryClient();
  const open = useUiStore((s) => s.cmdOpen);
  const setOpen = useUiStore((s) => s.setCmdOpen);

  // App-wide shortcuts shown in the menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const ui = useUiStore.getState();
      const k = e.key.toLowerCase();
      if (k === 'k') ui.setCmdOpen(!ui.cmdOpen);
      else if (k === 'o' && !e.shiftKey) ui.setAddProjectOpen(true);
      else if (k === 'n' && !e.shiftKey && ui.projectId) ui.setNewWorkspaceFor(ui.projectId);
      else if (k === 't' && !e.shiftKey && ui.workspaceId) createSession(qc, ui.workspaceId);
      else if (k === 'l' && e.shiftKey) cycleTheme();
      else if (k === ',' && !e.shiftKey) {
        ui.setCmdOpen(false);
        ui.setSettingsOpen(true);
      }
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [qc]);

  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-scrim" />
        <D.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[min(12%,120px)] z-50 flex max-h-[82%] w-[min(600px,calc(100%-32px))] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-lg focus:outline-none"
        >
          <D.Title className="sr-only">Command menu</D.Title>
          {open ? <CommandBody close={() => setOpen(false)} /> : null}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

function CommandBody({ close }: { close: () => void }) {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [scope, setScope] = useState<Scope | null>(null);
  const [activeKey, setActiveKey] = useState<string>();
  const resultsId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const projectId = useUiStore((s) => s.projectId);
  const workspaceId = useUiStore((s) => s.workspaceId);
  const recentWorkspaceIds = useUiStore((s) => s.recentWorkspaceIds);
  const statuses = useUiStore((s) => s.statuses);
  const rightOpen = useUiStore((s) => s.rightOpen);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const zoom = useUiStore((s) => s.zoom);
  const contentStep = useUiStore((s) => s.contentStep);
  const projectsQuery = useProjects();
  const workspacesQuery = usePaletteWorkspaces();
  const projects = projectsQuery.data ?? [];
  const workspaces = workspacesQuery.data ?? [];
  const { data: sessions = [] } = useSessions(workspaceId);
  const project = projects.find((p) => p.id === projectId);
  const ws = workspaces.find((w) => w.id === workspaceId && w.project_id === projectId);
  const selectedScope = scope ?? (ws ? 'workspace' : project ? 'project' : 'all');
  const invalidScope = (selectedScope === 'workspace' && !ws) || (selectedScope === 'project' && !project);
  const contextPending = scope === null && (
    (!!projectId && projectsQuery.isPending) || (!!workspaceId && workspacesQuery.isPending)
  );
  const query = q.trim();
  const needle = query.toLowerCase();
  const searchEnabled = category === 'All' && !!query && !invalidScope && !contextPending && debounced === query;
  const scopedProjectId = selectedScope === 'project' ? project?.id : undefined;
  const scopedWorkspaceId = selectedScope === 'workspace' ? ws?.id : undefined;

  useEffect(() => {
    if (!contextPending && scope === null) setScope(selectedScope);
  }, [contextPending, scope, selectedScope]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 150);
    return () => window.clearTimeout(timer);
  }, [query]);

  const managed = useQuery({
    queryKey: ['palette-search', 'managed', debounced, scopedProjectId, scopedWorkspaceId],
    queryFn: () => api.search(debounced, scopedWorkspaceId, scopedProjectId),
    enabled: searchEnabled,
    retry: false,
    gcTime: 0,
  });
  const legacy = useQuery({
    queryKey: ['palette-search', 'claude', debounced, scopedProjectId, scopedWorkspaceId],
    queryFn: () => api.claudeSearch(debounced, { workspaceId: scopedWorkspaceId, projectId: scopedProjectId }),
    enabled: searchEnabled,
    retry: false,
    gcTime: 0,
  });

  const ui = useUiStore.getState();
  const entries: Entry[] = [];
  const shows = (kind: Category) => category === 'All' || category === kind;
  const matches = (...fields: (string | null | undefined)[]) =>
    fields.some((field) => field?.toLowerCase().includes(needle));
  const location = (projectName: string, workspaceName: string | null) =>
    [projectName, workspaceName ?? 'New workspace'].join(' › ');

  function openSession(projectId: string, workspaceId: string, sessionId: string, done: boolean) {
    ui.selectWorkspace(projectId, workspaceId);
    if (done) ui.addTempTab(workspaceId, sessionId);
    ui.selectSession(workspaceId, sessionId);
  }

  async function openFoundSession(projectId: string, workspaceId: string, sessionId: string) {
    try {
      const session = await api.sessionGet(sessionId);
      openSession(projectId, workspaceId, sessionId, (statuses[sessionId]?.state ?? session.status) === 'done');
    } catch (error) {
      toast(errMsg(error), 'error');
    }
  }

  function workspaceEntry(workspace: Workspace, group: string): Entry {
    const name = projects.find((p) => p.id === workspace.project_id)?.name;
    return {
      key: 'w-' + workspace.id,
      group,
      run: () => {
        ui.setCollapsed(workspace.project_id, false);
        ui.selectWorkspace(workspace.project_id, workspace.id);
      },
      node: <><Folder className="size-4 shrink-0 text-muted-foreground" />
        <ResultText title={workspace.name ?? 'New workspace'} detail={name} /></>,
    };
  }

  const availableWorkspaces = workspaces.filter((w) => w.archived_at === null);
  if (shows('Workspaces')) {
    const recentIds = new Set([...(workspaceId ? [workspaceId] : []), ...recentWorkspaceIds]);
    if (category === 'All' && !needle) {
      for (const id of recentIds) {
        const workspace = availableWorkspaces.find((w) => w.id === id);
        if (workspace) entries.push(workspaceEntry(workspace, 'Recent workspaces'));
      }
    }
    for (const workspace of availableWorkspaces) {
      if (category === 'All' && !needle && recentIds.has(workspace.id)) continue;
      if (matches(workspace.name ?? 'New workspace', workspace.branch, workspace.work_dir)) {
        entries.push(workspaceEntry(workspace, 'Workspaces'));
      }
    }
  }

  if (shows('Projects')) {
    for (const p of projects) {
      if (!matches(p.name, p.path)) continue;
      entries.push({
        key: 'p-' + p.id,
        group: 'Projects',
        run: () => {
          ui.setCollapsed(p.id, false);
          if (p.id !== projectId) ui.selectWorkspace(p.id, availableWorkspaces.find((w) => w.project_id === p.id)?.id ?? null);
        },
        node: <><Folders className="size-4 shrink-0 text-muted-foreground" />
          <ResultText title={p.name} detail={p.path} /></>,
      });
    }
  }

  if (category === 'All' && !needle && ws && project) {
    for (const session of [...sessions].sort((a, b) => b.updated_at - a.updated_at)) {
      const status = statuses[session.id]?.state ?? session.status;
      entries.push({
        key: 's-' + session.id,
        group: 'Sessions',
        run: () => openSession(project.id, ws.id, session.id, status === 'done'),
        node: <><StatusDot status={status} />
          <ResultText title={session.title ?? 'New session'} detail={location(project.name, ws.name)} /></>,
      });
    }
  }

  const managedHits = searchEnabled ? managed.data ?? [] : [];
  for (const hit of managedHits) {
    entries.push({
      key: 's-' + hit.session_id,
      group: 'Sessions',
      run: () => void openFoundSession(hit.project_id, hit.workspace_id, hit.session_id),
      node: <ResultText title={hit.session_title ?? 'New session'}
        detail={[location(hit.project_name, hit.workspace_name), hit.workspace_archived && 'Archived', hit.snippet].filter(Boolean).join(' · ')} />,
    });
  }
  for (const hit of searchEnabled ? legacy.data ?? [] : []) {
    if (managedHits.some((s) => s.session_id === hit.session_id
      || (!hit.session_id && s.engine_session_id === hit.claude_session_id))) continue;
    const { session_id: sessionId, project_id: foundProject, workspace_id: foundWorkspace } = hit;
    entries.push({
      key: 'h-' + hit.claude_session_id,
      group: 'Claude conversations',
      run: () => {
        if (sessionId && foundProject && foundWorkspace) void openFoundSession(foundProject, foundWorkspace, sessionId);
        else void openClaudeConversation(qc, hit);
      },
      node: <ResultText title={hit.title ?? 'Conversation'}
        detail={[hit.project_name, hit.workspace_name ?? hit.cwd, hit.snippet].filter(Boolean).join(' · ')} />,
    });
  }

  const commands: { label: string; category?: Category; kbd?: string; Icon: typeof Plus; run: () => void; show?: boolean; keywords?: string }[] = [
    { label: `New workspace in ${project?.name ?? 'project'}`, kbd: '⌘N', Icon: Plus, run: () => project && ui.setNewWorkspaceFor(project.id), show: !!project },
    { label: 'New session in workspace', kbd: '⌘T', Icon: SquarePlus, run: () => ws && createSession(qc, ws.id), show: !!ws && ws.archived_at === null },
    { label: 'Add project', kbd: '⌘O', Icon: FolderPlus, run: () => ui.setAddProjectOpen(true) },
    { label: sidebarOpen ? 'Hide sidebar' : 'Show sidebar', kbd: SHORTCUT_LABEL.left, Icon: PanelLeft, run: () => ui.setSidebarOpen(!sidebarOpen) },
    { label: rightOpen ? 'Hide side panel' : 'Show side panel', kbd: SHORTCUT_LABEL.right, Icon: PanelRight, run: () => ui.setRightOpen(!rightOpen) },
    { label: 'Toggle theme', kbd: '⌘⇧L', Icon: Moon, run: cycleTheme },
    // Spec 006: zoom and content text size
    { label: `Zoom in (${formatZoom(zoom)})`, kbd: ZOOM_LABEL.in, Icon: ZoomIn, run: ui.zoomIn, keywords: 'zoom bigger larger' },
    { label: `Zoom out (${formatZoom(zoom)})`, kbd: ZOOM_LABEL.out, Icon: ZoomOut, run: ui.zoomOut, keywords: 'zoom smaller' },
    { label: 'Reset zoom', kbd: ZOOM_LABEL.reset, Icon: ZoomIn, run: ui.zoomReset, keywords: 'zoom actual size 100%' },
    { label: `Increase text size (${contentPx(contentStep)}px)`, kbd: ZOOM_LABEL['text-in'], Icon: ALargeSmall, run: ui.contentBigger, keywords: 'font text size bigger' },
    { label: `Decrease text size (${contentPx(contentStep)}px)`, kbd: ZOOM_LABEL['text-out'], Icon: ALargeSmall, run: ui.contentSmaller, keywords: 'font text size smaller' },
    { label: 'Reset text size', kbd: ZOOM_LABEL['text-reset'], Icon: ALargeSmall, run: ui.contentReset, keywords: 'font text size default' },
    { label: 'Open settings', category: 'Settings', kbd: '⌘,', Icon: Settings, run: () => ui.setSettingsOpen(true) },
    { label: 'Appearance', category: 'Settings', Icon: Paintbrush, keywords: 'settings theme font', run: () => ui.setSettingsOpen(true) },
  ];
  for (const c of commands) {
    const group = c.category ?? 'Actions';
    if (!shows(group) || c.show === false) continue;
    if (needle && !`${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(needle)) continue;
    entries.push({
      key: `c-${c.label}`,
      group,
      run: c.run,
      node: (
        <>
          <c.Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-[13px]">{c.label}</span>
          {c.kbd ? <kbd className="font-mono text-[11px] text-muted-foreground">{c.kbd}</kbd> : null}
        </>
      ),
    });
  }
  const searching = category === 'All' && !!query && !invalidScope
    && (!searchEnabled || managed.isPending || legacy.isPending);
  const searchError = searchEnabled && (managed.isError || legacy.isError);
  const browsePending = (shows('Projects') && projectsQuery.isPending)
    || (shows('Workspaces') && workspacesQuery.isPending);
  const browseError = (shows('Projects') && projectsQuery.isError)
    || (shows('Workspaces') && workspacesQuery.isError);
  const selectedIndex = Math.max(0, entries.findIndex((entry) => entry.key === activeKey));
  const selectedEntry = entries[selectedIndex];
  const optionId = (key: string) => `${resultsId}-${encodeURIComponent(key)}`;

  useEffect(() => setActiveKey(undefined), [q, category, selectedScope, scopedProjectId, scopedWorkspaceId]);
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedEntry?.key]);

  function pick(e: Entry) {
    close();
    e.run();
  }

  let lastGroup = '';
  return (
    <>
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3 text-muted-foreground">
        <Search className="size-4 shrink-0" />
        <input
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={entries.length > 0}
          aria-controls={resultsId}
          aria-activedescendant={selectedEntry ? optionId(selectedEntry.key) : undefined}
          aria-label="Search sessions, projects or commands"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveKey(entries[Math.min(entries.length - 1, selectedIndex + 1)]?.key);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveKey(entries[Math.max(0, selectedIndex - 1)]?.key);
            } else if (e.key === 'Enter' && selectedEntry) {
              e.preventDefault();
              pick(selectedEntry);
            }
          }}
          placeholder="Type a command or search…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button type="button" onClick={close} className="h-[24px] rounded border border-border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">
          Esc
        </button>
      </div>
      <div role="group" aria-label="Result category" className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-3 py-2">
        {CATEGORIES.map((item) => (
          <button key={item} type="button" aria-pressed={category === item}
            onClick={() => { setCategory(item); setActiveKey(undefined); }}
            className={cn('rounded-md px-3 py-1.5 text-[13px] text-muted-foreground hover:bg-accent', category === item && 'bg-accent text-foreground')}>
            {item}
          </button>
        ))}
      </div>
      {category === 'All' && (
        <label className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
          Session scope
          <select value={selectedScope} onChange={(e) => { setScope(e.target.value as Scope); setActiveKey(undefined); }}
            className="min-w-0 rounded border border-border bg-background px-2 py-1 text-foreground">
            <option value="all">All sessions</option>
            <option value="project" disabled={!project}>{project ? `Current project — ${project.name}` : 'Current project — none selected'}</option>
            <option value="workspace" disabled={!ws}>{ws ? `Current workspace — ${ws.name ?? 'New workspace'}` : 'Current workspace — none selected'}</option>
          </select>
        </label>
      )}
      <div ref={listRef} id={resultsId} role="listbox" aria-label="Results" className="flex min-h-0 max-h-[420px] flex-col overflow-y-auto p-1">
        {entries.length === 0 && !searching && !searchError && !browseError && !browsePending && (category !== 'All' || !invalidScope)
          ? <p role="status" className="px-2 py-6 text-center text-xs text-muted-foreground">No results</p> : null}
        {entries.map((e, i) => {
          const header = e.group !== lastGroup;
          const divider = header && lastGroup !== '';
          lastGroup = e.group;
          return (
            <div key={e.key} role="presentation" className="flex flex-col">
              {divider ? <div aria-hidden="true" className="-mx-1 my-1 h-px bg-border" /> : null}
              {header ? <span aria-hidden="true" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{e.group}</span> : null}
              <button
                type="button"
                role="option"
                id={optionId(e.key)}
                aria-selected={i === selectedIndex}
                tabIndex={-1}
                data-active={i === selectedIndex}
                onMouseMove={() => setActiveKey(e.key)}
                onClick={() => pick(e)}
                className={cn('flex min-h-9 items-center gap-2 rounded-md px-2 text-left', i === selectedIndex && 'bg-accent')}
              >
                {e.node}
              </button>
            </div>
          );
        })}
      </div>
      {category === 'All' && invalidScope && <p role="status" className="border-t border-border px-3 py-2 text-xs">Choose an available session scope.</p>}
      {searching && <p role="status" className="border-t border-border px-3 py-2 text-xs text-muted-foreground">Searching sessions…</p>}
      {(searchError || browseError) && <p role="alert" className="border-t border-border px-3 py-2 text-xs">Some results could not be loaded.</p>}
    </>
  );
}
