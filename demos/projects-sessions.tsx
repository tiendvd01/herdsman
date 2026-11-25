import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, useQueries, useQuery } from '@tanstack/react-query';
import { ChevronRight, CircleDot, FileText, FolderGit2, Folders, GitPullRequest, Layers, PanelLeft, PanelRight, Search, Settings, ShieldCheck, Terminal, X } from 'lucide-react';
import '@/styles/globals.css';
import './projects-sessions.css';
import lightLogo from '@/assets/herdsman_lightmode.png';
import darkLogo from '@/assets/herdsman_darkmode.png';
import { SessionView } from '@/components/conversation/SessionView';
import { ResizeHandle } from '@/components/layout/ResizeHandle';
import { RightPanel } from '@/components/panels/RightPanel';
import { ProjectSkillsSection } from '@/components/settings/ProjectSkillsSection';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription } from '@/components/ui/empty';
import { EngineIcon } from '@/components/ui/engine-icon';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusDot } from '@/components/ui/status-dot';
import { Toaster } from '@/components/ui/toast';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { installDevMock } from '@/lib/devMock';
import { useBackendEvents } from '@/lib/events';
import { LEFT } from '@/lib/layout';
import { qk, useProjects, useWorkspaces } from '@/lib/queries';
import { bootTheme, useAppearanceEffect, useThemeColors } from '@/lib/theme';
import { useLayoutWidths, useViewportWidth } from '@/lib/useLayoutWidths';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/useUiStore';

const projectTabsKey = 'herdsman-preview-project-tabs';

const toolItems = [
  { id: 'pull-requests', label: 'Pull requests', Icon: GitPullRequest },
  { id: 'issues', label: 'Issues', Icon: CircleDot },
  { id: 'rules', label: 'Rules', Icon: ShieldCheck },
  { id: 'instructions', label: 'Instructions', Icon: FileText },
  { id: 'skills', label: 'Skills', Icon: Layers },
] as const;

type ProjectTool = (typeof toolItems)[number]['id'];
type ToolId = 'sessions' | ProjectTool;
type ExampleTool = Exclude<ProjectTool, 'skills'>;

const examples = {
  'pull-requests': [
    { id: '#42', title: 'Add project shortcuts to the sidebar', status: 'In review', detail: 'Expose project actions from the activity bar while keeping the current session available.' },
    { id: '#41', title: 'Restore the last session when switching projects', status: 'Open', detail: 'Remember the last active session independently for each project tab.' },
  ],
  issues: [
    { id: '#38', title: 'Improve keyboard navigation in project tools', status: 'Open', detail: 'Verify focus order and accessible names when switching between tools.' },
    { id: '#32', title: 'Show a clear empty state for session search', status: 'Done', detail: 'Show feedback when a search returns zero sessions.' },
  ],
  rules: [
    { id: '.claude/rules/frontend.md', title: 'Frontend', status: 'Project', detail: 'Reuse the existing UI components and semantic theme tokens.' },
    { id: '.claude/rules/testing.md', title: 'Testing', status: 'Project', detail: 'Run focused checks for changed behavior before submitting a pull request.' },
  ],
  instructions: [
    { id: 'AGENTS.md', title: 'Agent instructions', status: 'Codex', detail: 'Follow the existing project structure and keep changes scoped to the task.' },
    { id: 'CLAUDE.md', title: 'Claude project instructions', status: 'Claude', detail: 'Use the project’s package runner and preserve shared UI conventions.' },
  ],
} satisfies Record<ExampleTool, { id: string; title: string; status: string; detail: string }[]>;

