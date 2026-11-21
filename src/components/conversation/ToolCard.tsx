// A tool call as a collapsible card; Edit/Write show their diff (FR-013).
import { useState } from 'react';
import { Bot, ChevronDown, FileText, Globe, Pencil, Search, SquareTerminal, Wrench } from 'lucide-react';
import type { Item } from '@/stores/useSessionStore';
import { cn } from '@/lib/utils';
import { Diff, DiffStat, diffStats } from './Diff';
import { toolDiff } from './lineDiff';

type ToolItem = Extract<Item, { kind: 'tool' }>;

const ICON: Record<string, typeof Wrench> = {
  Bash: SquareTerminal,
  Edit: Pencil,
  MultiEdit: Pencil,
  Write: Pencil,
  Read: FileText,
  Grep: Search,
  Glob: Search,
  WebFetch: Globe,
  WebSearch: Globe,
  Task: Bot,
  Agent: Bot,
};

const MONO = new Set(['Bash', 'Read', 'Edit', 'MultiEdit', 'Write', 'Grep', 'Glob', 'WebFetch']);

export function toolSummary(tool: string, input: Record<string, unknown>): string {
  const s = (k: string) => (typeof input[k] === 'string' ? (input[k] as string) : '');
  switch (tool) {
    case 'Bash':
      return s('command');
    case 'Read':
    case 'Edit':
    case 'MultiEdit':
    case 'Write':
      return s('file_path');
    case 'Grep':
    case 'Glob':
      return s('pattern');
    case 'WebFetch':
      return s('url');
    case 'WebSearch':
      return s('query');
    case 'Task':
    case 'Agent':
      return s('description') || s('prompt');
    default:
      return (Object.values(input).find((v) => typeof v === 'string') as string) ?? '';
  }
}

export function ToolCard({ item }: { item: ToolItem }) {
  const diff = toolDiff(item.tool, item.input);
  const [open, setOpen] = useState(!!diff);
  const Icon = ICON[item.tool] ?? Wrench;
  const pending = !item.result;
  const error = item.result?.is_error;
  const summary = toolSummary(item.tool, item.input);
  const agentName = (item.tool === 'Task' || item.tool === 'Agent') && typeof item.input.subagent_type === 'string' ? item.input.subagent_type : null;
  return (
    <div className={cn('overflow-hidden rounded-lg border bg-background', error ? 'border-destructive/40' : 'border-border')}>
      <button type="button" className="flex h-10 w-full items-center gap-2 px-3 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="shrink-0 text-[12px] font-medium">
          {item.tool}
          {agentName ? ` · ${agentName}` : ''}
        </span>
        <span className={cn('min-w-0 flex-1 truncate text-xs text-muted-foreground', MONO.has(item.tool) && 'font-mono')}>{summary}</span>
        {diff ? <DiffStat {...diffStats(diff.lines)} /> : null}
        {item.steps ? <span className="shrink-0 font-mono text-xs text-muted-foreground">{item.steps} steps</span> : null}
        <span
          className={cn('size-1.5 shrink-0 rounded-full', pending ? 'bg-st-working hs-pulse' : error ? 'bg-st-error' : 'bg-st-done')}
          role="img"
          aria-label={pending ? 'running' : error ? 'error' : 'done'}
        />
        <ChevronDown className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform duration-150', open && 'rotate-180')} />
      </button>
      {open ? (
        <div className="border-t border-border">
          {diff ? (
            <Diff lines={diff.lines} bare />
          ) : (
            <pre className="m-0 max-h-48 overflow-auto bg-code px-3 py-2 font-mono text-content-code text-muted-foreground whitespace-pre-wrap">{JSON.stringify(item.input, null, 2)}</pre>
          )}
          {item.result ? (
            <pre
              className={cn(
                'm-0 max-h-64 overflow-auto border-t border-border px-3 py-2 font-mono text-content-code whitespace-pre-wrap',
                error ? 'bg-danger-bg text-destructive' : 'text-muted-foreground',
              )}
            >
              {item.result.content.length > 8000 ? item.result.content.slice(0, 8000) + '\n…' : item.result.content || '(no output)'}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
