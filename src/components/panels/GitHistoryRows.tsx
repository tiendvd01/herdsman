import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cloud, GitBranch } from 'lucide-react';
import { fileRow, gitStatusMarker, gitStatusPresentation } from '@/components/files/fileRows';
import { materialFileIcon } from '@/components/files/materialFileIcons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TruncatedText } from '@/components/ui/truncated-text';
import { api, errMsg } from '@/lib/api';
import type { GitCommit } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useFileStore } from '@/stores/useFileStore';

const COLUMN = 12;
const ROW = 28;
const x = (lane: number) => lane * COLUMN + COLUMN / 2;
const COLORS = [
  'var(--git-graph-blue)',
  'var(--git-graph-orange)',
  'var(--git-graph-green)',
  'var(--git-graph-purple)',
  'var(--git-graph-red)',
];

type Lane = { id: string; color: string };

function availableColor(lanes: readonly (Lane | null)[], lane: number) {
  return COLORS.find((color) => lanes.every((active) => active?.color !== color))
    ?? COLORS[lane % COLORS.length];
}

function CommitFiles({ commit, projectId, workspaceId }: { commit: GitCommit; projectId: string | null; workspaceId: string }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['commit-changes', workspaceId, commit.id],
    queryFn: () => api.commitChanges(workspaceId, commit.id),
    staleTime: Infinity,
  });
  if (isPending) return <p role="status" className="px-2 py-1 text-muted-foreground">Loading commit changes…</p>;
  if (isError) return <p role="alert" className="px-2 py-1 break-words text-destructive">{errMsg(error)}</p>;
  if (!data.length) return <p className="px-2 py-1 text-muted-foreground">No files changed.</p>;
  return (
    <ul aria-label={`Files changed in ${commit.short_id}`}>
      {data.map(({ path, status, original }) => {
        const slash = path.lastIndexOf('/');
        const name = path.slice(slash + 1);
        const directory = path.slice(0, slash + 1);
        const change = gitStatusPresentation(status);
        const title = original ? `${original} → ${path}` : path;
        return (
          <li key={path}>
            <Button variant="ghost" size="xs" className={cn(fileRow, 'w-full min-w-0')}
              title={title} aria-label={`Changes for ${title}, Git status ${status}: ${change.label}`}
              disabled={!projectId}
              onClick={() => {
                if (projectId) useFileStore.getState().openDiff(projectId, workspaceId, path, {
                  id: commit.id, shortId: commit.short_id, original: original ?? undefined,
                });
              }}>
              <img src={materialFileIcon(name, false)} alt="" className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{name}</span>
              {directory && <span className="min-w-0 truncate text-muted-foreground">{directory}</span>}
              <span aria-hidden="true" className={cn(gitStatusMarker, 'ml-auto', change.className)}>{change.marker}</span>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

export function GitHistoryRows({ commits, projectId, workspaceId }: {
  commits: GitCommit[]; projectId: string | null; workspaceId: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const detailsId = useId();
  const visible = new Set(commits.map((commit) => commit.id));
  const lanes: (Lane | null)[] = [];
  const rows = commits.map((commit) => {
    const incoming = lanes.findIndex((active) => active?.id === commit.id);
    const lane = incoming === -1 ? lanes.length : incoming;
    const color = lanes[lane]?.color ?? availableColor(lanes, lane);
    const through = lanes.flatMap((active, index) =>
      active && index !== lane ? [{ lane: index, color: active.color }] : []);
    lanes[lane] = null;
    const parents = [...new Set(commit.parents)].filter((id) => visible.has(id)).map((id) => {
      const existing = lanes.findIndex((active) => active?.id === id);
      const activeParent = lanes[existing];
      if (activeParent) return { lane: existing, color: activeParent.color };
      const free = lanes[lane] === null ? lane : lanes.indexOf(null);
      const next = free === -1 ? lanes.length : free;
      const parentColor = id === commit.parents[0] ? color : availableColor(lanes, next);
      lanes[next] = { id, color: parentColor };
      return { lane: next, color: parentColor };
    });
    const width = Math.max(lane + 1, lanes.length) * COLUMN;
    while (lanes.length && lanes[lanes.length - 1] === null) lanes.pop();
    return { commit, incoming, lane, color, parents, through, width };
  });
  const width = Math.max(COLUMN, ...rows.map((row) => row.width));

  return (
    <ul aria-label="Commit history" className="rounded-md">
      {rows.map(({ commit, incoming, lane, color, parents, through }) => (
        <li key={commit.id} className="px-2 text-xs">
          <div className="flex h-7 items-center gap-2">
            <Button variant="ghost" size="xs" className="min-w-0 flex-1 justify-start gap-2 px-0 font-normal"
              aria-expanded={expanded === commit.id} aria-controls={expanded === commit.id ? detailsId : undefined}
              onClick={() => setExpanded(expanded === commit.id ? null : commit.id)}>
              <svg aria-hidden="true" width={width} height={ROW} style={{ width, height: ROW }} className="shrink-0 overflow-visible">
                {through.map((path) => (
                  <path key={path.lane} d={`M ${x(path.lane)} 0 V ${ROW}`} stroke={path.color} />
                ))}
                {incoming !== -1 && <path d={`M ${x(lane)} 0 V ${ROW / 2}`} stroke={color} />}
                {parents.map((parent) => (
                  <path key={parent.lane} d={`M ${x(lane)} ${ROW / 2} L ${x(parent.lane)} ${ROW}`} stroke={parent.color} />
                ))}
                <circle cx={x(lane)} cy={ROW / 2} r={3} fill={color} />
              </svg>
              <code className="shrink-0 text-muted-foreground" title={commit.id}>{commit.short_id}</code>
              <TruncatedText className="min-w-0 flex-1 truncate text-left">{commit.subject || '(No subject)'}</TruncatedText>
            </Button>
            {!!commit.branches?.length && (
              <span role="group" aria-label="Branch tips" tabIndex={commit.branches.length > 1 ? 0 : undefined}
                className="flex max-w-[55%] min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {commit.branches.map(({ name, remote }) => (
                  <Badge key={`${remote}:${name}`} variant={remote ? 'muted' : 'outline'}
                    className="max-w-full rounded-full" title={name}>
                    {remote ? <Cloud aria-hidden="true" /> : <GitBranch aria-hidden="true" />}
                    <span className="truncate">{name}</span>
                  </Badge>
                ))}
              </span>
            )}
          </div>
          {expanded === commit.id && (
            <div id={detailsId} className="relative min-w-0" style={{ paddingLeft: width }}>
              <svg aria-hidden="true" width={width} className="pointer-events-none absolute inset-y-0 left-0 h-full">
                {[...new Map([...through, ...parents].map((edge) => [edge.lane, edge.color]))].map(([index, stroke]) => (
                  <line key={index} x1={x(index)} x2={x(index)} y1="0" y2="100%" stroke={stroke} />
                ))}
              </svg>
              <CommitFiles commit={commit} projectId={projectId} workspaceId={workspaceId} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
