import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { api, errMsg, type ProjectCodegraphAction } from '@/lib/api';
import type { Project } from '@/lib/types';

export function ProjectCodegraphDialog({ project, onClose }: {
  project: Pick<Project, 'id' | 'name'>;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ['project-codegraph', project.id],
    queryFn: () => api.projectCodegraphStatus(project.id),
    refetchInterval: (query) => query.state.data?.running ? 1500 : false,
    gcTime: 0,
    retry: false,
  });
  const action = useMutation({
    mutationFn: (action: ProjectCodegraphAction) => api.projectCodegraphRun(project.id, action),
    onSettled: () => query.refetch().then(() => undefined),
  });
  const status = query.data;
  const lastIndexed = status?.stats?.lastIndexed ? new Date(status.stats.lastIndexed) : null;
  const canRepair = status?.indexed && !status.ignored && !status.tracked;
  const initialize = status && (!status.indexed || Boolean(status.runError && !status.stats?.lastIndexed));
  const canIndex = status?.toolAvailable && !status.runtimeError && (!initialize || !status.tracked);
  const busy = action.isPending || status?.running || query.isFetching;
  const error = action.error ?? query.error;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader title="CodeGraph Index" description={project.name} />
        {query.isPending && <div role="status" className="flex items-center gap-2 text-sm"><Spinner /> Checking index…</div>}
        {status && (
          <div className="flex min-w-0 flex-col gap-3 text-sm">
            <p role="status" className="flex items-center gap-2 font-medium">
              {status.running && <Spinner />}
              {status.running ? 'Indexing…'
                : status.runError && !status.stats?.lastIndexed ? 'Indexing failed'
                : status.indexed ? 'Indexed' : 'Not indexed'}
            </p>
            {status.stats && (
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 text-muted-foreground">
                {status.stats.fileCount != null && <><dt>Files</dt><dd>{status.stats.fileCount.toLocaleString()}</dd></>}
                {status.stats.nodeCount != null && <><dt>Symbols</dt><dd>{status.stats.nodeCount.toLocaleString()}</dd></>}
                {lastIndexed && Number.isFinite(lastIndexed.getTime()) && <><dt>Last indexed</dt><dd>{lastIndexed.toLocaleString()}</dd></>}
              </dl>
            )}
            {!status.toolAvailable && <p className="text-muted-foreground">CodeGraph CLI was not found. Install it and check again.</p>}
            {status.tracked && <p className="text-muted-foreground">This repository tracks files in .codegraph/.</p>}
            {canRepair && <p className="text-muted-foreground">Git does not ignore this index.</p>}
            {status.runtimeError && <Alert variant="destructive"><AlertDescription>{status.runtimeError}</AlertDescription></Alert>}
            {status.runError && !action.isPending && (
              <Alert variant="destructive"><AlertDescription className="wrap-anywhere">{status.runError}</AlertDescription></Alert>
            )}
          </div>
        )}
        {error && <Alert variant="destructive"><AlertDescription className="wrap-anywhere">{errMsg(error)}</AlertDescription></Alert>}
        <DialogFooter className="flex-wrap items-center">
          {canRepair && <Button variant="outline" disabled={busy} onClick={() => action.mutate('exclude')}>Add to local Git exclude</Button>}
          {canIndex && <Button disabled={busy} onClick={() => action.mutate(initialize ? 'init' : 'refresh')}>
            {initialize ? 'Initialize index' : 'Refresh index'}
          </Button>}
          {(query.isError || (status && (!status.toolAvailable || status.runtimeError))) && (
            <Button variant="outline" disabled={busy} onClick={() => void query.refetch()}>Check again</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
