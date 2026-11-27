import { fileRow, gitStatusMarker, gitStatusPresentation, selectedFileRow } from './fileRows';
import { materialFileIcon } from './materialFileIcons';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useContext, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import { AlertCircle, ChevronRight, Folder, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { TruncatedText } from '@/components/ui/truncated-text';
import { api, errMsg, type ProjectFileEntry } from '@/lib/api';
import { HomeDirectory } from '@/lib/homePath';
import { qk } from '@/lib/queries';
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
  const [searchFocused, setSearchFocused] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);
  const home = useContext(HomeDirectory);
  const entered = searchText.trimStart();
  const input = home?.startsWith('/') && entered.startsWith('~/')
    ? home.replace(/\/+$/, '') + entered.slice(1)
    : entered;
  const absolute = input.startsWith('/');
  const query = absolute ? input : input.trimEnd();
  const searching = query !== '';
  const searchReady = searching && query === searchQuery;
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(query), 150);
    return () => window.clearTimeout(timer);
  }, [query]);
  const search = useQuery({
    queryKey: ['projectFilesSearch', project.id, searchQuery],
    queryFn: () => searchQuery.startsWith('/')
      ? api.absoluteFilesSearch(searchQuery)
      : api.projectFilesSearch(project.id, searchQuery),
    enabled: searchReady,
    retry: false,
  });
  const active = useFileStore((state) => state.active[project.id]);
  const activePath = useFileStore((state) => state.tabs.find((file) => file.id === active)?.path);
  const { data: changes } = useQuery({
    queryKey: qk.projectFilesChanged(project.id),
    queryFn: () => api.projectFilesChanged(project.id),
    refetchInterval: 5000,
  });
  const statuses = useMemo(() => new Map(changes?.map(({ path, status }) => [path, status])), [changes]);
  const expandedPaths = new Set(expanded);
  const paths = ['', ...expanded];
  const queries = useQueries({
    queries: paths.map((path) => ({
      queryKey: ['projectFiles', project.id, path],
      queryFn: () => api.projectFiles(project.id, path),
      refetchOnMount: 'always' as const,
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
  if (!searching) {
    append('', 0);
  } else if (searchReady && search.isSuccess) {
    for (const entry of search.data) rows.push({ ...entry, depth: 0, parent: '' });
  }
  const host = useRef<HTMLDivElement>(null);
  const focusPath = searching ? searchFocused : focused;
  const focusRow = searching ? setSearchFocused : setFocused;
  const focusIndex = Math.max(0, rows.findIndex((row) => row.path === focusPath));
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
    focusRow(row.path);
    if (row.directory) {
      toggle(row);
      return;
    }
    void useFileStore.getState().open(project, tabPath(row.path), row.name);
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
    focusRow(rows[next].path);
    list.scrollToIndex(next);
  }

  function clearSearch() {
    setSearchText('');
    setSearchQuery('');
    setSearchFocused('');
    searchInput.current?.focus();
  }

  function tabPath(path: string) {
    if (!path.startsWith('/')) return path;
    const prefix = `${project.path.replace(/\/+$/, '')}/`;
    const relative = path.startsWith(prefix) ? path.slice(prefix.length) : '';
    const inProject = relative && relative.split('/').every((part) => part && part !== '.' && part !== '..');
    return inProject ? relative : path;
  }

  const root = queries[0];
  return (
    <>
      <div className="mb-2 flex shrink-0 items-center gap-1">
        <Input ref={searchInput} className="min-w-0" aria-label="Search files" placeholder="Search files…" value={searchText}
          onChange={(event) => {
            setSearchText(event.target.value);
            setSearchFocused('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && searchText) {
              event.preventDefault();
              event.stopPropagation();
              clearSearch();
            } else if (event.key === 'Enter' && absolute && rows.length > 0 && !event.nativeEvent.isComposing) {
              event.preventDefault();
              select(rows[0]);
            }
          }} />
        {searchText && <Button type="button" variant="ghost" size="icon-sm" aria-label="Clear file search" onClick={clearSearch}>
          <X data-icon="inline-start" />
        </Button>}
      </div>
      {searching ? (
        <>
          {!searchReady || search.isPending || (search.isError && search.isFetching) ? (
            <p role="status" className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Spinner label="Searching" />Searching files…
            </p>
          ) : search.isError ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription className="flex flex-col items-start gap-2">
                {errMsg(search.error)}
                <Button type="button" size="sm" variant="outline" onClick={() => void search.refetch()}>Retry search</Button>
              </AlertDescription>
            </Alert>
          ) : rows.length === 0 ? (
            <Empty role="status"><EmptyHeader><EmptyMedia><Search /></EmptyMedia><EmptyDescription>No matching files.</EmptyDescription></EmptyHeader></Empty>
          ) : null}
        </>
      ) : (
        <>
          {root.isPending ? <p role="status" className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground"><Spinner className="text-muted-foreground" label="Loading" />Loading files…</p> : null}
          {root.error ? <Alert variant="destructive"><AlertCircle /><AlertDescription>{errMsg(root.error)}</AlertDescription></Alert> : null}
          {root.data?.length === 0 ? <Empty><EmptyHeader><EmptyMedia><Folder /></EmptyMedia><EmptyDescription>This project has no files.</EmptyDescription></EmptyHeader></Empty> : null}
        </>
      )}
      {rows.length > 0 ? (
        <div ref={host} role="tree" aria-label={searching ? 'File search results' : 'Project files'} aria-activedescendant={`file-tree-${focusIndex}`}
          tabIndex={0} onKeyDown={onKeyDown} className="group/tree min-h-0 flex-1 overflow-auto rounded-md outline-none">
          <div style={{ height: list.getTotalSize() }} className="relative">
            {list.getVirtualItems().map(({ index, start, size }) => {
              const row = rows[index];
              const open = expandedPaths.has(row.path);
              const query = byPath.get(row.path);
              const ignored = !searching && row.ignored;
              const status = row.directory || ignored ? undefined : statuses.get(row.path);
              const change = status ? gitStatusPresentation(status) : undefined;
              const directoryPath = searching ? row.path.slice(0, row.path.lastIndexOf('/') + 1) : '';
              const rowLabel = searching ? row.path : row.name;
              const selected = !row.directory && activePath === tabPath(row.path);
              return (
                <Button variant="ghost" size="xs" tabIndex={-1} key={row.path} id={`file-tree-${index}`} role="treeitem"
                  aria-level={row.depth + 1} aria-expanded={row.directory ? open : undefined}
                  aria-selected={row.directory ? undefined : selected}
                  aria-label={ignored ? `${rowLabel}, Git ignored` : change ? `${rowLabel}, Git status: ${change.label}` : searching ? rowLabel : undefined}
                  onClick={() => { host.current?.focus({ preventScroll: true }); select(row); }}
                  style={{ top: start, height: size - 2, paddingLeft: 8 + row.depth * 14 }}
                  className={cn('absolute inset-x-0', fileRow,
                    selected && selectedFileRow,
                    focusIndex === index && 'group-focus-visible/tree:border-ring')}>
                  {row.directory ? <ChevronRight className={cn('shrink-0 text-muted-foreground', open && 'rotate-90')} /> : !searching && <span className="size-4 shrink-0" />}
                  <img src={materialFileIcon(row.name, row.directory)} alt="" data-icon="inline-start" className="size-4 shrink-0" />
                  <TruncatedText className={cn('min-w-0 truncate text-left', directoryPath ? 'max-w-[55%]' : 'flex-1', ignored && 'text-git-ignored-fg', change?.className)}>{row.name}</TruncatedText>
                  {directoryPath && <TruncatedText className="min-w-0 flex-1 truncate text-left text-muted-foreground">{directoryPath}</TruncatedText>}
                  {change ? <span aria-hidden="true" className={cn(gitStatusMarker, change.className)}>{change.marker}</span> : null}
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
