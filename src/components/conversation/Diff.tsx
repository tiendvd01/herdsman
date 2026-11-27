import { usePathLabel } from '@/lib/homePath';
import { useEffect, useState } from 'react';
import { highlightPatch } from './highlightPatch';
import { TruncatedText } from '@/components/ui/truncated-text';
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
export function Diff({ file, lines, maxHeight = 360, bare, original }: {
  file?: string; lines: DiffLine[]; maxHeight?: number; bare?: boolean;
  original?: string;
}) {
  const pathLabel = usePathLabel();
  const { add, del } = diffStats(lines);
  const [highlight, setHighlight] = useState<{
    lines: DiffLine[];
    file: string;
    original?: string;
    tokens: Awaited<ReturnType<typeof highlightPatch>>;
  }>();
  useEffect(() => {
    if (!file) return;
    let active = true;
    void highlightPatch(lines, file, original).then((tokens) => {
      if (active) setHighlight({ lines, file, original, tokens });
    }).catch(() => {});
    return () => { active = false; };
  }, [lines, file, original]);
  const tokens = highlight?.lines === lines && highlight.file === file && highlight.original === original
    ? highlight.tokens : undefined;
  return (
    <div className={cn('overflow-hidden', !bare && 'rounded-md border border-border')} data-testid="diff">
      {file && !bare ? (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-1.5 font-mono text-xs text-muted-foreground">
          <TruncatedText className="truncate">{pathLabel(file)}</TruncatedText>
          <DiffStat add={add} del={del} />
        </div>
      ) : null}
      <pre className="m-0 overflow-auto bg-code py-1.5 font-mono text-content-code leading-[1.7]" style={{ maxHeight }}>
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              'min-w-max px-3 whitespace-pre text-foreground',
              l.kind === 'add' && 'bg-diff-add',
              l.kind === 'del' && 'bg-diff-del',
            )}
          >
            <span className={cn('inline-block w-[1.5ch] select-none', l.kind === 'add' && 'text-diff-add-fg', l.kind === 'del' && 'text-diff-del-fg')}>{l.kind === 'add' ? '+' : l.kind === 'del' ? '−' : ' '}</span>
            {tokens?.get(i)?.map((token, position) => (
              <span key={position} className={token.classes || undefined}>{token.text}</span>
            )) ?? (l.text || ' ')}
          </div>
        ))}
      </pre>
    </div>
  );
}
