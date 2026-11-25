import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TruncatedText } from '@/components/ui/truncated-text';
// FR-027/028: workspace session history (newest first) and content search, optionally across all projects.
import { useEffect, useState } from 'react';
import { History, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip';
import { StatusDot, STATUS_LABEL } from '@/components/ui/status-dot';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { openClaudeConversation } from '@/lib/actions';
import type { ClaudeHit, Session, Workspace } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';
import { useUiStore } from '@/stores/useUiStore';

export function HistoryPopover({ ws, sessions }: { ws: Workspace; sessions: Session[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const [hits, setHits] = useState<ClaudeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const qc = useQueryClient();
  const statuses = useUiStore((s) => s.statuses);
  const current = useUiStore((s) => s.sessionByWorkspace[ws.id]);
  const sorted = sessions.filter((s) => s.title || ws.deleted_at != null).sort((a, b) => b.updated_at - a.updated_at);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setHits([]);
    setLoading(true);
    setFailed(false);
    const h = setTimeout(() => {
      api.claudeSearch(q, { workspaceId: all ? undefined : ws.id }).then((results) => {
        if (active) setHits(results);
      }).catch(() => {
        if (active) setFailed(true);
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, q.trim() ? 150 : 0);
    return () => {
      active = false;
      clearTimeout(h);
    };
  }, [open, q, all, ws.id]);
  const browse = !q.trim();
  const shown = browse ? hits.filter((hit) => !sessions.some((s) => s.engine_session_id === hit.claude_session_id)) : hits;

  function openSession(workspaceId: string, projectId: string, sessionId: string, status?: string) {
    const ui = useUiStore.getState();
    ui.selectWorkspace(projectId, workspaceId);
    if (status === 'done') ui.addTempTab(workspaceId, sessionId);
    ui.selectSession(workspaceId, sessionId);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip content="Session history">
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Workspace session history"
            className={cn('mb-2 flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs hover:bg-accent', open && 'bg-accent')}
          >
            <History className="size-[15px]" />
            <span className="font-mono text-muted-foreground">{sorted.length}</span>
          </button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-[380px]" sideOffset={4}>
        <div className="flex flex-col gap-2 p-1 pb-2">
          <label className="flex h-9 items-center gap-2 rounded-md border border-input px-3 text-muted-foreground">
            <Search className="size-4 shrink-0" />
            <span className="sr-only">Search Claude conversations</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              placeholder="Search Claude conversations…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </label>
          <RadioGroup orientation="horizontal" value={String(all)} onValueChange={(value) => setAll(value === 'true')} className="inline-flex h-8 self-start rounded-lg bg-muted p-0.5" aria-label="Search scope">
            {(
              [
                [false, 'This workspace'],
                [true, 'All projects'],
              ] as const
            ).map(([v, label]) => (
              <RadioGroupItem
                key={String(v)}
                value={String(v)}
                className={cn(
                  'h-6 rounded-md border px-2 text-[12px] font-medium',
                  all === v ? 'border-border bg-background text-foreground shadow-xs dark:shadow-none' : 'border-transparent text-muted-foreground',
                )}
              >
                {label}
              </RadioGroupItem>
            ))}
          </RadioGroup>
        </div>
        <span className="block px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {browse ? `Sessions in ${ws.name ?? 'this workspace'}` : 'Claude conversations'}
        </span>
        <div className="flex max-h-[420px] flex-col overflow-y-auto">
          {browse && sorted.map((s) => {
            const st = statuses[s.id]?.state ?? s.status;
            return (
              <button
                type="button"
                key={s.id}
                className={cn('flex min-h-9 items-center gap-2 rounded-md px-2 text-left hover:bg-accent', s.id === current && 'bg-accent')}
                onClick={() => openSession(ws.id, ws.project_id, s.id, st)}
              >
                <StatusDot status={st} />
                <TruncatedText className="min-w-0 flex-1 truncate text-[12px]">{s.title ?? 'New session'}</TruncatedText>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {STATUS_LABEL[st]} · {timeAgo(s.updated_at)}
                </span>
              </button>
            );
          })}
          {browse && shown.length > 0 && (
            <span className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Claude Code</span>
          )}
          {shown.map((h) => (
            <button
              type="button"
              key={h.claude_session_id}
              className="flex flex-col rounded-md px-2 py-1.5 text-left hover:bg-accent"
              onClick={() => {
                setOpen(false);
                void openClaudeConversation(qc, h);
              }}
            >
              <TruncatedText className="truncate text-[12px] font-medium">{h.title ?? 'Conversation'}</TruncatedText>
              <TruncatedText className="truncate text-xs text-muted-foreground">
                {h.project_name ? `${h.project_name} › ${h.workspace_name ?? 'Workspace'}` : (h.cwd ?? 'Unknown folder')}
              </TruncatedText>
              {h.snippet && <TruncatedText className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{h.snippet}</TruncatedText>}
            </button>
          ))}
          {(loading || failed || (!shown.length && (!browse || !sorted.length))) && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground" role="status">
              {loading ? 'Loading Claude conversations…' : failed ? 'Could not load Claude conversations' : browse ? 'No sessions yet' : 'No matches'}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
