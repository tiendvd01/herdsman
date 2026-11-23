// Add a project: pick a folder on this machine and give it a display name (FR-001).
import { useEffect, useState } from 'react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { api, errMsg } from '@/lib/api';
import { qk } from '@/lib/queries';
import { useUiStore } from '@/stores/useUiStore';

const baseName = (p: string) => p.replace(/[/\\]+$/, '').split(/[/\\]/).pop() ?? '';

export function AddProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [path, setPath] = useState('');
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPath('');
    setName('');
    setNameTouched(false);
    setErr(null);
  }, [open]);

  function changePath(p: string) {
    setPath(p);
    if (!nameTouched) setName(baseName(p));
  }

  async function choose() {
    const dir = await openDialog({ directory: true, multiple: false, title: 'Choose project folder' });
    if (typeof dir === 'string') changePath(dir);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!path.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      let p = await api.projectAdd(path.trim());
      const display = name.trim();
      if (display && display !== p.name) p = await api.projectRename(p.id, display);
      qc.invalidateQueries({ queryKey: qk.projects });
      useUiStore.getState().selectWorkspace(p.id, null);
      toast(`Added project ${p.name}`);
      onOpenChange(false);
    } catch (x) {
      setErr(errMsg(x));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(440px,calc(100%-32px))]">
        <DialogHeader title="Add project" description="A project is a folder on this machine. Each workspace in the project uses this folder or a worktree of it." />
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-path">Folder path</Label>
            <div className="flex gap-2">
              <Input id="project-path" className="font-mono text-[12px]" value={path} onChange={(e) => changePath(e.target.value)} placeholder="~/work/my-project" autoFocus />
              <Button variant="outline" onClick={choose}>
                Choose…
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Display name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameTouched(true);
              }}
              placeholder="Defaults to the folder name"
            />
          </div>
          {err ? <p className="rounded-md border border-destructive/40 bg-danger-bg px-3 py-2 text-[12px] text-destructive">{err}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !path.trim()}>
              {busy ? 'Adding…' : 'Add project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
