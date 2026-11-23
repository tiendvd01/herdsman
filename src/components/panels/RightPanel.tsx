import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Empty as EmptyState, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty';
import { FileTree } from '@/components/files/FileTree';
import { TruncatedText } from '@/components/ui/truncated-text';
// Right side panel: Agents, Background tasks, Files, Git, Log (BR 3.1).
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Bot, ChevronLeft, FolderTree, GitBranch, Maximize2, Minimize2, Play, RefreshCw, ScrollText, SquareTerminal } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import { qk, useProjects, useSessions } from '@/lib/queries';
import type { AgentNode, SessionStatus, TaskRef } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';
import { useUiStore, type RightTab } from '@/stores/useUiStore';
import { RIGHT } from '@/lib/layout';
import { useLayoutWidths } from '@/lib/useLayoutWidths';
import { ResizeHandle } from '@/components/layout/ResizeHandle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusDot, STATUS_LABEL } from '@/components/ui/status-dot';
import { toast } from '@/components/ui/toast';
import { Diff } from '@/components/conversation/Diff';
import type { DiffLine } from '@/components/conversation/lineDiff';

const TABS: { id: RightTab; label: string; Icon: typeof Bot }[] = [
  { id: 'project-files', label: 'Files', Icon: FolderTree },
  { id: 'agents', label: 'Agents', Icon: Bot },
  { id: 'tasks', label: 'Tasks', Icon: SquareTerminal },
  { id: 'files', label: 'Git', Icon: GitBranch },
  { id: 'log', label: 'Log', Icon: ScrollText },
];

