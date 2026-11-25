import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { api, errMsg } from '@/lib/api';
import type { Project } from '@/lib/types';
import { useUiStore } from '@/stores/useUiStore';
import { toast } from '@/components/ui/toast';

export function DeleteProjectDialog({ project, open, onOpenChange }: { project: Project; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      busy={busy}
      title={`Remove project “${project.name}” from Herdsman?`}
      description="Running processes will be stopped. Workspaces and session history are kept and will be available when you add the same folder again."
      confirmLabel="Remove"
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
    />
  );
}
