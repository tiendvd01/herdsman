import { usePathLabel } from '@/lib/homePath';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDiff } from 'lucide-react';
import { Diff, DiffStat, diffStats } from '@/components/conversation/Diff';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { TruncatedText } from '@/components/ui/truncated-text';
import { filePanelHeader } from './fileRows';
import type { DiffLine } from '@/components/conversation/lineDiff';
import { api, errMsg } from '@/lib/api';
import type { DiffTab } from '@/stores/useFileStore';

function parsePatch(patch: string): DiffLine[] {
  if (!patch) return [];
  const rows = patch.split('\n');
  if (rows[rows.length - 1] === '') rows.pop();
  let hunk: number | undefined = patch.startsWith('diff --git ') ? undefined : 0;
  return rows.flatMap((row, index): DiffLine[] => {
    if (row.startsWith('diff --git ')) {
      hunk = undefined;
      return [];
    }
    if (row.startsWith('@@')) {
      hunk = index + 1;
      return [{ kind: 'ctx', text: row }];
    }
    if (hunk === undefined) {
      return /^(index |--- |\+\+\+ )/.test(row) ? [] : [{ kind: 'ctx', text: row }];
    }
    if (row.startsWith('+')) return [{ kind: 'add', text: row.slice(1), hunk }];
    if (row.startsWith('-')) return [{ kind: 'del', text: row.slice(1), hunk }];
    if (row.startsWith(' ')) return [{ kind: 'ctx', text: row.slice(1), hunk }];
    return [{ kind: 'ctx', text: row }];
  });
}

export function FileChanges({ tab }: { tab: DiffTab }) {
  const pathLabel = usePathLabel();
  const { data, isPending, isError, error } = useQuery({
    queryKey: tab.commit ? ['commit-diff', tab.workspaceId, tab.commit.id, tab.path] : ['diff', tab.workspaceId, tab.path],
    queryFn: () => tab.commit
      ? api.commitFileDiff(tab.workspaceId, tab.commit.id, tab.path, tab.commit.original)
      : api.fileDiff(tab.workspaceId, tab.path),
  });
  const lines = useMemo(() => parsePatch(data ?? ''), [data]);
  const directory = tab.path.slice(0, tab.path.lastIndexOf('/') + 1);
  return (
    <section aria-label="File changes" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className={filePanelHeader} title={pathLabel(tab.path)}>
        <FileDiff className="size-4 shrink-0 text-muted-foreground" />
        <h2 className="min-w-0 text-xs font-medium"><TruncatedText className="block truncate">{tab.name}</TruncatedText></h2>
        {directory ? <TruncatedText className="min-w-0 truncate text-xs text-muted-foreground">{pathLabel(directory)}</TruncatedText> : null}
        {tab.commit && <code className="shrink-0 text-xs text-muted-foreground" title={tab.commit.id}>{tab.commit.shortId}</code>}
        <span className="flex-1" />
        {lines.length > 0 && !isError ? <DiffStat {...diffStats(lines)} /> : null}
      </header>
      <div className="min-h-0 flex-1 overflow-auto">
        {isPending ? <p role="status" className="flex items-center gap-2 p-3 text-xs text-muted-foreground"><Spinner />Loading changes…</p>
          : isError ? <Alert variant="destructive"><AlertDescription>{errMsg(error)}</AlertDescription></Alert>
          : lines.length === 0 ? <Empty><EmptyHeader><EmptyDescription>No changes to display.</EmptyDescription></EmptyHeader></Empty>
          : <Diff file={tab.path} original={tab.commit?.original} lines={lines} maxHeight={100000} bare />}
      </div>
    </section>
  );
}