function ToolView({ tool, projects }: { tool: ProjectTool; projects: NonNullable<ReturnType<typeof useProjects>['data']> }) {
  const [selectedId, setSelectedId] = useState('');
  const project = projects.find(({ id }) => id === selectedId) ?? projects[0];
  const { label, Icon } = toolItems.find(({ id }) => id === tool)!;
  const rows = tool !== 'skills' && project?.name === 'herdsman' ? examples[tool] : [];
  return (
    <section aria-labelledby="tool-title" className="demo-tool-view min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-8 sm:px-10 sm:py-12">
        <header className="flex flex-col items-start gap-4">
          <span className="demo-tool-icon grid size-12 shrink-0 place-items-center rounded-2xl border">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <div className="flex w-full flex-wrap items-end justify-between gap-3">
            <h1 id="tool-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">{label}</h1>
            {rows.length > 0 && <Badge variant="outline">Sample data</Badge>}
          </div>
        </header>
        {tool !== 'skills' && project && (
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="demo-tool-project" className="text-sm font-medium">Project</label>
            <Select value={project.id} onValueChange={setSelectedId}>
              <SelectTrigger id="demo-tool-project" className="min-w-40 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                {projects.map(({ id, name }) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {tool === 'skills' ? (
          <div className="rounded-2xl border border-border bg-background px-4 sm:px-6"><ProjectSkillsSection /></div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background">
            <Empty><EmptyDescription>{project ? `No sample ${label.toLowerCase()} for this project.` : 'No projects available.'}</EmptyDescription></Empty>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map(({ id, title, status, detail }) => (
              <li key={id} className="demo-tool-card rounded-2xl border border-border bg-background">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-4 sm:gap-4 sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span className="demo-tool-icon hidden size-9 shrink-0 place-items-center rounded-xl border sm:grid">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-sm font-semibold">{title}</span>
                      <span className="break-all font-mono text-xs text-muted-foreground">{id}</span>
                    </span>
                    <Badge variant="muted" className="demo-tool-status max-sm:hidden" data-status={status}>{status}</Badge>
                    <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="flex flex-col items-start gap-2 border-t border-border px-4 py-4 sm:px-5">
                    <Badge variant="muted" className="demo-tool-status sm:hidden" data-status={status}>{status}</Badge>
                    <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Preview() {
  useAppearanceEffect();
  useBackendEvents();
  const { data: projects = [], isPending: projectsLoading } = useProjects();
  const [projectTabs, setProjectTabs] = useState(() =>
    (localStorage.getItem(projectTabsKey) ?? 'p1,p1').split(','),
  );
  const [projectId, ...openIds] = projectTabs;
  const [tool, setTool] = useState<ToolId>('pull-requests');
  const [showProjects, setShowProjects] = useState(true);
  const [lastSession, setLastSession] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const rightOpen = useUiStore((s) => s.rightOpen);
  const statuses = useUiStore((s) => s.statuses);
  const { left: width, leftMax } = useLayoutWidths();
  const compact = useViewportWidth() < 768;
  const savedWidth = useUiStore((s) => s.sidebarWidth);
  const appearance = useThemeColors().appearance;
  const currentTool = toolItems.find(({ id }) => id === tool);
  const [compactSidebar, setCompactSidebar] = useState(false);
  const projectsById = new Map(projects.map((item) => [item.id, item]));
  const openProjects = openIds.flatMap((id) => {
    const item = projectsById.get(id);
    return item ? [item] : [];
  });
  const project = projectsById.get(projectId) ?? openProjects[0];
  const projectsVisible = showProjects || (tool === 'sessions' && !project);
  const sidebarVisible = !projectsVisible && tool === 'sessions' && (compact ? compactSidebar : sidebarOpen && width > 0);
  const { data: workspaces = [], isSuccess: workspacesLoaded } = useWorkspaces(project?.id ?? null, true);
  const histories = useQueries({
    queries: workspaces.map((ws) => ({
      queryKey: qk.sessions(ws.id),
      queryFn: () => api.sessionHistory(ws.id),
    })),
  });
  const cliHistory = useQuery({
    queryKey: ['preview-claude-cli', project?.id],
    queryFn: () => api.claudeSearch('', { projectId: project?.id }),
    enabled: !!project,
  });
  // The browser mock links its Claude CLI history hit to an existing app session.
  // Match the two records so the conversation appears once in the flat list.
  const rows = workspaces.flatMap((ws, index) =>
    (histories[index].data ?? []).map((session) => ({
      ws,
      session,
      cli: (cliHistory.data ?? []).some((hit) => hit.session_id === session.id),
    })),
  ).sort((a, b) => b.session.updated_at - a.session.updated_at);
  const active = rows.find(({ session }) => session.id === lastSession[project?.id ?? '']) ?? rows[0];
  const activeWorkspaceId = active?.ws.id ?? null;
  const activeSessionId = active?.session.id ?? null;
  const loading = !!project && (!workspacesLoaded || histories.some((history) => history.isPending));
  const query = filter.trim().toLowerCase();
  const visible = rows.filter(({ session, cli }) =>
    [session.title, cli ? 'Claude CLI' : session.engine].some((value) => value?.toLowerCase().includes(query)),
  );

  function switchProject(id: string) {
    setProjectTabs(([, ...ids]) => [id, ...(ids.includes(id) ? ids : [...ids, id])]);
    setShowProjects(false);
    setTool('sessions');
    setCompactSidebar(false);
    setFilter('');
    useUiStore.getState().setSidebarOpen(true);
  }

  function closeProject(id: string) {
    const index = openIds.indexOf(id);
    const remaining = openIds.filter((item) => item !== id);
    const next = id === project?.id ? remaining[index] ?? remaining[index - 1] ?? '' : projectId;
    setProjectTabs([next, ...remaining]);
    if (id === project?.id) setFilter('');
  }

  useEffect(() => {
    localStorage.setItem(projectTabsKey, projectTabs.join(','));
  }, [projectTabs]);

  useEffect(() => {
    const ui = useUiStore.getState();
    if (!project) {
      useUiStore.setState({ projectId: null, workspaceId: null });
      return;
    }
    ui.selectWorkspace(project.id, activeWorkspaceId);
    if (activeWorkspaceId && activeSessionId) ui.selectSession(activeWorkspaceId, activeSessionId);
  }, [project?.id, activeWorkspaceId, activeSessionId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (compact && event.key === 'Escape') setCompactSidebar(false);
      const index = Number(event.code.replace('Digit', '')) - 1;
      if (event.altKey && openProjects[index]) {
        event.preventDefault();
        switchProject(openProjects[index].id);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        useUiStore.getState().setSidebarOpen(true);
        setShowProjects(false);
        setTool('sessions');
        setCompactSidebar(true);
        requestAnimationFrame(() => search.current?.focus());
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openProjects, compact]);

  return (
    <div className="demo-shell flex h-full flex-col bg-background text-foreground" data-appearance={appearance}>
      <header className="demo-topbar flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <img src={appearance === 'dark' ? darkLogo : lightLogo} alt="" className="size-8 rounded-lg" />
          <span className="text-[15px] font-semibold tracking-tight">Herdsman</span>
        </div>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <StatusDot status="done" /> Demo workspace
        </span>
      </header>
      {openProjects.length > 0 && (
        <nav aria-label="Open projects" className="demo-project-tabs flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border px-2 py-1.5 sm:px-3">
          {openProjects.map((item, index) => (
            <div key={item.id} className="demo-project-tab flex shrink-0 items-center rounded-lg border border-transparent"
              data-active={!projectsVisible && tool === 'sessions' && item.id === project?.id}>
              <Button variant="ghost" size="sm" aria-current={(!projectsVisible && tool === 'sessions' && item.id === project?.id) || undefined}
                aria-keyshortcuts={index < 9 ? `Alt+${index + 1}` : undefined}
                onClick={() => switchProject(item.id)} className="gap-2">
                <span aria-hidden="true" className="demo-tool-icon grid size-5 place-items-center rounded-md border text-[9px] font-semibold uppercase">
                  {item.name.slice(0, 2)}
                </span>
                {item.name}
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label={`Close ${item.name} tab`}
                onClick={() => closeProject(item.id)} className="mr-1"><X /></Button>
            </div>
          ))}
        </nav>
      )}
      <div className="relative flex min-h-0 min-w-0 flex-1">
        <aside aria-label="Activity bar" className="demo-rail flex w-14 shrink-0 flex-col items-center gap-3 overflow-y-auto border-r border-border px-1 py-3 md:w-16">
          <Tooltip content="Projects">
            <Button variant={projectsVisible ? 'muted' : 'ghost'} size="icon"
              className="demo-rail-button" aria-label="Projects" aria-current={projectsVisible ? 'page' : undefined}
              onClick={() => {
                setShowProjects(!projectsVisible);
                setCompactSidebar(false);
              }}><Folders /></Button>
          </Tooltip>
          <nav aria-label="Project tools" className="flex w-full shrink-0 flex-col items-center gap-1.5 border-t border-current/15 pt-3">
            {toolItems.map(({ id, label, Icon }) => (
              <Tooltip key={id} content={label}>
                <Button variant={!projectsVisible && tool === id ? 'muted' : 'ghost'} size="icon"
                  className="demo-rail-button" aria-label={label} aria-current={!projectsVisible && tool === id ? 'page' : undefined}
                  onClick={() => {
                    setTool(id);
                    setShowProjects(false);
                    setCompactSidebar(false);
                  }}>
                  <Icon aria-hidden="true" />
                </Button>
              </Tooltip>
            ))}
          </nav>
          <Tooltip content="Settings">
            <Button variant="ghost" size="icon" className="demo-rail-button mt-auto" aria-label="Settings" onClick={() => useUiStore.getState().setSettingsOpen(true)}><Settings /></Button>
          </Tooltip>
        </aside>
        {sidebarVisible && project && (
          <aside aria-label="Sidebar" style={{ width: compact ? savedWidth : width }}
            className="demo-sidebar relative flex h-full shrink-0 flex-col gap-3 border-r border-border px-3 py-3">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-2">
              <span className="demo-tool-icon grid size-8 shrink-0 place-items-center rounded-lg border">
                <FolderGit2 className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold">{project.name}</h2>
                <p className="truncate text-xs text-muted-foreground" title={project.path}>{project.path}</p>
              </div>

            </div>
            <section aria-labelledby="sessions-label" className="flex min-h-0 flex-1 flex-col gap-3 pt-2">
              <div className="flex items-center justify-between gap-2">
                <h2 id="sessions-label" className="text-sm font-semibold">Sessions</h2>
                <Badge variant="outline">{rows.length}</Badge>
              </div>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input ref={search} type="search" aria-label="Search sessions" placeholder="Search sessions…" value={filter}
                  className="bg-background pl-8" onChange={(event) => setFilter(event.target.value)} />
              </div>
              <nav aria-label="Sessions" className="-mx-1 flex min-h-0 flex-col gap-1 overflow-y-auto px-1">
                {visible.map(({ session, ws, cli }) => (
                  <button key={session.id} type="button" aria-current={(activeSessionId === session.id && tool === 'sessions') || undefined}
                    onClick={() => {
                      setLastSession((previous) => ({ ...previous, [project.id]: session.id }));
                      setTool('sessions');
                      setCompactSidebar(false);
                    }}
                    className={cn('demo-session-row flex min-w-0 items-start gap-2 rounded-xl border border-transparent px-2 py-2.5 text-left',
                      activeSessionId === session.id && tool === 'sessions' && 'demo-session-selected')}>
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-background"><EngineIcon engine={session.engine} /></span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-sm font-medium">{session.title ?? 'Untitled session'}</span>
                      <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        {cli && <Badge variant="muted"><Terminal aria-hidden="true" /> Claude CLI</Badge>}
                        {ws.branch && <span className="truncate" title={ws.branch}>{ws.branch}</span>}
                      </span>
                    </span>
                    <StatusDot status={statuses[session.id]?.state ?? session.status} className="mt-1.5" />
                  </button>
                ))}
                {!visible.length && <Empty><EmptyDescription>{loading ? 'Loading sessions…' : query ? 'No matching sessions.' : 'No sessions in this project.'}</EmptyDescription></Empty>}
              </nav>
            </section>

            <div className="flex items-center gap-2 border-t border-border px-2 pt-2 text-xs text-muted-foreground">
              <StatusDot status="done" />
              <span className="flex-1">hc connected</span>
            </div>
            {!compact && <ResizeHandle side="left" label="Resize sidebar" value={width} min={LEFT.min} max={leftMax}
              onChange={(px) => useUiStore.getState().setSidebarWidth(px)}
              onReset={() => useUiStore.getState().setSidebarWidth(LEFT.def)} />}
          </aside>
        )}

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!projectsVisible && <header className="flex min-h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:px-4">
            {tool === 'sessions' && <Button variant="ghost" size="icon-sm" aria-label="Toggle sidebar" aria-expanded={sidebarVisible}
              onClick={() => {
                if (compact) {
                  setCompactSidebar(!compactSidebar);
                  useUiStore.getState().setSidebarOpen(true);
                } else {
                  useUiStore.getState().setSidebarOpen(!sidebarOpen);
                }
              }}><PanelLeft /></Button>}
            <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] text-muted-foreground">
              {tool === 'sessions' && project && <>
                <span className="truncate">{project.name}</span>
                <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
              </>}
              <span aria-current="page" className="min-w-0 truncate font-medium text-foreground">
                {tool === 'sessions' && active ? active.session.title ?? 'Untitled session' : currentTool?.label ?? 'Sessions'}
              </span>
            </nav>
            {tool === 'sessions' && <Button variant="ghost" size="icon" className="max-lg:hidden" aria-label={rightOpen ? 'Hide side panel' : 'Show side panel'}
              onClick={() => useUiStore.getState().setRightOpen(!rightOpen)}><PanelRight /></Button>}
          </header>}
          {projectsVisible ? (
            <section aria-labelledby="projects-title" className="demo-tool-view flex min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto my-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-8 sm:px-8">
                <header className="flex items-center gap-3">
                  <span className="demo-tool-icon grid size-11 shrink-0 place-items-center rounded-xl border">
                    <Folders aria-hidden="true" className="size-5" />
                  </span>
                  <h1 id="projects-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">Projects</h1>
                </header>
                {projects.length > 0 ? (
                  <ul className="flex flex-col gap-2.5">
                    {projects.map((item) => (
                      <li key={item.id}>
                        <button type="button" onClick={() => switchProject(item.id)}
                          className="demo-tool-card flex w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-4 text-left sm:px-4">
                          <span className="demo-tool-icon grid size-8 shrink-0 place-items-center rounded-lg border sm:size-9">
                            <FolderGit2 aria-hidden="true" className="size-4" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="text-sm font-semibold">{item.name}</span>
                            <span title={item.path} className="truncate text-xs text-muted-foreground">{item.path}</span>
                          </span>
                          {openIds.includes(item.id) && <Badge variant="outline">Open</Badge>}
                          <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : <Empty><EmptyDescription>{projectsLoading ? 'Loading projects…' : 'No projects available.'}</EmptyDescription></Empty>}
              </div>
            </section>
          ) : tool !== 'sessions' ? (
            <ToolView key={tool} tool={tool} projects={projects} />
          ) : active ? (
            <div className="demo-conversation m-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background sm:m-3">
              <SessionView key={active.session.id} session={active.session} ws={active.ws} />
            </div>
          ) : (
            <div className="m-auto text-sm text-muted-foreground">{loading ? 'Loading sessions…' : project ? 'No session selected' : 'Open a project to see its sessions.'}</div>
          )}
        </main>
        {!projectsVisible && tool === 'sessions' && <div className="hidden lg:contents"><RightPanel /></div>}
      </div>
      <SettingsDialog />
      <Toaster />
    </div>
  );
}

if (import.meta.env.DEV) {
  installDevMock();
  bootTheme();
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 2000, retry: false } } });
  const root = createRoot(document.getElementById('root')!);
  import.meta.hot?.dispose(() => root.unmount());
  root.render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <Preview />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}
