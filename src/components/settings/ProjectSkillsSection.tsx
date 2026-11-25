import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { open } from '@tauri-apps/plugin-dialog';
import { RefreshCw } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { api, errMsg, type ProjectSkillChange } from '@/lib/api';
import { useProjects } from '@/lib/queries';
import { useUiStore } from '@/stores/useUiStore';

export function ProjectSkillsSection() {
  const projects = useProjects();
  const activeProject = useUiStore((state) => state.projectId);
  const [selected, setSelected] = useState<string>();
  const projectId = projects.data?.find(({ id }) => id === (selected ?? activeProject))?.id
    ?? projects.data?.[0]?.id;

  if (projects.isPending) return <p role="status" className="py-4 text-sm text-muted-foreground">Loading projects…</p>;
  if (projects.isError) return <p role="alert" className="py-4 text-sm">Could not load projects. <Button variant="outline" size="sm" onClick={() => void projects.refetch()}>Retry</Button></p>;
  if (!projectId) return <p className="py-4 text-sm text-muted-foreground">Add a project from the sidebar to manage its skills.</p>;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="skills-project" className="text-sm font-medium">Project</label>
        <Select value={projectId} onValueChange={setSelected}>
          <SelectTrigger id="skills-project"><SelectValue /></SelectTrigger>
          <SelectContent>
            {projects.data?.map(({ id, name }) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <ProjectSkills key={projectId} projectId={projectId} />
    </div>
  );
}

function ProjectSkills({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const queryKey = ['project-skills', projectId] as const;
  const catalog = useQuery({ queryKey, queryFn: () => api.projectSkillCatalog(projectId) });
  const [search, setSearch] = useState('');
  const [path, setPath] = useState('');
  const [pickerError, setPickerError] = useState('');
  const [remove, setRemove] = useState<{ sourceId: string; path: string; confirmed: string[]; names: string[] }>();
  const change = useMutation({
    mutationFn: (value: ProjectSkillChange) => api.projectSkillChange(projectId, value),
    onSuccess: (_, value) => {
      if (value.kind === 'add') setPath('');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
  const term = search.trim().toLowerCase();
  const rows = catalog.data?.skills.filter((skill) =>
    skill.name.toLowerCase().includes(term) || skill.description.toLowerCase().includes(term),
  );
  const error = pickerError || (change.isError ? errMsg(change.error) : '');
  const chooseFolder = async () => {
    setPickerError('');
    try {
      const folder = await open({ directory: true, multiple: false });
      if (folder) setPath(folder);
    } catch (error) {
      setPickerError(errMsg(error));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input aria-label="Search skills" placeholder="Search skills" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Button variant="outline" disabled={catalog.isFetching} onClick={() => void catalog.refetch()}>
          <RefreshCw data-icon="inline-start" /> Refresh
        </Button>
      </div>
      {catalog.isPending && <p role="status" className="text-sm text-muted-foreground">Loading skills…</p>}
      {catalog.isError && <p role="alert" className="text-sm text-destructive">Could not load skills. {errMsg(catalog.error)}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {catalog.data && (
        <>
          <p className="text-xs text-muted-foreground">Enabled skills apply to new Claude sessions in this project.</p>
          {rows?.length === 0 && <p className="text-sm text-muted-foreground">{term ? 'No matching skills.' : 'No skills found. Add a folder containing skill directories.'}</p>}
          <ul className="divide-y divide-border">
            {rows?.map((skill) => (
              <li key={JSON.stringify([skill.source_id, skill.directory])} className="flex items-start justify-between gap-4 py-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="break-words text-sm font-medium">{skill.name}</span>
                  {skill.description && <span className="text-xs text-muted-foreground">{skill.description}</span>}
                  <span className="break-all text-xs text-muted-foreground">{skill.path}</span>
                  {skill.reason && <span className="text-xs text-muted-foreground">{skill.reason}</span>}
                </div>
                {skill.native ? <Badge variant="outline">{skill.global ? 'Claude global' : 'Claude project'} · Read only</Badge> : (
                  <Switch
                    aria-label={`Enable ${skill.name}`}
                    checked={skill.enabled}
                    disabled={change.isPending || (!!skill.reason && !skill.enabled)}
                    onCheckedChange={(enabled) => change.mutate({
                      kind: 'set', source_id: skill.source_id, directory: skill.directory, enabled,
                    })}
                  />
                )}
              </li>
            ))}
          </ul>
          <section className="flex flex-col gap-2 border-t border-border pt-4">
            <h3 className="text-sm font-medium">Skill sources</h3>
            <form className="flex flex-wrap gap-2" onSubmit={(event) => {
              event.preventDefault();
              setPickerError('');
              if (path.trim()) change.mutate({ kind: 'add', path });
            }}>
              <Input className="min-w-44 flex-1" aria-label="Skill folder path" placeholder="/path/to/skills" value={path} onChange={(event) => setPath(event.target.value)} />
              <Button type="button" variant="outline" onClick={() => void chooseFolder()}>Browse</Button>
              <Button type="submit" disabled={!path.trim() || change.isPending}>Add folder</Button>
            </form>
            {catalog.data.sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between gap-3 py-1">
                <div className="min-w-0 break-all text-xs text-muted-foreground">
                  {source.id === 'shared' && <span className="mr-2 font-medium text-foreground">Shared library</span>}
                  {source.path} {!source.available && <Badge variant="outline">Unavailable</Badge>}
                </div>
                {source.id !== 'shared' && <Button variant="outline" size="sm" disabled={change.isPending} onClick={() => {
                  const confirmed = catalog.data.enabled.filter((skill) => skill.source_id === source.id).map((skill) => skill.directory);
                  const names = confirmed.map((directory) => catalog.data.skills.find((skill) =>
                    skill.source_id === source.id && skill.directory === directory,
                  )?.name ?? directory);
                  setRemove({ sourceId: source.id, path: source.path, confirmed, names });
                }}>Remove</Button>}
              </div>
            ))}
          </section>
        </>
      )}
      <ConfirmDialog
        open={!!remove}
        onOpenChange={(open) => { if (!open) setRemove(undefined); }}
        title="Remove skill source?"
        description={remove?.names.length ? `This turns off these skills for future sessions: ${remove.names.join(', ')}.` : remove?.path}
        confirmLabel="Remove source"
        destructive
        onConfirm={() => {
          if (!remove) return;
          change.mutate({ kind: 'remove', source_id: remove.sourceId, confirmed: remove.confirmed });
          setRemove(undefined);
        }}
      />
    </div>
  );
}