export function RightPanel() {
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
    <aside style={{ width }} className="relative flex h-full shrink-0 flex-col border-l border-border bg-background" aria-label="Side panel">
      <ResizeHandle
        side="right"
        label="Resize side panel"
        value={width}
        min={RIGHT.min}
        max={rightMax}
        onChange={(px) => useUiStore.getState().setRightWidth(px)}
        onReset={() => useUiStore.getState().setRightWidth(RIGHT.def)}
      />
      <Tabs value={tab} onValueChange={(value) => useUiStore.getState().setRightTab(value as RightTab)}
        activationMode="manual" className="flex min-h-0 flex-1 flex-col">
        <div data-tauri-drag-region className="flex min-h-14 items-center justify-between gap-2 border-b border-border px-3 py-2">
          <TabsList aria-label="Side panel content">
            {TABS.map(({ id, label, Icon }) => (
              <TabsTrigger key={id} value={id} aria-label={label} title={label}>
                <Icon data-icon="inline-start" />{tab === id ? label : null}
              </TabsTrigger>
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
        <TabsContent value="tasks" className="min-h-0 flex-1 overflow-y-auto">{tab === 'tasks' && <TasksPanel projectId={projectId} />}</TabsContent>
        <TabsContent value="files" className="flex min-h-0 flex-1 flex-col overflow-y-auto data-[state=inactive]:hidden">{tab === 'files' && <GitPanel key={workspaceId} workspaceId={workspaceId} />}</TabsContent>
        <TabsContent value="project-files" className="flex min-h-0 flex-1 flex-col overflow-y-auto data-[state=inactive]:hidden">
          {tab === 'project-files' && (
            <section aria-label="Files" className="flex min-h-0 flex-1 flex-col">
              {project ? (
                <>
                  <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
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
        <TabsContent value="log" className="flex min-h-0 flex-1 flex-col overflow-y-auto data-[state=inactive]:hidden">{tab === 'log' && <LogPanel workspaceId={workspaceId} sessionId={sessionId} />}</TabsContent>
      </Tabs>
    </aside>
  );
}

function SectionHead({ title, desc, children }: { title: string; desc: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="text-[13px] font-semibold">{title}</h2>
        <span className="text-[12px] text-muted-foreground">{desc}</span>
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
          <div className="flex items-center gap-2 text-[12px]">
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
            <p className="text-[12px] text-muted-foreground">
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
      <div className="flex items-center gap-2 text-[12px]">
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

// ── Background tasks (FR-026) ──
function TasksPanel({ projectId }: { projectId: string | null }) {
  const qc = useQueryClient();
  const [cmd, setCmd] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [logOf, setLogOf] = useState<string | null>(null);
  const { data: tasks, isLoading, error } = useQuery({ queryKey: qk.tasks(projectId ?? ''), queryFn: () => api.taskList(projectId!), enabled: !!projectId, refetchInterval: 4000 });
  const refresh = () => {
    if (projectId) qc.invalidateQueries({ queryKey: qk.tasks(projectId) });
  };
  const act = (p: Promise<unknown>) => p.then(refresh).catch((e) => toast(errMsg(e), 'error'));
  return (
    <section aria-label="Background tasks" className="flex flex-col gap-3 p-4">
      <SectionHead title="Background tasks" desc="Commands running in the background in hc">
        {projectId ? (
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)} aria-expanded={showForm}>
            <Play className="size-3.5" /> Run command
          </Button>
        ) : null}
      </SectionHead>
      {!projectId ? <Empty>Pick a project.</Empty> : null}
      {projectId && showForm ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!cmd.trim()) return;
            act(api.taskRun(projectId, cmd.trim()).then((t) => setLogOf(t.terminal)));
            setCmd('');
            setShowForm(false);
          }}
        >
          <Input className="font-mono text-[12px]" placeholder="pnpm dev, cargo test…" value={cmd} onChange={(e) => setCmd(e.target.value)} aria-label="Background command" autoFocus />
          <Button type="submit" disabled={!cmd.trim()}>
            Run
          </Button>
        </form>
      ) : null}
      {projectId && tasks === undefined ? (isLoading ? <Loading /> : error ? <LoadError error={error} /> : null) : null}
      {projectId && tasks?.length === 0 ? <Empty>No tasks yet. Tasks run in hc, so they stay alive when you close the app.</Empty> : null}
      {(tasks?.length ?? 0) ? (
        <div className="overflow-hidden rounded-lg border border-border">
          {(tasks ?? []).map((t: TaskRef, i) => {
            const live = t.state === 'live';
            return (
              <div key={t.terminal} className={cn('flex flex-col', i > 0 && 'border-t border-border')}>
                <div className="flex flex-col gap-1 py-2 pl-3 pr-1.5">
                  <div className="flex items-center gap-2">
                    <TruncatedText className="min-w-0 flex-1 truncate font-mono text-[12px]">{t.command}</TruncatedText>
                    <span
                      className={cn(
                        'inline-flex h-5 shrink-0 items-center gap-1.5 rounded-md border px-1.5 text-[11px] font-medium',
                        live ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn('size-1.5 rounded-full', live ? 'bg-primary-foreground hs-pulse' : t.exit_code === 0 ? 'bg-st-done' : 'bg-st-error')}
                      />
                      {live ? 'running' : `exit ${t.exit_code ?? '?'}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <TruncatedText className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{t.terminal}</span>
                      {t.created_ms ? ` · ${timeAgo(t.created_ms)}` : ''}
                    </TruncatedText>
                    <span className="flex gap-0.5">
                      <Button variant="ghost" size="xs" onClick={() => setLogOf(logOf === t.terminal ? null : t.terminal)} aria-expanded={logOf === t.terminal}>
                        Log
                      </Button>
                      {live ? (
                        <Button variant="ghost" size="xs" onClick={() => act(api.taskKill(t.terminal))}>
                          Kill
                        </Button>
                      ) : (
                        <Button variant="ghost" size="xs" onClick={() => act(api.taskRemove(t.terminal))}>
                          Remove
                        </Button>
                      )}
                    </span>
                  </div>
                </div>
                {logOf === t.terminal ? (
                  <div className="px-2 pb-2">
                    <TerminalView terminal={t.terminal} height={240} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

// ── Git ──
function splitPath(p: string) {
  const i = p.lastIndexOf('/');
  return i < 0 ? { dir: '', name: p } : { dir: p.slice(0, i), name: p.slice(i + 1) };
}

function GitPanel({ workspaceId }: { workspaceId: string | null }) {
  const [sel, setSel] = useState<string | null>(null);
  const { data: files, refetch, isFetching, isLoading, error } = useQuery({ queryKey: qk.files(workspaceId ?? ''), queryFn: () => api.filesChanged(workspaceId!), enabled: !!workspaceId, refetchInterval: 5000 });
  const { data: diff, error: diffError } = useQuery({ queryKey: ['diff', workspaceId, sel], queryFn: () => api.fileDiff(workspaceId!, sel!), enabled: !!workspaceId && !!sel });

  if (sel && workspaceId) {
    const lines: DiffLine[] = (diff ?? '')
      .split('\n')
      .filter((l) => !/^(diff --git|index |--- |\+\+\+ )/.test(l))
      .map((l) => ({ kind: l.startsWith('+') ? 'add' : l.startsWith('-') ? 'del' : 'ctx', text: l.startsWith('@@') ? l : l.slice(1) }));
    const add = lines.filter((l) => l.kind === 'add').length;
    const del = lines.filter((l) => l.kind === 'del').length;
    const { dir, name } = splitPath(sel);
    return (
      <section aria-label="File content" className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5 border-b border-border py-2 pl-2 pr-3">
          <Button variant="ghost" size="icon" aria-label="Back to file list" onClick={() => setSel(null)}>
            <ChevronLeft />
          </Button>
          <span className="flex min-w-0 flex-1 flex-col leading-snug">
            <TruncatedText className="truncate font-mono text-[12px] font-medium">{name}</TruncatedText>
            <TruncatedText className="truncate text-xs text-muted-foreground">
              {dir || 'project root'} · <span className="text-diff-add-fg">+{add}</span> <span className="text-diff-del-fg">−{del}</span>
            </TruncatedText>
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {diff === undefined ? (diffError ? <LoadError error={diffError} /> : <Loading />) : <Diff lines={lines} maxHeight={100000} bare />}
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Git" className="flex flex-col gap-3 p-4">
      <SectionHead title="Git" desc={workspaceId && files ? `${files.length} uncommitted ${files.length === 1 ? 'change' : 'changes'} in the workspace` : 'Uncommitted changes in the workspace'}>
        {workspaceId ? (
          <Button variant="ghost" size="icon" onClick={() => refetch()} aria-label="Refresh">
            <RefreshCw className={cn('size-[15px]', isFetching && 'animate-spin')} />
          </Button>
        ) : null}
      </SectionHead>
      {!workspaceId ? <Empty>Pick a workspace.</Empty> : files === undefined ? (isLoading ? <Loading /> : error ? <LoadError error={error} /> : null) : files.length === 0 ? <Empty>No changes yet.</Empty> : null}
      {(files?.length ?? 0) ? (
        <div className="flex flex-col gap-0.5">
          {(files ?? []).map((f) => {
            const { dir, name } = splitPath(f.path);
            const kind = f.status === '??' ? 'A' : f.status.trim().slice(0, 1) || 'M';
            return (
              <button
                type="button"
                key={f.path}
                onClick={() => setSel(f.path)}
                className="flex min-h-11 items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-accent"
                title={f.path}
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded border border-border font-mono text-[11px] font-semibold">{kind}</span>
                <span className="flex min-w-0 flex-1 flex-col leading-snug">
                  <TruncatedText className="truncate font-mono text-[12px]">{name}</TruncatedText>
                  <TruncatedText className="truncate text-xs text-muted-foreground">{dir || 'project root'}</TruncatedText>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
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
          <code className="h-6 shrink-0 rounded-md border border-border px-2 font-mono text-[11px] leading-5">hc attach {s.hc_terminal}</code>
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
