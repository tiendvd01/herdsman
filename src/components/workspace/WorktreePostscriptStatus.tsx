import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { api, errMsg } from '@/lib/api';

const labels = {
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
  interrupted: 'Interrupted',
};

export function WorktreePostscriptStatus({ workspaceId }: { workspaceId: string }) {
  const query = useQuery({
    queryKey: ['workspace-postscript', workspaceId],
    queryFn: () => api.workspacePostscriptGet(workspaceId),
    refetchInterval: ({ state }) => state.data?.status === 'running' ? 1000 : false,
  });
  const run = query.data;
  if (!run) {
    return query.isError
      ? <p className="px-4 py-2 text-xs text-destructive" role="status">Could not load postscript status. {errMsg(query.error)}</p>
      : null;
  }

  return (
    <details className="shrink-0 border-b border-border bg-surface px-4 py-1.5 text-xs">
      <summary className="cursor-pointer">
        <span role="status">Worktree Postscript{' '}
          <Badge variant={run.status === 'failed' || run.status === 'interrupted' ? 'warn' : 'outline'}>
            {labels[run.status]}
          </Badge>
        </span>
      </summary>
      <div className="flex max-h-48 flex-col gap-2 overflow-auto py-2">
        {run.error && <p className="text-destructive">{run.error}</p>}
        {run.stdout && <div>Output<pre className="whitespace-pre-wrap break-all text-muted-foreground">{run.stdout}</pre></div>}
        {run.stderr && <div>Error output<pre className="whitespace-pre-wrap break-all text-muted-foreground">{run.stderr}</pre></div>}
        {!run.error && !run.stdout && !run.stderr && <p className="text-muted-foreground">No output available.</p>}
      </div>
    </details>
  );
}
