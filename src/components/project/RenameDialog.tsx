import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errMsg } from '@/lib/api';

export function RenameDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  initial: string;
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setName(initial);
      setErr(null);
    }
  }, [open, initial]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader title={title} />
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await onSave(name.trim());
              onOpenChange(false);
            } catch (x) {
              setErr(errMsg(x));
            }
          }}
        >
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
          {err ? <p className="mt-2 text-xs text-destructive">{err}</p> : null}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
