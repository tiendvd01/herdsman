import { TruncatedText } from '@/components/ui/truncated-text';
// Left sidebar: app header, ⌘K search, projects → workspaces, hc status (BR 3.1, FR-001–003, FR-019).
import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, ChevronsUpDown, ChevronRight, GitBranch, MoreHorizontal, Plus, Search, Settings, Square } from 'lucide-react';
import lightIconUrl from '@/assets/herdsman_lightmode.png';
import darkIconUrl from '@/assets/herdsman_darkmode.png';
import { useThemeColors } from '@/lib/theme';
import { api } from '@/lib/api';
import { qk, usePaletteWorkspaces, useAppInfo, useProjects, useWorkspaces } from '@/lib/queries';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { effectiveShortcut, shortcutLabel, useShortcutBindings } from '@/lib/keyboardShortcuts';
import { useUiStore } from '@/stores/useUiStore';
import { Button, Kbd } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog';
import { RenameDialog } from '@/components/project/RenameDialog';
import { DeleteProjectDialog } from '@/components/project/DeleteProjectDialog';
import { AddProjectDialog } from '@/components/project/AddProjectDialog';
import { WorkspaceMenu } from '@/components/workspace/WorkspaceMenu';
import { ResizeHandle } from '@/components/layout/ResizeHandle';
import { LEFT } from '@/lib/layout';
import { useLayoutWidths } from '@/lib/useLayoutWidths';
import { useNavigationOrder } from '@/lib/useNavigationOrder';

const focusDemo = import.meta.env.DEV
  && new URLSearchParams(location.search).has('mock') && new URLSearchParams(location.search).has('project-focus');

export function Sidebar() {
  const paletteKey = effectiveShortcut('palette', useShortcutBindings());
  const { data: projects = [], isSuccess: projectsLoaded } = useProjects();
  const projectOrder = useNavigationOrder('projects', projects.map((p) => p.id), 'vertical', projectsLoaded);
  const projectsById = new Map(projects.map((p) => [p.id, p]));
  const selectedId = useUiStore((s) => s.projectId);
  const focusedProject = projectsById.get(selectedId ?? '') ?? projects[0];
  const appearance = useThemeColors().appearance;
  const open = useUiStore((s) => s.sidebarOpen);
  const newWsFor = useUiStore((s) => s.newWorkspaceFor);
  const addOpen = useUiStore((s) => s.addProjectOpen);
  const creatingFor = projects.find((p) => p.id === newWsFor) ?? null;
  const { left: width, leftMax } = useLayoutWidths();
  const ui = useUiStore.getState;

  return (
    <>
      {open && width > 0 ? (
        <aside aria-label="Sidebar" style={{ width }} className="relative flex h-full shrink-0 flex-col gap-2 border-r border-border bg-surface px-2 pb-2">
          {/* Top row shares the window's title bar: traffic lights on the left. */}
          <div data-tauri-drag-region className="-mx-2 h-11 shrink-0 select-none" />

          <div data-tauri-drag-region className="flex shrink-0 select-none items-center gap-1.5 px-2 pb-1">
            <img src={appearance === 'dark' ? darkIconUrl : lightIconUrl} alt="" className="pointer-events-none size-10 rounded-md" />
            <span className="pointer-events-none text-[14px] font-semibold tracking-tight text-foreground">Herdsman</span>
          </div>

          <button
            type="button"
            onClick={() => ui().setCmdOpen(true)}
            aria-keyshortcuts={shortcutLabel(paletteKey, true)}
            className="mx-2 flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-2 text-left text-muted-foreground shadow-xs hover:bg-accent dark:shadow-none"
          >
            <Search className="size-4 shrink-0" />
            <TruncatedText className="flex-1 truncate text-[12px]">Search conversations, commands…</TruncatedText>
            <Kbd>{shortcutLabel(paletteKey)}</Kbd>
          </button>

          {focusDemo && focusedProject ? (
            <nav className="mx-2 flex min-h-0 flex-1 flex-col overflow-y-auto py-1" aria-label="Project workspaces">
              <ProjectNode key={focusedProject.id} project={focusedProject} reorder={projectOrder}
                switcher={<FocusProjectSwitcher project={focusedProject} projects={projects} />} />
            </nav>
          ) : <div className="mx-2 flex min-h-0 flex-1 flex-col py-1">
            <div className="flex h-8 shrink-0 items-center justify-between pl-2">
              <span className="text-xs font-medium text-muted-foreground">Projects</span>
              <Tooltip content="New project">
                <Button variant="muted" size="icon-sm" aria-label="New project" onClick={() => ui().setAddProjectOpen(true)}>
                  <Plus />
                </Button>
              </Tooltip>
            </div>
            <nav data-reorder-scroll className="-mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1" aria-label="Projects">
              {projects.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">No projects yet. Click + and pick a folder on this machine.</p>
              ) : (
                projectOrder.order.map((id) => <ProjectNode key={id} project={projectsById.get(id)!} reorder={projectOrder} />)
              )}
            </nav>
          </div>}

          <HcStatus />
          <ResizeHandle
            side="left"
            label="Resize sidebar"
            value={width}
            min={LEFT.min}
            max={leftMax}
            onChange={(px) => ui().setSidebarWidth(px)}
            onReset={() => ui().setSidebarWidth(LEFT.def)}
          />
        </aside>
      ) : null}
      {creatingFor ? <CreateWorkspaceDialog project={creatingFor} open onOpenChange={(o) => !o && ui().setNewWorkspaceFor(null)} /> : null}
      <AddProjectDialog open={addOpen} onOpenChange={(o) => ui().setAddProjectOpen(o)} />
    </>
  );
}

