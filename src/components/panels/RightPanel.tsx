import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Empty as EmptyState, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty';
import { FileTree } from '@/components/files/FileTree';
import { TruncatedText } from '@/components/ui/truncated-text';
import { Tooltip } from '@/components/ui/tooltip';
import { HistoryPanel } from '@/components/history/HistoryPanel';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Bot, ChevronDown, ChevronRight, FolderTree, GitBranch, History, Maximize2, Minimize2, RefreshCw, ScrollText } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import { qk, useProjects, useSessions } from '@/lib/queries';
import type { AgentNode, ChangedFile, SessionStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUiStore, type RightTab } from '@/stores/useUiStore';
import { RIGHT } from '@/lib/layout';
import { useLayoutWidths } from '@/lib/useLayoutWidths';
import { ResizeHandle } from '@/components/layout/ResizeHandle';
import { Button } from '@/components/ui/button';
import { StatusDot, STATUS_LABEL } from '@/components/ui/status-dot';
import { filePanelHeader, fileRow, gitStatusMarker, gitStatusPresentation, selectedFileRow } from '@/components/files/fileRows';
import { materialFileIcon } from '@/components/files/materialFileIcons';
import { useFileStore } from '@/stores/useFileStore';

const TABS: { id: RightTab; label: string; Icon: typeof Bot }[] = [
  { id: 'project-files', label: 'Files', Icon: FolderTree },
  { id: 'agents', label: 'Agents', Icon: Bot },
  { id: 'files', label: 'Git', Icon: GitBranch },
  { id: 'history', label: 'History', Icon: History },
  { id: 'log', label: 'Log', Icon: ScrollText },
];

import { GitHistoryRows } from './GitHistoryRows';

export function RightPanel() {
  const [graphRatio, setGraphRatio] = useState(0.5);
  const tab = useUiStore((s) => s.rightTab);
  const open = useUiStore((s) => s.rightOpen);
  const rightWidth = useUiStore((s) => s.rightWidth);
  const wide = rightWidth > RIGHT.def;
  const { right: width, rightMax } = useLayoutWidths();
  const projectId = useUiStore((s) => s.projectId);
  const workspaceId = useUiStore((s) => s.workspaceId);
  const { data: projects = [] } = useProjects();
  const project = projects.find((item) => item.id === projectId);
  const sessionId = useUiStore((s) => (s.workspaceId ? s.sessionByWorkspace[s.workspaceId] : undefined));
  if (!open || width === 0) return null;
  return (
    <aside style={{ width }} className="relative flex h-full shrink-0 flex-col bg-background after:pointer-events-none after:absolute after:top-11 after:bottom-0 after:left-0 after:border-l after:border-border" aria-label="Side panel">
      <ResizeHandle
        side="right"
        label="Resize side panel"
        value={width}
        min={RIGHT.min}
        max={rightMax}
        onChange={(px) => useUiStore.getState().setRightWidth(px)}
        onReset={() => useUiStore.getState().setRightWidth(RIGHT.def)}
      />
      <div data-tauri-drag-region className="h-11 shrink-0 border-b border-border bg-surface" />
      <Tabs value={tab} onValueChange={(value) => useUiStore.getState().setRightTab(value as RightTab)}
        activationMode="manual" className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3">
          <TabsList aria-label="Side panel content" className="h-auto gap-1">
            {TABS.map(({ id, label, Icon }) => (
              <Tooltip key={id} content={label}>
                <TabsTrigger
                  value={id}
                  aria-label={label}
                  className="size-8 shrink-0 justify-center border-0 p-0 hover:bg-accent aria-selected:bg-muted aria-selected:hover:bg-accent"
                >
                  <Icon aria-hidden="true" />
                </TabsTrigger>
              </Tooltip>
            ))}
          </TabsList>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => useUiStore.getState().setRightWidth(wide ? RIGHT.def : RIGHT.wide)}
            aria-label={wide ? 'Narrow side panel' : 'Widen side panel'}
            title={wide ? 'Narrow side panel' : 'Widen side panel'}
          >
            {wide ? <Minimize2 className="size-[15px]" /> : <Maximize2 className="size-[15px]" />}
          </Button>
        </div>
        <TabsContent value="agents" className="min-h-0 flex-1 overflow-y-auto">{tab === 'agents' && <AgentsPanel sessionId={sessionId} />}</TabsContent>
        <TabsContent value="files" className="flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">{tab === 'files' && <GitPanel projectId={projectId} workspaceId={workspaceId} graphRatio={graphRatio} setGraphRatio={setGraphRatio} />}</TabsContent>
        <TabsContent value="project-files" className="flex min-h-0 flex-1 flex-col overflow-y-auto data-[state=inactive]:hidden">
          {tab === 'project-files' && (
            <section aria-label="Files" className="flex min-h-0 flex-1 flex-col">
              {project ? (
                <>
                  <div className={filePanelHeader}>
                    <FolderTree className="size-4 shrink-0 text-muted-foreground" />
                    <h2 className="min-w-0 text-xs font-medium">
                      <TruncatedText className="block truncate">{project.name}</TruncatedText>
                    </h2>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col px-2 py-2">
                    <FileTree key={project.id} project={project} />
                  </div>
                </>
              ) : (
                <EmptyState className="m-3">
                  <EmptyHeader>
                    <EmptyMedia><FolderTree /></EmptyMedia>
                    <EmptyDescription>Select a project to browse files.</EmptyDescription>
                  </EmptyHeader>
                </EmptyState>
              )}
            </section>
          )}
        </TabsContent>
        <TabsContent value="history" forceMount className="flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
          <HistoryPanel workspaceId={workspaceId} selectedSessionId={sessionId} active={tab === 'history'} />
        </TabsContent>
        <TabsContent value="log" className="flex min-h-0 flex-1 flex-col overflow-y-auto data-[state=inactive]:hidden">{tab === 'log' && <LogPanel workspaceId={workspaceId} sessionId={sessionId} />}</TabsContent>
      </Tabs>
    </aside>
  );
}

