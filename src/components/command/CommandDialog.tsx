// ⌘K: jump to a session (current workspace, or full-text search across projects) and run app commands.
import { useEffect, useMemo, useRef, useState } from 'react';
import * as D from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { ALargeSmall, FolderPlus, Moon, PanelLeft, PanelRight, Plus, Search, Settings, SquarePlus, ZoomIn, ZoomOut } from 'lucide-react';
import { contentPx, formatZoom } from '@/lib/uiZoom';
import { ZOOM_LABEL } from '@/lib/zoomShortcuts';
import { api } from '@/lib/api';
import { createSession, cycleTheme, openClaudeConversation } from '@/lib/actions';
import { useProjects, useSessions, useWorkspaces } from '@/lib/queries';
import type { ClaudeHit } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/useUiStore';
import { SHORTCUT_LABEL } from '@/lib/sidebarShortcuts';
import { StatusDot } from '@/components/ui/status-dot';

type Entry = { key: string; group: 'Sessions' | 'Claude conversations' | 'Commands'; run: () => void; node: React.ReactNode };

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
          className="fixed left-1/2 top-[120px] z-50 flex w-[min(520px,calc(100vw-32px))] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-lg focus:outline-none"
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
  const [hits, setHits] = useState<ClaudeHit[] | null>(null);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const projectId = useUiStore((s) => s.projectId);
  const workspaceId = useUiStore((s) => s.workspaceId);
  const statuses = useUiStore((s) => s.statuses);
  const rightOpen = useUiStore((s) => s.rightOpen);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const zoom = useUiStore((s) => s.zoom);
  const contentStep = useUiStore((s) => s.contentStep);
  const { data: projects = [] } = useProjects();
  const { data: workspaces = [] } = useWorkspaces(projectId);
  const { data: sessions = [] } = useSessions(workspaceId);
  const project = projects.find((p) => p.id === projectId);
  const ws = workspaces.find((w) => w.id === workspaceId);

  useEffect(() => {
    if (!q.trim()) {
      setHits(null);
      return;
    }
    const h = setTimeout(() => {
      api.claudeSearch(q).then(setHits).catch(() => setHits([]));
    }, 150);
    return () => clearTimeout(h);
  }, [q]);

  const entries = useMemo<Entry[]>(() => {
    const ui = useUiStore.getState();
    const needle = q.trim().toLowerCase();
    const out: Entry[] = [];
    const where = `${project?.name ?? ''} › ${ws?.name ?? 'Workspace'}`;
    for (const s of [...sessions].sort((a, b) => b.updated_at - a.updated_at)) {
      const title = s.title ?? 'New session';
      if (needle) break; // searching: show Claude conversations instead of Herdsman sessions
      const st = statuses[s.id]?.state ?? s.status;
      out.push({
        key: `s-${s.id}`,
        group: 'Sessions',
        run: () => {
          if (st === 'done') ui.addTempTab(s.workspace_id, s.id);
          ui.selectSession(s.workspace_id, s.id);
        },
        node: (
          <>
            <StatusDot status={st} />
            <span className="min-w-0 flex-1 truncate text-[13px]">{title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{where}</span>
          </>
        ),
      });
    }
    for (const h of hits ?? []) {
      out.push({
        key: `h-${h.claude_session_id}`,
        group: 'Claude conversations',
        run: () => void openClaudeConversation(qc, h),
        node: (
          <span className="flex min-w-0 flex-1 flex-col py-1 leading-snug">
            <span className="truncate text-[13px]">{h.title ?? 'Conversation'}</span>
            <span className="truncate text-xs text-muted-foreground">
              {h.project_name ? `${h.project_name} › ${h.workspace_name ?? 'Workspace'}` : (h.cwd ?? 'Unknown folder')} · {h.snippet}
            </span>
          </span>
        ),
      });
    }
    const commands: { label: string; kbd?: string; Icon: typeof Plus; run: () => void; show?: boolean; keywords?: string }[] = [
      { label: `New workspace in ${project?.name ?? 'project'}`, kbd: '⌘N', Icon: Plus, run: () => project && ui.setNewWorkspaceFor(project.id), show: !!project },
      { label: 'New session in workspace', kbd: '⌘T', Icon: SquarePlus, run: () => ws && createSession(qc, ws.id), show: !!ws },
      { label: 'Add project', kbd: '⌘O', Icon: FolderPlus, run: () => ui.setAddProjectOpen(true) },
      { label: sidebarOpen ? 'Hide sidebar' : 'Show sidebar', kbd: SHORTCUT_LABEL.left, Icon: PanelLeft, run: () => ui.setSidebarOpen(!sidebarOpen) },
      { label: rightOpen ? 'Hide side panel' : 'Show side panel', kbd: SHORTCUT_LABEL.right, Icon: PanelRight, run: () => ui.setRightOpen(!rightOpen) },
      { label: 'Toggle theme', kbd: '⌘⇧L', Icon: Moon, run: cycleTheme },
      { label: 'Open settings', kbd: '⌘,', Icon: Settings, run: () => ui.setSettingsOpen(true) },
      // Spec 006: zoom and content text size
      { label: `Zoom in (${formatZoom(zoom)})`, kbd: ZOOM_LABEL.in, Icon: ZoomIn, run: ui.zoomIn, keywords: 'zoom bigger larger' },
      { label: `Zoom out (${formatZoom(zoom)})`, kbd: ZOOM_LABEL.out, Icon: ZoomOut, run: ui.zoomOut, keywords: 'zoom smaller' },
      { label: 'Reset zoom', kbd: ZOOM_LABEL.reset, Icon: ZoomIn, run: ui.zoomReset, keywords: 'zoom actual size 100%' },
      { label: `Increase text size (${contentPx(contentStep)}px)`, kbd: ZOOM_LABEL['text-in'], Icon: ALargeSmall, run: ui.contentBigger, keywords: 'font text size bigger' },
      { label: `Decrease text size (${contentPx(contentStep)}px)`, kbd: ZOOM_LABEL['text-out'], Icon: ALargeSmall, run: ui.contentSmaller, keywords: 'font text size smaller' },
      { label: 'Reset text size', kbd: ZOOM_LABEL['text-reset'], Icon: ALargeSmall, run: ui.contentReset, keywords: 'font text size default' },
    ];
    for (const c of commands) {
      if (c.show === false) continue;
      if (needle && !`${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(needle)) continue;
      out.push({
        key: `c-${c.label}`,
        group: 'Commands',
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
    return out;
  }, [q, hits, sessions, statuses, project, ws, rightOpen, sidebarOpen, zoom, contentStep, qc]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function pick(e: Entry) {
    close();
    e.run();
  }

  let lastGroup = '';
  return (
    <>
      <label className="flex h-12 items-center gap-2 border-b border-border px-3 text-muted-foreground">
        <Search className="size-4 shrink-0" />
        <span className="sr-only">Search sessions, projects or commands</span>
        <input
          type="search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(entries.length - 1, a + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === 'Enter' && entries[active]) {
              e.preventDefault();
              pick(entries[active]);
            }
          }}
          placeholder="Type to search Claude conversations, commands…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button type="button" onClick={close} className="h-[24px] rounded border border-border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">
          Esc
        </button>
      </label>
      <div ref={listRef} className="flex max-h-[420px] flex-col overflow-y-auto p-1">
        {entries.length === 0 ? <p className="px-2 py-6 text-center text-[12px] text-muted-foreground">No results</p> : null}
        {entries.map((e, i) => {
          const header = e.group !== lastGroup;
          const divider = header && lastGroup !== '';
          lastGroup = e.group;
          return (
            <div key={e.key} className="flex flex-col">
              {divider ? <div aria-hidden="true" className="-mx-1 my-1 h-px bg-border" /> : null}
              {header ? <span className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{e.group}</span> : null}
              <button
                type="button"
                data-active={i === active}
                onMouseMove={() => setActive(i)}
                onClick={() => pick(e)}
                className={cn('flex min-h-9 items-center gap-2 rounded-md px-2 text-left', i === active && 'bg-accent')}
              >
                {e.node}
              </button>
            </div>
          );
        })}
      </div>
      {hits === null && q.trim() ? <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">Searching Claude conversations…</p> : null}
    </>
  );
}
