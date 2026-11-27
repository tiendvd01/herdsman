import { usePathLabel } from '@/lib/homePath';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { TruncatedText } from '@/components/ui/truncated-text';
import { openStoredSession } from '@/lib/actions';
import { api, errMsg } from '@/lib/api';
import { qk } from '@/lib/queries';
import type { ClaudeHit, StoredHistoryEntry } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import { useUiStore } from '@/stores/useUiStore';

type HistoryRow = { stored?: StoredHistoryEntry; claude?: ClaudeHit; updatedAt: number };
const noStored: StoredHistoryEntry[] = [];
const noClaude: ClaudeHit[] = [];
const ENGINE_NAME = { claude: 'Claude Code', codex: 'Codex', echo: 'Echo' };

function historyRows(stored: StoredHistoryEntry[], claude: ClaudeHit[], matches: StoredHistoryEntry[]) {
  const byId = new Map(stored.map((entry) => [entry.session.id, entry]));
  const rows = new Map<string, HistoryRow>();
  const storedKey = ({ session }: StoredHistoryEntry) =>
    session.engine === 'claude' && session.engine_session_id ? `claude:${session.engine_session_id}` : session.id;
  for (const entry of matches) {
    const key = storedKey(entry);
    const previous = rows.get(key)?.stored;
    if (previous) {
      const bothRetained = !!previous.workspace.deleted_at === !!entry.workspace.deleted_at;
      const preferPrevious = bothRetained
        ? previous.session.updated_at >= entry.session.updated_at : !previous.workspace.deleted_at;
      if (preferPrevious) continue;
    }
    rows.set(key, { stored: entry, updatedAt: entry.session.updated_at });
  }
  for (const hit of claude) {
    const key = `claude:${hit.claude_session_id}`;
    const previous = rows.get(key);
    if (previous?.claude) continue;
    const entry = (hit.session_id ? byId.get(hit.session_id) : undefined) ?? previous?.stored;
    const stored = entry && { ...entry, snippet: previous?.stored?.snippet ?? entry.snippet };
    rows.set(key, { stored, claude: hit, updatedAt: Math.max(hit.updated_at, entry?.session.updated_at ?? 0) });
  }
  return [...rows.entries()].sort(([idA, a], [idB, b]) => b.updatedAt - a.updatedAt || idA.localeCompare(idB));
}

