import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// FR-004–008, US5/US7: create a workspace (project folder or new worktree) with one empty session.
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label, NativeSelect } from '@/components/ui/input';
import { api, errMsg, type DirChoice } from '@/lib/api';
import type { Engine, Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/useUiStore';

export function CreateWorkspaceDialog({ project, open, onOpenChange }: { project: Project; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'project' | 'worktree'>('worktree');
  const [base, setBase] = useState('');
  const [branch, setBranch] = useState('');
  const [engine, setEngine] = useState<Engine>('claude');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { data: info } = useQuery({ queryKey: ['branches', project.id], queryFn: () => api.gitBranches(project.id), enabled: open });
  const notRepo = info ? !info.is_repo : false;

  useEffect(() => {
    if (info?.current && !base) setBase(info.current);
  }, [info, base]);
  useEffect(() => {
    if (notRepo) setKind('project');
  }, [notRepo]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const dir: DirChoice = kind === 'project' ? { kind: 'project' } : { kind: 'worktree', base_branch: base, branch: branch.trim() || undefined };
    try {
      const { workspace, session } = await api.workspaceCreate({
        projectId: project.id,
        name: name.trim() || undefined,
        dir,
        engine,
      });
      qc.invalidateQueries({ queryKey: ['workspaces', project.id] });
      const ui = useUiStore.getState();
      ui.setCollapsed(project.id, false);
      ui.selectWorkspace(project.id, workspace.id);
      ui.selectSession(workspace.id, session.id);
      onOpenChange(false);
    } catch (x) {
      setErr(errMsg(x));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader title={`New workspace · ${project.name}`} description="The workspace comes with an empty session. Write your first prompt there." />
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ws-name">Name</Label>
            <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Leave empty to name it after the first prompt" autoFocus />
          </div>
          <RadioGroup orientation="vertical" value={kind} onValueChange={(value) => setKind(value as typeof kind)} aria-label="Working directory" className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">Working directory</span>
            <DirOption
              active={kind === 'worktree'}
              value="worktree"
              disabled={notRepo}
              title="New worktree"
              desc={
                notRepo
                  ? 'The project is not a git repo.'
                  : `Separate checkout on a new branch created from ${base || 'the base branch'}. Runs in parallel with other workspaces without overwriting files.`
              }
            />
            <DirOption
              active={kind === 'project'}
              value="project"
              title="Project folder"
              desc="Work directly in the project folder, on the currently checked-out branch."
            />
          </RadioGroup>
          {kind === 'worktree' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ws-base">Base branch</Label>
                <NativeSelect id="ws-base" value={base} onChange={(e) => setBase(e.target.value)}>
                  {(info?.branches ?? []).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ws-branch">New branch</Label>
                <Input id="ws-branch" className="font-mono text-[12px]" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="herdsman/<name>" />
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="ws-engine">Agent</Label>
            <NativeSelect id="ws-engine" value={engine} onChange={(e) => setEngine(e.target.value as Engine)}>
              <option value="claude">Claude (Agent SDK)</option>
              <option value="echo">Echo — simulated, no model calls</option>
              <option value="codex" disabled>
                Codex — not supported yet
              </option>
            </NativeSelect>
          </div>
          {err ? <p className="rounded-md border border-destructive/40 bg-danger-bg px-3 py-2 text-[12px] text-destructive">{err}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || (kind === 'worktree' && !base)}>
              {busy ? 'Creating…' : 'Create workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DirOption(props: { active: boolean; disabled?: boolean; value: string; title: string; desc: string }) {
  return (
    <RadioGroupItem
      value={props.value}
      disabled={props.disabled}
      className={cn(
        'flex items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        props.active ? 'border-foreground' : 'border-border hover:bg-accent',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border', props.active ? 'border-foreground' : 'border-input')}
      >
        <span className={cn('size-2 rounded-full', props.active ? 'bg-foreground' : 'bg-transparent')} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[13px] font-medium">{props.title}</span>
        <span className="text-[12px] text-muted-foreground">{props.desc}</span>
      </span>
    </RadioGroupItem>
  );
}
