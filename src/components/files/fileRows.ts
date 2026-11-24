export const fileRow = 'justify-start gap-1.5 border border-transparent font-normal text-foreground hover:bg-accent/60';
export const selectedFileRow = 'border-border bg-accent font-medium text-accent-foreground hover:bg-accent';
export const filePanelHeader = 'flex h-11 shrink-0 items-center gap-2 border-b border-border px-3';

const conflictStatuses = new Set(['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU']);
const gitStatusKinds = [
  ['D', 'Deleted', 'text-diff-del-fg'],
  ['R', 'Renamed', 'text-git-rename-fg'],
  ['C', 'Copied', 'text-git-rename-fg'],
  ['A', 'Added', 'text-diff-add-fg'],
  ['M', 'Modified', 'text-warn-fg'],
  ['T', 'Type changed', 'text-muted-foreground'],
] as const;

export function gitStatusPresentation(status: string) {
  if (status === '??') {
    return { marker: 'U', label: 'Untracked', className: 'text-diff-add-fg' };
  }
  if (conflictStatuses.has(status)) {
    return { marker: status, label: 'Conflict', className: 'text-diff-del-fg' };
  }
  const kinds = gitStatusKinds.filter(([code]) => status.includes(code));
  return {
    marker: status,
    label: kinds.map(([, label]) => label).join(', ') || 'Unknown status',
    className: kinds[0]?.[2] ?? 'text-muted-foreground',
  };
}

export const gitStatusMarker = 'min-w-[2ch] shrink-0 text-center text-xs font-medium tabular-nums';
