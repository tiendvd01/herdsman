import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// FR-004–008, US5/US7: create a workspace (project folder or new worktree) with one empty session.
import { useEffect, useId, useState } from 'react';
import { GitBranch } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [branchInput, setBranchInput] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const branchListId = useId();
  const [wasExisting, setWasExisting] = useState(false);
  const [engine, setEngine] = useState<Engine>('claude');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const branchKey = ['branches', project.id];
  const { data: info, isError: branchListFailed } = useQuery({
    queryKey: branchKey,
    queryFn: () => api.gitBranches(project.id),
    enabled: open,
  });
  const notRepo = info ? !info.is_repo : false;
  const branches = info?.branches ?? [];
  const branch = branchInput.trim();
  const suggestions = suggesting
    ? branches.filter((name) => !info?.checked_out.includes(name) && name.toLowerCase().includes(branch.toLowerCase()))
    : [];
  const showSuggestions = suggestions.length > 0;
  const activeId = suggestions[activeIndex] ? `${branchListId}-${activeIndex}` : undefined;
  const existing = branches.includes(branch);
  const unavailable = info?.checked_out.includes(branch);
  const missing = wasExisting && !existing;
  const defaultBase = info?.default_branch;
  const canCreateWorktree = !branchListFailed && !!branch && !unavailable && !missing && (existing || !!defaultBase);
  const branchHint = unavailable ? 'This branch is already checked out.'
    : missing ? 'This branch is no longer available.'
    : existing ? 'Use this existing branch.'
    : defaultBase ? `New branches start from ${defaultBase}.`
    : info ? 'No default branch is available.' : 'Loading branches…';

  useEffect(() => {
    if (notRepo) setKind('project');
  }, [notRepo]);

  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeId]);

  function closeSuggestions() {
    setSuggesting(false);
    setActiveIndex(-1);
  }

  function updateBranch(value: string) {
    setBranchInput(value);
    setWasExisting(branches.includes(value.trim()));
    setErr(null);
    setActiveIndex(-1);
  }

  function pickBranch(value: string) {
    updateBranch(value);
    closeSuggestions();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || (kind === 'worktree' && !canCreateWorktree)) return;
    setBusy(true);
    setErr(null);
    let dir: DirChoice = { kind: 'project' };
    if (kind === 'worktree') {
      dir = existing ? { kind: 'existing_worktree', branch } : { kind: 'worktree', branch };
      if (existing) setWasExisting(true);
    }
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
      if (dir.kind !== 'project') void qc.invalidateQueries({ queryKey: branchKey });
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onEscapeKeyDown={(e) => {
        if (showSuggestions) {
          e.preventDefault();
          closeSuggestions();
        }
      }}>
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
                  : 'Use a separate checkout for this workspace.'
              }
            />
            <DirOption
              active={kind === 'project'}
              value="project"
              title="Project folder"
              desc="Work directly in the project folder, on the currently checked-out branch."
            />
          </RadioGroup>
          {kind === 'worktree' && (branchListFailed ? (
            <Alert variant="destructive"><AlertDescription>Could not load branches.</AlertDescription></Alert>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="ws-branch">Branch</Label>
              <div className="relative">
                <Input
                  id="ws-branch"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={showSuggestions}
                  aria-controls={showSuggestions ? branchListId : undefined}
                  aria-activedescendant={activeId}
                  value={branchInput}
                  onFocus={() => setSuggesting(true)}
                  onClick={() => setSuggesting(true)}
                  onBlur={closeSuggestions}
                  onChange={(e) => {
                    updateBranch(e.target.value);
                    setSuggesting(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSuggesting(true);
                      const step = e.key === 'ArrowDown' ? 1 : -1;
                      setActiveIndex(showSuggestions ? Math.max(0, Math.min(suggestions.length - 1, activeIndex + step)) : 0);
                    } else if (e.key === 'Enter' && suggestions[activeIndex]) {
                      e.preventDefault();
                      pickBranch(suggestions[activeIndex]);
                    }
                  }}
                  placeholder="Select or enter a branch"
                  aria-describedby="ws-branch-hint"
                  aria-invalid={!!unavailable || missing}
                  autoComplete="off"
                />
                {showSuggestions && (
                  <ul
                    id={branchListId}
                    role="listbox"
                    aria-label="Available branches"
                    className="absolute inset-x-0 top-full z-10 mt-1 max-h-48 overflow-y-auto overscroll-contain rounded-lg border border-border bg-background p-1 shadow-lg"
                  >
                    {suggestions.map((name, index) => (
                      <li
                        key={name}
                        id={`${branchListId}-${index}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        title={name}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickBranch(name)}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-accent aria-selected:bg-accent"
                      >
                        <GitBranch aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p id="ws-branch-hint" className="text-xs text-muted-foreground">{branchHint}</p>
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <Label htmlFor="ws-engine">Agent</Label>
            <NativeSelect id="ws-engine" value={engine} onChange={(e) => setEngine(e.target.value as Engine)}>
              <option value="claude">Claude (Agent SDK)</option>
              <option value="codex">Codex</option>
              <option value="echo">Echo — simulated, no model calls</option>
            </NativeSelect>
          </div>
          {err ? <p className="rounded-md border border-destructive/40 bg-danger-bg px-3 py-2 text-[12px] text-destructive">{err}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || (kind === 'worktree' && !canCreateWorktree)}>
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
