import { cn } from '@/lib/utils';
import type { DiffLine } from './lineDiff';

export function diffStats(lines: DiffLine[]) {
  return { add: lines.filter((l) => l.kind === 'add').length, del: lines.filter((l) => l.kind === 'del').length };
}

export function DiffStat({ add, del, className }: { add: number; del: number; className?: string }) {
  return (
    <span className={cn('shrink-0 font-mono text-xs', className)}>
      <span className="text-diff-add-fg">+{add}</span> <span className="text-diff-del-fg">−{del}</span>
    </span>
  );
}

/** Line diff. `bare` drops the outer border/header so it can sit inside a card. */
export function Diff({ file, lines, maxHeight = 360, bare }: { file?: string; lines: DiffLine[]; maxHeight?: number; bare?: boolean }) {
  const { add, del } = diffStats(lines);
  return (
    <div className={cn('overflow-hidden', !bare && 'rounded-md border border-border')} data-testid="diff">
      {file && !bare ? (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-1.5 font-mono text-xs text-muted-foreground">
          <span className="truncate">{file}</span>
          <DiffStat add={add} del={del} />
        </div>
      ) : null}
      <pre className="m-0 overflow-auto bg-code py-1.5 font-mono text-content-code leading-[1.7]" style={{ maxHeight }}>
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              'min-w-max px-3 whitespace-pre',
              l.kind === 'add' && 'bg-diff-add text-diff-add-fg',
              l.kind === 'del' && 'bg-diff-del text-diff-del-fg',
              l.kind === 'ctx' && 'text-muted-foreground',
            )}
          >
            <span className="inline-block w-3.5 select-none">{l.kind === 'add' ? '+' : l.kind === 'del' ? '−' : ' '}</span>
            {l.text || ' '}
          </div>
        ))}
      </pre>
    </div>
  );
}