export function HistoryPanel({ workspaceId, selectedSessionId, active }: {
  workspaceId: string | null;
  selectedSessionId?: string;
  active: boolean;
}) {
  const pathLabel = usePathLabel();
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'workspace' | 'all'>(() => workspaceId ? 'workspace' : 'all');
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState('');
  const scopedId = scope === 'workspace' ? workspaceId ?? undefined : undefined;
  const ready = input.trim() === query;
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(input.trim()), input.trim() ? 150 : 0);
    return () => window.clearTimeout(timer);
  }, [input]);

  const stored = useQuery({
    queryKey: [...qk.historySessions, scopedId, 'browse'],
    queryFn: () => api.historyStored('', scopedId),
    enabled: active,
  });
  const search = useQuery({
    queryKey: [...qk.historySessions, scopedId, 'search', query],
    queryFn: () => api.historyStored(query, scopedId),
    enabled: active && ready && !!query,
  });
  const cli = useQuery({
    queryKey: ['history-claude', scopedId, query],
    queryFn: () => api.historyClaude(query, scopedId),
    enabled: active && ready,
    retry: false,
  });
  const managed = query ? search : stored;
  const rows = useMemo(() => historyRows(stored.data ?? noStored, cli.data?.hits ?? noClaude, managed.data ?? noStored),
    [stored.data, cli.data, managed.data]);
  const loading = !ready || managed.isPending || cli.isPending;
  const managedFailed = managed.isError || stored.isError;
  const failed = managedFailed || cli.isError || cli.data?.partial;

  async function open(row: HistoryRow) {
    if (opening) return;
    if (!workspaceId) setScope('all');
    setOpening(true);
    setOpenError('');
    try {
      if (row.stored) {
        const { workspace, session } = row.stored;
        const status = useUiStore.getState().statuses[session.id]?.state ?? session.status;
        await openStoredSession(qc, { workspace, session: { ...session, status } });
      } else if (row.claude) {
        await openStoredSession(qc, await api.claudeOpen(row.claude.claude_session_id, row.claude.workspace_id ?? undefined));
        void qc.invalidateQueries({ queryKey: ['history-claude'] });
      }
    } catch (error) {
      setOpenError(errMsg(error));
    } finally {
      setOpening(false);
    }
  }

  return (
    <section aria-label="Session history" className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-2 border-b border-border p-3">
        <h2 className="text-sm font-medium">History</h2>
        <Input type="search" aria-label="Search sessions" placeholder="Search sessions…" value={input}
          onChange={(event) => setInput(event.target.value)} />
        <Select value={scopedId ? 'workspace' : 'all'} onValueChange={(value) => setScope(value === 'workspace' ? 'workspace' : 'all')}>
          <SelectTrigger aria-label="History scope" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="workspace" disabled={!workspaceId}>This workspace</SelectItem>
            <SelectItem value="all">All projects</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading && <div role="status" className="flex items-center gap-2 p-2 text-xs text-muted-foreground"><Spinner /> Loading sessions…</div>}
        {failed && ready && (
          <Alert variant="destructive" className="mb-2">
            <AlertDescription>
              {managedFailed ? 'Could not load Herdsman history. ' : ''}
              {cli.isError || cli.data?.partial ? 'Some Claude Code CLI history could not be loaded.' : ''}
            </AlertDescription>
          </Alert>
        )}
        {openError && <Alert variant="destructive" className="mb-2"><AlertDescription>{openError}</AlertDescription></Alert>}
        {ready && rows.length > 0 && (
          <ul className="flex flex-col gap-0.5">
            {rows.map(([id, row]) => {
              const { stored, claude, updatedAt } = row;
              const title = stored?.session.title ?? claude?.title ?? (claude && !stored
                ? `Claude session ${claude.claude_session_id.slice(0, 8)}` : 'Untitled session');
              const source = stored && claude ? 'Herdsman · Claude Code CLI'
                : stored ? `${ENGINE_NAME[stored.session.engine]} · Herdsman` : 'Claude Code CLI';
              const context = !scopedId && (stored
                ? [stored.project_name, stored.workspace.name ?? 'Untitled workspace'].join(' › ')
                : [claude?.project_name, claude?.workspace_name ?? pathLabel(claude?.cwd ?? '')].filter(Boolean).join(' › ') || 'Unknown folder');
              const snippet = stored?.snippet?.replace(/\[\[(.*?)\]\]/g, '$1') || claude?.snippet;
              const current = !!stored && stored.session.id === selectedSessionId;
              return (
                <li key={id} className="min-w-0">
                  <Button type="button" variant={current ? 'secondary' : 'ghost'} aria-current={current || undefined}
                    aria-disabled={opening} onClick={() => void open(row)}
                    className="h-auto w-full min-w-0 flex-col items-start gap-0.5 whitespace-normal px-2 py-2 text-left">
                    <TruncatedText className="block w-full truncate text-[13px] font-medium">{title}</TruncatedText>
                    <span className="w-full text-xs text-muted-foreground">{source}{updatedAt > 0 ? ` · ${timeAgo(updatedAt)}` : ''}</span>
                    {context && <TruncatedText className="block w-full truncate text-xs text-muted-foreground">{context}</TruncatedText>}
                    {snippet && <TruncatedText className="line-clamp-2 w-full text-xs text-muted-foreground">{snippet}</TruncatedText>}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {!loading && !failed && !rows.length && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia><History /></EmptyMedia>
              <EmptyDescription role="status">{query ? 'No matching sessions' : 'No sessions yet'}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </section>
  );
}
