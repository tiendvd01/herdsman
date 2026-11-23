import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRef, useState, type KeyboardEvent } from 'react';
import { useQueries } from '@tanstack/react-query';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import { AlertCircle, ChevronRight, FileCode2, FileImage, FileText, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { TruncatedText } from '@/components/ui/truncated-text';
import { api, errMsg, type ProjectFileEntry } from '@/lib/api';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useFileStore } from '@/stores/useFileStore';

interface Row extends ProjectFileEntry {
  depth: number;
  parent: string;
}

export function FileTree({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [focused, setFocused] = useState('');
  const active = useFileStore((state) => state.active[project.id]);
  const activePath = useFileStore((state) => state.tabs.find((file) => file.id === active)?.path);
  const expandedPaths = new Set(expanded);
  const paths = ['', ...expanded];
  const queries = useQueries({
    queries: paths.map((path) => ({
      queryKey: ['projectFiles', project.id, path],
      queryFn: () => api.projectFiles(project.id, path),
      retry: false,
    })),
  });
  const byPath = new Map(paths.map((path, index) => [path, queries[index]]));
  const rows: Row[] = [];
  function append(parent: string, depth: number) {
    for (const entry of byPath.get(parent)?.data ?? []) {
      rows.push({ ...entry, depth, parent });
      if (entry.directory && expandedPaths.has(entry.path)) append(entry.path, depth + 1);
    }
  }
  append('', 0);
  const host = useRef<HTMLDivElement>(null);
  const focusIndex = Math.max(0, rows.findIndex((row) => row.path === focused));
  const list = useVirtualizer({
    count: rows.length,
    getScrollElement: () => host.current,
    estimateSize: () => 32,
    getItemKey: (index) => rows[index]?.path ?? index,
    overscan: 8,
    initialRect: { width: 240, height: 288 },
    rangeExtractor: (range) => [...new Set([...defaultRangeExtractor(range), focusIndex])]
      .filter((index) => index < rows.length).sort((a, b) => a - b),
  });

  function toggle(row: Row) {
    setExpanded((prev) => prev.includes(row.path)
      ? prev.filter((path) => path !== row.path && !path.startsWith(row.path + '/'))
      : [...prev, row.path]);
  }

  function select(row: Row) {
    setFocused(row.path);
    if (row.directory) toggle(row);
    else void useFileStore.getState().open(project, row.path, row.name);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const row = rows[focusIndex];
    if (!row) return;
    let next = focusIndex;
    switch (event.key) {
      case 'ArrowDown': next++; break;
      case 'ArrowUp': next--; break;
      case 'Home': next = 0; break;
      case 'End': next = rows.length - 1; break;
      case 'ArrowRight':
        if (row.directory && !expandedPaths.has(row.path)) toggle(row);
        else if (rows[focusIndex + 1]?.parent === row.path) next++;
        break;
      case 'ArrowLeft':
        if (expandedPaths.has(row.path)) toggle(row);
        else if (row.parent) next = rows.findIndex((item) => item.path === row.parent);
        break;
      case 'Enter':
      case ' ': select(row); break;
      default: return;
    }
    event.preventDefault();
    next = Math.min(rows.length - 1, Math.max(0, next));
    setFocused(rows[next].path);
    list.scrollToIndex(next);
  }

  const root = queries[0];
  return (
    <>
      {root.isPending ? <p role="status" className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground"><Spinner className="text-muted-foreground" label="Loading" />Loading files…</p> : null}
      {root.error ? <Alert variant="destructive"><AlertCircle /><AlertDescription>{errMsg(root.error)}</AlertDescription></Alert> : null}
      {root.data?.length === 0 ? <Empty><EmptyHeader><EmptyMedia><Folder /></EmptyMedia><EmptyDescription>This project has no files.</EmptyDescription></EmptyHeader></Empty> : null}
      {rows.length > 0 ? (
        <div ref={host} role="tree" aria-label="Project files" aria-activedescendant={`file-tree-${focusIndex}`}
          tabIndex={0} onKeyDown={onKeyDown} className="group/tree min-h-0 flex-1 overflow-auto rounded-md outline-none">
          <div style={{ height: list.getTotalSize() }} className="relative">
            {list.getVirtualItems().map(({ index, start, size }) => {
              const row = rows[index];
              const open = expandedPaths.has(row.path);
              const query = byPath.get(row.path);
              const isCode = /\.(ts|js|tsx|jsx|rs|py|css|html|json|toml|ya?ml|sh|go|java)$/i.test(row.name);
              const isImage = /\.(png|jpe?g|svg|gif|webp)$/i.test(row.name);
              const Icon = row.directory ? open ? FolderOpen : Folder : isCode ? FileCode2 : isImage ? FileImage : FileText;
              return (
                <Button variant="ghost" size="xs" tabIndex={-1} key={row.path} id={`file-tree-${index}`} role="treeitem"
                  aria-level={row.depth + 1} aria-expanded={row.directory ? open : undefined}
                  aria-selected={row.directory ? undefined : activePath === row.path}
                  onClick={() => { host.current?.focus({ preventScroll: true }); select(row); }}
                  style={{ top: start, height: size - 2, paddingLeft: 8 + row.depth * 14 }}
                  className={cn('absolute inset-x-0 justify-start gap-1.5 border border-transparent font-normal text-foreground hover:bg-accent/60',
                    activePath === row.path && 'border-border bg-accent font-medium text-accent-foreground hover:bg-accent',
                    focusIndex === index && 'group-focus-visible/tree:border-ring')}>
                  {row.directory ? <ChevronRight className={cn('shrink-0 text-muted-foreground', open && 'rotate-90')} /> : <span className="size-4 shrink-0" />}
                  <Icon data-icon="inline-start" />
                  <TruncatedText className="min-w-0 flex-1 truncate text-left">{row.name}</TruncatedText>
                  {query?.isPending ? <Spinner label="Loading folder" className="text-muted-foreground" /> : null}
                  {query?.error ? <span role="img" aria-label={errMsg(query.error)} title={errMsg(query.error)} className="text-destructive">!</span> : null}
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}
