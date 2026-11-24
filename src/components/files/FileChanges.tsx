import { useQuery } from '@tanstack/react-query';
import { FileDiff } from 'lucide-react';
import { Diff, DiffStat, diffStats } from '@/components/conversation/Diff';
import type { DiffLine } from '@/components/conversation/lineDiff';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { TruncatedText } from '@/components/ui/truncated-text';
import { filePanelHeader } from './fileRows';
import { api, errMsg } from '@/lib/api';
import type { DiffTab } from '@/stores/useFileStore';

function parsePatch(patch: string): DiffLine[] {
  if (!patch) return [];
  const rows = patch.split('\n');
  if (rows[rows.length - 1] === '') rows.pop();
  let inHunk = !patch.startsWith('diff --git ');
  return rows.flatMap((row): DiffLine[] => {
    if (row.startsWith('diff --git ')) {
      inHunk = false;
      return [];
    }
    if (row.startsWith('@@')) {
      inHunk = true;
      return [{ kind: 'ctx', text: row }];
    }
    if (!inHunk) {
      return /^(index |--- |\+\+\+ )/.test(row) ? [] : [{ kind: 'ctx', text: row }];
    }
    if (row.startsWith('+')) return [{ kind: 'add', text: row.slice(1) }];
    if (row.startsWith('-')) return [{ kind: 'del', text: row.slice(1) }];
    return [{ kind: 'ctx', text: row.startsWith(' ') ? row.slice(1) : row }];
  });
}

export function FileChanges({ tab }: { tab: DiffTab }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['diff', tab.workspaceId, tab.path],
    queryFn: () => api.fileDiff(tab.workspaceId, tab.path),
  });
  const lines = parsePatch(data ?? '');
  const directory = tab.path.slice(0, tab.path.lastIndexOf('/') + 1);
  return (
    <section aria-label="File changes" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className={filePanelHeader} title={tab.path}>
        <FileDiff className="size-4 shrink-0 text-muted-foreground" />
        <h2 className="min-w-0 text-xs font-medium"><TruncatedText className="block truncate">{tab.name}</TruncatedText></h2>
        {directory ? <TruncatedText className="min-w-0 truncate text-xs text-muted-foreground">{directory}</TruncatedText> : null}
        <span className="flex-1" />
        {lines.length > 0 && !isError ? <DiffStat {...diffStats(lines)} /> : null}
      </header>
      <div className="min-h-0 flex-1 overflow-auto">
        {isPending ? <p role="status" className="flex items-center gap-2 p-3 text-xs text-muted-foreground"><Spinner />Loading changes…</p>
          : isError ? <Alert variant="destructive"><AlertDescription>{errMsg(error)}</AlertDescription></Alert>
          : lines.length === 0 ? <Empty><EmptyHeader><EmptyDescription>No changes to display.</EmptyDescription></EmptyHeader></Empty>
          : <Diff lines={lines} maxHeight={100000} bare />}
      </div>
    </section>
  );
}