function SectionHead({ title, desc, children }: { title: string; desc: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{desc}</span>
      </div>
      {children}
    </div>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <EmptyState><EmptyHeader><EmptyDescription>{children}</EmptyDescription></EmptyHeader></EmptyState>
);

function Loading() {
  return <div role="status" className="flex items-center gap-2 p-3 text-xs text-muted-foreground"><Spinner />Loading…</div>;
}

function LoadError({ error }: { error: unknown }) {
  return <Alert variant="destructive"><AlertDescription>{errMsg(error)}</AlertDescription></Alert>;
}

// ── Agents (FR-025) ──
function AgentsPanel({ sessionId }: { sessionId?: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: qk.agentTree(sessionId ?? ''),
    queryFn: () => api.agentTree(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 5000,
  });
  const workspaceId = useUiStore((s) => s.workspaceId);
  const { data: sessions = [] } = useSessions(workspaceId);
  const title = sessions.find((s) => s.id === sessionId)?.title ?? 'This session';
  return (
    <section aria-label="Agents" className="flex flex-col gap-3 p-4">
      <SectionHead title="Agents" desc="Main session and the sub-agents it delegates to" />
      {!sessionId ? (
        <Empty>Pick a session to see its agent tree.</Empty>
      ) : isLoading ? (
        <Loading />
      ) : error && data === undefined ? (
        <LoadError error={error} />
      ) : !data ? (
        <Empty>This session is not running in hc yet.</Empty>
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs">
            <StatusDot status={agentStatus(data)} />
            <TruncatedText className="min-w-0 flex-1 truncate font-medium">{title}</TruncatedText>
            <span className="font-mono text-xs text-muted-foreground">{data.terminal}</span>
          </div>
          {data.children.length ? (
            <div className="ml-0.5 flex flex-col gap-3 border-l border-border pl-3">
              {data.children.map((c) => (
                <AgentRow key={c.terminal} node={c} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No sub-agents yet. Agents delegated with <span className="font-mono">hc run --bg</span> show up here.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function agentStatus(n: AgentNode): SessionStatus {
  if (n.state !== 'live') return 'done';
  return (['working', 'blocked', 'error', 'done'].includes(n.status ?? '') ? n.status : 'idle') as SessionStatus;
}

function AgentRow({ node }: { node: AgentNode }) {
  const st = agentStatus(node);
  const pct = node.progress ?? (st === 'done' ? 100 : null);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-xs">
        <StatusDot status={st} />
        <TruncatedText className="min-w-0 flex-1 truncate font-mono">{node.title}</TruncatedText>
        <span className="shrink-0 text-xs text-muted-foreground">{node.progress != null && st !== 'done' ? `${node.progress}%` : STATUS_LABEL[st]}</span>
      </div>
      {pct != null ? (
        <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      ) : null}
      <span className="font-mono text-xs text-muted-foreground">{node.terminal}</span>
      {node.children.length ? (
        <div className="ml-0.5 mt-1 flex flex-col gap-3 border-l border-border pl-3">
          {node.children.map((c) => (
            <AgentRow key={c.terminal} node={c} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── Git ──
function navigateChangedFiles(event: KeyboardEvent<HTMLUListElement>) {
  const rows = Array.from(event.currentTarget.querySelectorAll('button')).filter((row) => !row.closest('[hidden]'));
  const index = rows.findIndex((row) => row === event.target);
  if (index < 0) return;
  let next: number;
  switch (event.key) {
    case 'ArrowDown': next = Math.min(index + 1, rows.length - 1); break;
    case 'ArrowUp': next = Math.max(index - 1, 0); break;
    case 'Home': next = 0; break;
    case 'End': next = rows.length - 1; break;
    default: return;
  }
  event.preventDefault();
  rows[next].focus();
}

interface ChangedDirectory {
  folders: Map<string, ChangedDirectory>;
  files: ChangedFile[];
}

function groupChangedFiles(files: ChangedFile[]) {
  const root: ChangedDirectory = { folders: new Map(), files: [] };
  for (const file of files) {
    const parts = file.path.split('/');
    parts.pop();
    let directory = root;
    for (const name of parts) {
      let child = directory.folders.get(name);
      if (!child) {
        child = { folders: new Map(), files: [] };
        directory.folders.set(name, child);
      }
      directory = child;
    }
    directory.files.push(file);
  }
  return root;
}

const changedFileRow = 'h-[30px] w-full px-2 focus-visible:border-ring focus-visible:ring-inset focus-visible:ring-offset-0';

function ChangedFolder({ name, directory, renderFile }: {
  name: string;
  directory: ChangedDirectory;
  renderFile: (file: ChangedFile) => JSX.Element;
}) {
  const [expanded, setExpanded] = useState(true);
  const Icon = expanded ? ChevronDown : ChevronRight;
  return (
    <li>
      <Button variant="ghost" size="xs" aria-expanded={expanded} title={name}
        className={cn(changedFileRow, fileRow)} onClick={() => setExpanded((value) => !value)}>
        <Icon data-icon="inline-start" />
        <TruncatedText className="min-w-0 flex-1 truncate text-left">{name}</TruncatedText>
      </Button>
      <ul hidden={!expanded} className="pl-4">
        <ChangedDirectoryRows directory={directory} renderFile={renderFile} />
      </ul>
    </li>
  );
}

function ChangedDirectoryRows({ directory, renderFile }: {
  directory: ChangedDirectory;
  renderFile: (file: ChangedFile) => JSX.Element;
}) {
  return (
    <>
      {Array.from(directory.folders, ([name, child]) => (
        <ChangedFolder key={'folder:' + name} name={name} directory={child} renderFile={renderFile} />
      ))}
      {directory.files.map(renderFile)}
    </>
  );
}

function GitPanel({ projectId, workspaceId, graphRatio, setGraphRatio }: {
  projectId: string | null;
  workspaceId: string | null;
  graphRatio: number;
  setGraphRatio: (ratio: number) => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const element = panel.current!;
    const measure = () => setHeight(element.clientHeight);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const min = Math.min(84, Math.floor(height / 2));
  const max = height - min;
  const graphHeight = Math.max(min, Math.min(max, Math.round(height * graphRatio)));

  return (
    <div ref={panel} className="flex min-h-0 flex-1 flex-col">
      <ChangesPanel projectId={projectId} workspaceId={workspaceId} />
      <div className="relative min-h-0 shrink-0 border-t border-border"
        style={{ height: height ? graphHeight : '50%' }}>
        <ResizeHandle side="right" orientation="horizontal" label="Resize Git Graph"
          value={graphHeight} min={min} max={max}
          onChange={(px) => { if (height) setGraphRatio(px / height); }}
          onReset={() => setGraphRatio(0.5)}
        />
        <GitHistoryPanel key={workspaceId} projectId={projectId} workspaceId={workspaceId} />
      </div>
    </div>
  );
}

function GitHistoryPanel({ projectId, workspaceId }: { projectId: string | null; workspaceId: string | null }) {
  const { data, isPending, error } = useQuery({
    queryKey: qk.gitHistory(workspaceId ?? ''),
    queryFn: () => api.gitHistory(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 5000,
  });
  return (
    <section aria-label="Git Graph" className="flex h-full min-h-0 flex-col">
      <div className={filePanelHeader}>
        <GitBranch className="size-4 shrink-0 text-muted-foreground" />
        <h2 className="text-xs font-medium">Git Graph</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
        {!workspaceId ? <Empty>Select a workspace to view Git history.</Empty>
          : isPending ? <Loading />
          : error ? <LoadError error={error} />
          : data === null ? <Empty>This workspace is not in a Git repository.</Empty>
          : !data?.commits.length ? <Empty>No commits yet.</Empty>
          : <>
            <GitHistoryRows commits={data.commits} projectId={projectId} workspaceId={workspaceId!} />
            {data.truncated && (
              <p className="px-2 py-2 text-xs text-muted-foreground">Showing the latest {data.commits.length} commits.</p>
            )}
          </>}
      </div>
    </section>
  );
}

function ChangesPanel({ projectId, workspaceId }: { projectId: string | null; workspaceId: string | null }) {
  const { data: files, refetch, isFetching, isPending, error } = useQuery({
    queryKey: qk.files(workspaceId ?? ''),
    queryFn: () => api.filesChanged(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 5000,
  });
  const qc = useQueryClient();
  const treeView = useUiStore((state) => state.gitTreeView);
  const toggleTreeView = useUiStore((state) => state.toggleGitTreeView);
  const activePath = useFileStore((state) => state.diffs.find((diff) =>
    !diff.commit && diff.workspaceId === workspaceId && diff.id === state.active[diff.projectId])?.path);

  function renderFile({ path, status }: ChangedFile) {
    const name = path.slice(path.lastIndexOf('/') + 1);
    const change = gitStatusPresentation(status);
    const selected = activePath === path;
    return (
      <li key={'file:' + path} className="h-[32px]">
        <Button variant="ghost" size="xs" title={path} aria-label={`Changes for ${path}, Git status ${status}: ${change.label}`}
          aria-current={selected || undefined}
          onClick={() => { if (projectId && workspaceId) useFileStore.getState().openDiff(projectId, workspaceId, path); }}
          className={cn(changedFileRow, fileRow, selected && selectedFileRow)}>
          <img src={materialFileIcon(name, false)} alt="" data-icon="inline-start" className="size-4 shrink-0" />
          <TruncatedText className={cn('min-w-0 flex-1 truncate text-left', change.className)}>{treeView ? name : path}</TruncatedText>
          <span aria-hidden="true" className={cn(gitStatusMarker, change.className)}>{change.marker}</span>
        </Button>
      </li>
    );
  }

  return (
    <section aria-label="Git changes" className="flex min-h-0 flex-1 flex-col">
      <div className={filePanelHeader}>
        <GitBranch className="size-4 shrink-0 text-muted-foreground" />
        <h2 className="min-w-0 flex-1 text-xs font-medium">Changes{files ? ` (${files.length})` : ''}</h2>
        <Button variant={treeView ? 'secondary' : 'ghost'} size="icon-sm" aria-label="Tree view"
          aria-pressed={treeView} title={treeView ? 'Show as list' : 'Show as tree'} onClick={toggleTreeView}>
          <FolderTree data-icon="inline-start" />
        </Button>
        {workspaceId ? (
          <Button variant="ghost" size="icon-sm" aria-label="Refresh Git changes" disabled={isFetching}
            onClick={() => {
              void refetch();
              void qc.invalidateQueries({ queryKey: qk.gitHistory(workspaceId) });
              void qc.invalidateQueries({ queryKey: ['diff', workspaceId] });
              if (projectId) void qc.invalidateQueries({ queryKey: qk.projectFilesChanged(projectId) });
            }}>
            <RefreshCw className={cn(isFetching && 'animate-spin')} />
          </Button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
        {!workspaceId ? <Empty>Select a workspace to view changes.</Empty>
          : isPending ? <Loading />
          : error ? <LoadError error={error} />
          : files?.length === 0 ? <Empty>No changes yet.</Empty> : null}
        {workspaceId && files && files.length > 0 ? (
          <ul aria-label="Changed files" hidden={Boolean(error)} onKeyDown={navigateChangedFiles}
            className="rounded-md">
            {treeView
              ? <ChangedDirectoryRows key={workspaceId} directory={groupChangedFiles(files)} renderFile={renderFile} />
              : files.map(renderFile)}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

// ── Log (FR-024): the agent's real terminal screen ──
function LogPanel({ workspaceId, sessionId }: { workspaceId: string | null; sessionId?: string }) {
  const { data: sessions, isLoading, error } = useSessions(workspaceId);
  const s = sessions?.find((x) => x.id === sessionId);
  return (
    <section aria-label="Log" className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <SectionHead title="Log" desc="Terminal in hc, for debugging only">
        {s?.hc_terminal ? (
          <code className="h-6 shrink-0 rounded-md border border-border px-2 font-mono text-xs leading-5">hc attach {s.hc_terminal}</code>
        ) : null}
      </SectionHead>
      {sessionId && sessions === undefined && isLoading ? <Loading /> : sessionId && sessions === undefined && error ? <LoadError error={error} /> : !s ? <Empty>Pick a session.</Empty> : !s.hc_terminal ? <Empty>This session has no terminal in hc yet.</Empty> : <TerminalView terminal={s.hc_terminal} fill />}
    </section>
  );
}

// Strip ANSI/OSC control codes from text read out of hc.
// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g;

function TerminalView({ terminal, height, fill }: { terminal: string; height?: number; fill?: boolean }) {
  const ref = useRef<HTMLPreElement>(null);
  const { data, error, isLoading } = useQuery({ queryKey: ['term', terminal], queryFn: () => api.terminalRead(terminal, 1500), refetchInterval: 1000 });
  useEffect(() => {
    const el = ref.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 60) el.scrollTop = el.scrollHeight;
  }, [data]);
  if (data === undefined && isLoading) return <Loading />;
  if (data === undefined && error) return <LoadError error={error} />;
  if (!data) return <Empty>No terminal output yet.</Empty>;
  return (
    <pre
      ref={ref}
      className={cn(
        'm-0 overflow-auto rounded-lg border border-border bg-term-bg px-3 py-3 font-mono text-content-code leading-[1.8] text-term-fg whitespace-pre-wrap',
        fill && 'min-h-[560px] flex-1',
      )}
      style={height ? { height } : undefined}
      data-testid="terminal-view"
    >
      {data.replace(ANSI, '')}
    </pre>
  );
}
