import { TruncatedText } from '@/components/ui/truncated-text';
// FR-002a: confirmation lists running sessions/tasks; on confirm, stops them all and removes the project from the app.
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { api, errMsg } from '@/lib/api';
import type { Project, RunningRef } from '@/lib/types';
import { useUiStore } from '@/stores/useUiStore';
import { toast } from '@/components/ui/toast';

export function DeleteProjectDialog({ project, open, onOpenChange }: { project: Project; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [running, setRunning] = useState<RunningRef[] | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setRunning(null);
    api.projectDeletePreview(project.id).then(setRunning).catch(() => setRunning([]));
  }, [open, project.id]);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      destructive
      busy={busy}
      title={`Remove project “${project.name}” from Herdsman?`}
      description="The folder on disk and the original Claude/Codex transcripts are not deleted."
      confirmLabel={running?.length ? `Stop ${running.length} ${running.length === 1 ? 'process' : 'processes'} and remove` : 'Remove'}
      onConfirm={async () => {
        setBusy(true);
        try {
          await api.projectDelete(project.id);
          const ui = useUiStore.getState();
          if (ui.projectId === project.id) ui.selectWorkspace('', null);
          qc.invalidateQueries();
          onOpenChange(false);
          toast(`Removed project ${project.name}`);
        } catch (e) {
          toast(errMsg(e), 'error');
        } finally {
          setBusy(false);
        }
      }}
    >
      {running === null ? (
        <p className="text-[12px] text-muted-foreground">Checking for running processes…</p>
      ) : running.length ? (
        <div className="rounded-md border border-warn-border bg-warn-bg p-3 text-xs text-warn-fg">
          <p className="mb-1.5 font-medium">These processes will be stopped:</p>
          <ul className="space-y-0.5">
            {running.map((r) => (
              <li key={r.terminal} className="flex gap-2">
                <span className="font-mono opacity-70">{r.terminal}</span>
                <span>{r.kind === 'session' ? 'Session' : 'Terminal'}:</span>
                <TruncatedText className="truncate">{r.title}</TruncatedText>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-[12px] text-muted-foreground">No processes are running.</p>
      )}
    </ConfirmDialog>
  );
}