function FocusProjectSwitcher({ project, projects }: { project: Project; projects: Project[] }) {
  const { data: workspaces } = usePaletteWorkspaces();

  function selectProject(id: string) {
    const ui = useUiStore.getState();
    const available = workspaces?.filter((ws) => ws.project_id === id && ws.deleted_at == null
      && (ws.archived_at == null || ui.reopenedWorkspaceIds.includes(ws.id))) ?? [];
    const recent = ui.recentWorkspaceIds.find((workspaceId) => available.some((ws) => ws.id === workspaceId));
    ui.selectWorkspace(id, recent ?? available[0]?.id ?? null);
  }

  useEffect(() => {
    if (!workspaces || projects.some(({ id }) => id === useUiStore.getState().projectId)) return;
    selectProject(project.id);
  }, [project.id, projects, workspaces]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label={`Switch project: ${project.name}`} className="min-w-0 flex-1 justify-between">
          <TruncatedText className="truncate">{project.name}</TruncatedText>
          <ChevronsUpDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {projects.map(({ id, name }) => (
          <DropdownMenuItem key={id} onSelect={() => { if (id !== project.id) selectProject(id); }}>
            <span className="flex-1">{name}</span>
            {id === project.id && <Check aria-label="Current project" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => useUiStore.getState().setAddProjectOpen(true)}><Plus /> New project</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectNode({ project, reorder, switcher }: {
  project: Project;
  reorder: ReturnType<typeof useNavigationOrder>;
  switcher?: ReactNode;
}) {
  const collapsed = useUiStore((s) => !!s.collapsed[project.id]);
  const toggle = useUiStore((s) => s.toggleCollapsed);
  const selectedProject = useUiStore((s) => s.projectId === project.id);
  const selectedWs = useUiStore((s) => s.workspaceId);
  const statuses = useUiStore((s) => s.statuses);
  const reopenedWorkspaceIds = useUiStore((s) => s.reopenedWorkspaceIds);
  const { data: projectWorkspaces = [], isSuccess: workspacesLoaded } = useWorkspaces(project.id, true);
  const workspaces = projectWorkspaces.filter((w) => w.deleted_at == null && (w.archived_at == null || reopenedWorkspaceIds.includes(w.id)));
  const workspaceOrder = useNavigationOrder(`workspaces:${project.id}`, workspaces.map((w) => w.id), 'vertical', workspacesLoaded);
  const workspacesById = new Map(workspaces.map((w) => [w.id, w]));
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const qc = useQueryClient();

  return (
    <div className="flex flex-col">
      <div {...(switcher ? {} : reorder.row(project.id))} className={cn('group flex items-center gap-0.5 rounded-md hover:bg-accent',
        selectedProject && 'bg-accent', reorder.indicator)}>
        {switcher ?? <button
          {...reorder.item(project.id)}
          type="button"
          className="flex h-9 min-w-0 flex-1 touch-none select-none items-center gap-2 rounded-md px-2 text-left"
          aria-current={selectedProject ? 'true' : undefined}
          onClick={() => {
            if (!selectedProject) {
              useUiStore.getState().selectWorkspace(project.id, null);
              if (collapsed) toggle(project.id);
            } else {
              toggle(project.id);
            }
          }}
          aria-expanded={!collapsed}
        >
          <ChevronRight className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform duration-150', !collapsed && 'rotate-90')} />
          <TruncatedText className="min-w-0 flex-1 truncate text-[13px] font-medium">{project.name}</TruncatedText>
          {project.missing ? (
            <Tooltip content="The project folder no longer exists">
              <AlertTriangle className="size-3.5 shrink-0 text-st-blocked" />
            </Tooltip>
          ) : null}
        </button>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="muted" size="icon-sm" className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100" aria-label="Project options">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled className="font-mono text-[11px]">
              {project.path}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setRenaming(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem destructive onSelect={() => setDeleting(true)}>
              Remove from Herdsman
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip content={`New workspace in ${project.name}`}>
          <Button
            variant="muted"
            size="icon-sm"
            className="shrink-0"
            onClick={() => useUiStore.getState().setNewWorkspaceFor(project.id)}
            aria-label={`New workspace in ${project.name}`}
            disabled={project.missing}
          >
            <Plus />
          </Button>
        </Tooltip>
      </div>
      {switcher || !collapsed ? (
        <ul className="mb-1.5 ml-[15px] mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2">
          {workspaces.length === 0 ? <li className="px-2 py-1.5 text-xs text-muted-foreground">No workspaces yet</li> : null}
          {workspaceOrder.order.map((id) => {
            const w = workspacesById.get(id)!;
            const mine = w.archived_at == null ? Object.values(statuses).filter((s) => s.workspace_id === w.id) : [];
            const needs = mine.some((s) => s.state === 'blocked' || s.state === 'error');
            const running = mine.some((s) => s.state === 'working');
            const on = selectedWs === w.id;
            const isWt = w.dir_kind === 'worktree';
            return (
              <li key={w.id} {...workspaceOrder.row(w.id)} className={cn(workspaceOrder.indicator, 'group flex min-h-8 items-center gap-1 rounded-md hover:bg-accent has-[[data-state=open]]:bg-accent', on && 'bg-accent')}>
                <button
                  {...workspaceOrder.item(w.id)}
                  type="button"
                  aria-current={on ? 'page' : undefined}
                  title={isWt ? `Worktree · ${w.branch ?? w.work_dir}` : 'Project folder'}
                  className="flex min-w-0 flex-1 items-center gap-2 self-stretch touch-none select-none rounded-md pl-2 text-left"
                  onClick={() => useUiStore.getState().selectWorkspace(project.id, w.id)}
                >
                  {running ? (
                    <Spinner className="size-3.5" label="Agent running" />
                  ) : isWt ? (
                    <GitBranch className="size-3.5 shrink-0 text-muted-foreground" aria-label="Worktree" />
                  ) : (
                    <Square className="size-3.5 shrink-0 text-muted-foreground" aria-label="Project folder" />
                  )}
                  <TruncatedText className={cn('min-w-0 flex-1 truncate text-[12px]', on && 'font-medium')}>{w.name ?? 'New workspace'}</TruncatedText>
                  {needs ? <span className="size-1.5 shrink-0 rounded-full bg-st-blocked" role="img" aria-label="Session awaiting approval" /> : null}
                </button>
                <WorkspaceMenu ws={w} variant="sidebar" />
              </li>
            );
          })}
        </ul>
      ) : null}
      <RenameDialog
        open={renaming}
        onOpenChange={setRenaming}
        title="Rename project"
        initial={project.name}
        onSave={async (name) => {
          await api.projectRename(project.id, name);
          qc.invalidateQueries({ queryKey: qk.projects });
        }}
      />
      <DeleteProjectDialog project={project} open={deleting} onOpenChange={setDeleting} />
    </div>
  );
}

function HcStatus() {
  const settingsKey = effectiveShortcut('settings', useShortcutBindings());
  const { data } = useAppInfo();
  const statuses = useUiStore((s) => s.statuses);
  const ok = data?.hc_connected;
  const running = Object.values(statuses).filter((s) => s.state === 'working' || s.state === 'blocked').length;
  const label = ok
    ? running
      ? `${running} ${running === 1 ? 'session' : 'sessions'} running`
      : 'hc connected'
    : data?.hc_path
      ? 'hc not connected'
      : 'hc not installed';
  return (
    <div className="flex flex-col gap-0.5 border-t border-border pt-2">
      <div className="flex h-8 items-center gap-2 px-2 text-xs text-muted-foreground">
        <span className={cn('size-1.5 shrink-0 rounded-full', ok ? 'bg-st-done' : 'bg-st-error')} aria-hidden="true" />
        <TruncatedText className="flex-1 truncate">{label}</TruncatedText>
        {data && !data.node_path ? (
          <Tooltip content="Node.js not found — agents cannot run">
            <AlertTriangle className="size-3.5 text-st-blocked" aria-label="Node.js not found" />
          </Tooltip>
        ) : null}
        <Tooltip content={<span className="inline-flex items-center gap-2">Settings <Kbd>{shortcutLabel(settingsKey)}</Kbd></span>}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="-mr-1.5 text-muted-foreground"
            aria-label="Settings"
            aria-keyshortcuts={shortcutLabel(settingsKey, true)}
            onClick={() => useUiStore.getState().setSettingsOpen(true)}>
            <Settings />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
