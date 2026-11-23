import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { errMsg } from '@/lib/api';
import { isDirty, useFileStore, type FileTab } from '@/stores/useFileStore';

export function useFileClose(onCloseAutoFocus?: (event: Event) => void) {
  const [request, setRequest] = useState<{ file: FileTab; finish: () => void }>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  function close(file: FileTab, finish = () => {}) {
    const store = useFileStore.getState();
    if (file.saving) return;
    if (isDirty(file)) {
      setError('');
      setRequest({ file, finish });
    } else {
      store.close(file.id);
      finish();
    }
  }

  async function resolve(save: boolean) {
    if (!request) return;
    const { file, finish } = request;
    setBusy(true);
    setError('');
    try {
      const store = useFileStore.getState();
      if (save) {
        await store.save(file.id);
        void qc.invalidateQueries({ queryKey: ['files'] });
        void qc.invalidateQueries({ queryKey: ['diff'] });
        if (useFileStore.getState().tabs.some((item) => item.id === file.id && isDirty(item))) {
          throw new Error(`Save the latest edits to ${file.name} before closing.`);
        }
      }
      store.close(file.id);
      setRequest(undefined);
      finish();
    } catch (failure) {
      setError(errMsg(failure));
    } finally {
      setBusy(false);
    }
  }

  return {
    close,
    dialog: (
      <Dialog open={!!request} onOpenChange={(open) => { if (!open && !busy) setRequest(undefined); }}>
        <DialogContent hideClose onCloseAutoFocus={onCloseAutoFocus}>
          <DialogHeader title={`Save changes to ${request?.file.name ?? 'this file'}?`}
            description="Save your changes before closing, or discard them." />
          {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
          <DialogFooter>
            <Button variant="ghost" disabled={busy} onClick={() => setRequest(undefined)}>Cancel</Button>
            <Button variant="outline" disabled={busy} onClick={() => void resolve(false)}>Discard</Button>
            <Button disabled={busy} onClick={() => void resolve(true)}>{busy ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
  };
}
