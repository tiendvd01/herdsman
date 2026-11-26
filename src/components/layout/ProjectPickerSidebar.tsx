import { SidebarLayout } from './SidebarLayout';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription } from '@/components/ui/empty';
import type { Project } from '@/lib/types';

interface Props {
  projects: Project[];
  selectedId?: string;
  allProjectsId?: string;
  pending: boolean;
  onRetry?: () => void;
  onSelect: (id: string) => void;
}

export function ProjectPickerSidebar({ projects, selectedId, allProjectsId, pending, onRetry, onSelect }: Props) {
  const names = new Set<string>();
  const duplicates = new Set<string>();
  for (const { name } of projects) {
    if (names.has(name)) duplicates.add(name);
    names.add(name);
  }

  return (
    <SidebarLayout className="w-52">
      <div className="px-2 py-2 text-sm font-medium text-muted-foreground">Projects</div>
      <nav aria-label="Select project" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pb-2 -mx-2 px-2">
        {pending && <p role="status" className="px-2 text-xs text-muted-foreground">Loading projects…</p>}
        {onRetry && (
          <div className="flex shrink-0 flex-col items-start gap-2 px-2">
            <p role="alert" className="text-xs">Could not load projects.</p>
            <Button variant="outline" size="xs" onClick={onRetry}>Retry</Button>
          </div>
        )}
        {!pending && !onRetry && projects.length === 0 && (
          <Empty><EmptyDescription>No projects yet.</EmptyDescription></Empty>
        )}
        {allProjectsId !== undefined && projects.length > 0 && (
          <Button size="sm" variant={selectedId === allProjectsId ? 'secondary' : 'ghost'}
            aria-current={selectedId === allProjectsId ? 'true' : undefined}
            className="shrink-0 justify-start" onClick={() => onSelect(allProjectsId)}>
            All projects
          </Button>
        )}
        {projects.map(({ id, name, path }) => (
          <Button key={id} size="sm" variant={selectedId === id ? 'secondary' : 'ghost'}
            aria-current={selectedId === id ? 'true' : undefined} title={path}
            className="h-auto min-h-8 shrink-0 justify-start py-1 text-left" onClick={() => onSelect(id)}>
            <span className="min-w-0">
              <span className="block truncate">{name}</span>
              {duplicates.has(name) && <span className="block whitespace-normal break-all text-xs text-muted-foreground">{path}</span>}
            </span>
          </Button>
        ))}
      </nav>
    </SidebarLayout>
  );
}
