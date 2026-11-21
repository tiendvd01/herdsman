// FR-008a–c: rename, archive, delete a workspace; warns when the worktree has uncommitted changes.
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { RenameDialog } from '@/components/project/RenameDialog';
import { toast } from '@/components/ui/toast';
import { api, errMsg } from '@/lib/api';
import type { Workspace } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/useUiStore';

/** Workspace actions; `header` is the open workspace's header, `sidebar` sits in a sidebar row (shown on hover/focus). */
export function WorkspaceMenu({ ws, variant = 'header' }: { ws: Workspace; variant?: 'header' | 'sidebar' }) {
  const qc = useQueryClient();
  const [renaming, setRenaming] = useState(false);
  const [action, setAction] = useState<'archive' | 'delete' | null>(null);
  const [removeWt, setRemoveWt] = useState(false);
  const [dirty, setDirty] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const isWt = ws.dir_kind === 'worktree' && !ws.worktree_removed;

  useEffect(() => {
    if (!action) return;
    setRemoveWt(action === 'delete' && isWt);
    setDirty(null);
    if (isWt) api.workspaceDirtyCheck(ws.id).then((d) => setDirty(d.files)).catch(() => setDirty([]));
  }, [action, isWt, ws.id]);

  async function run() {
    setBusy(true);
    try {
      const confirmDirty = removeWt && !!dirty?.length;
      if (action === 'archive') {
        await api.workspaceArchive(ws.id, removeWt, confirmDirty);
        toast('Workspace archived. Find it again via history search.');
      } else {
        await api.workspaceDelete(ws.id, removeWt, confirmDirty);
        toast('Workspace deleted');
      }
      // Only leave the workspace when it is the one being viewed (spec 002 FR-004/FR-005).
      const ui = useUiStore.getState();
      if (ui.workspaceId === ws.id) ui.selectWorkspace(ws.project_id, null);
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      setAction(null);
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant === 'sidebar' ? 'muted' : 'ghost'}
            size={variant === 'sidebar' ? 'icon-sm' : 'icon'}
            aria-label={`Options for workspace ${ws.name ?? 'New workspace'}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              variant === 'sidebar' &&
                'absolute right-0 top-1/2 -translate-y-1/2 bg-accent opacity-0 hover:bg-background group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100',
            )}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setRenaming(true)}>Rename</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setAction('archive')}>Archive</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setAction('delete')}>
            Delete workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RenameDialog
        open={renaming}
        onOpenChange={setRenaming}
        title="Rename workspace"
        initial={ws.name ?? ''}
        onSave={async (name) => {
          await api.workspaceRename(ws.id, name);
          qc.invalidateQueries({ queryKey: ['workspaces'] });
        }}
      />
      <ConfirmDialog
        open={!!action}
        onOpenChange={(o) => !o && setAction(null)}
        destructive={action === 'delete'}
        busy={busy}
        title={action === 'archive' ? 'Archive workspace?' : 'Delete workspace?'}
        description={
          action === 'archive'
            ? 'The workspace is hidden from the sidebar; its conversation history is kept and still searchable. Running sessions will stop.'
            : 'The workspace and its session history are removed from Herdsman. Running sessions will stop. The project folder and the engine’s original transcripts are not deleted.'
        }
        confirmLabel={action === 'archive' ? 'Archive' : 'Delete'}
        onConfirm={run}
      >
        {isWt ? (
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" checked={removeWt} onChange={(e) => setRemoveWt(e.target.checked)} />
              Also delete worktree <span className="font-mono text-xs text-muted-foreground">{ws.branch}</span>
            </label>
            {removeWt && dirty && dirty.length ? (
              <div className="rounded-md border border-warn-border bg-warn-bg p-3 text-xs text-warn-fg">
                <p className="mb-1 font-medium">The worktree has {dirty.length} uncommitted {dirty.length === 1 ? 'file' : 'files'} — they will be lost if deleted:</p>
                <ul className="max-h-28 overflow-y-auto font-mono">
                  {dirty.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
