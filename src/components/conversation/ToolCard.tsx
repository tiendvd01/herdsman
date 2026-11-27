import { FileLink, ToolOutputLinks, type OpenFile } from './fileLinks';
import { usePathLabel } from '@/lib/homePath';
import { TruncatedText } from '@/components/ui/truncated-text';
// A tool call as a collapsible card; Edit/Write show their diff (FR-013).
import { useMemo, useState, type ReactNode } from 'react';
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

export function toolSummary(tool: string, input: Record<string, unknown>, pathLabel = (path: string) => path): string {
  const s = (k: string) => (typeof input[k] === 'string' ? (input[k] as string) : '');
  switch (tool) {
    case 'Bash':
      return s('command');
    case 'Read':
    case 'Edit':
    case 'MultiEdit':
    case 'Write':
      return pathLabel(s('file_path'));
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

const SHELL_LABELS = {
  running: 'Running',
  success: 'Succeeded',
  failed: 'Failed',
  interrupted: 'Interrupted',
  unknown: 'Status unknown',
};

export function ToolCard({ item, disconnected = false, action, openFile, sessionId }: {
  item: ToolItem;
  disconnected?: boolean;
  action?: ReactNode;
  openFile?: OpenFile;
  sessionId?: string;
}) {
  const pathLabel = usePathLabel();
  const diff = useMemo(() => toolDiff(item.tool, item.input), [item.tool, item.input]);
  const [open, setOpen] = useState(!!diff);
  const Icon = ICON[item.tool] ?? Wrench;
  const shell = item.shell;
  const shellStatus = disconnected && shell?.status === 'running' ? 'unknown' : shell?.status;
  const permission = shell?.permission;
  const label = shellStatus ? SHELL_LABELS[shellStatus]
    : permission === 'waiting' ? 'Awaiting approval'
    : permission === 'denied' ? 'Denied'
    : permission === 'cancelled' ? 'Cancelled'
    : item.result ? (item.result.is_error ? 'Failed' : 'Succeeded')
    : disconnected ? 'Status unknown' : 'Pending';
  const pending = shell ? shellStatus === 'running' : !item.result;
  const error = shellStatus ? shellStatus === 'failed' : item.result?.is_error;
  const finalOutput = shell && !shell.background && !pending ? item.result?.content : undefined;
  const liveOutput = shell?.output && !finalOutput?.includes(shell.output.trimEnd()) ? shell.output : undefined;
  const ended = !!finalOutput || (!pending && !!item.result) ||
    shellStatus === 'success' || shellStatus === 'failed' || shellStatus === 'interrupted';
  const emptyOutput = permission === 'denied' || permission === 'cancelled' ? 'Command did not run.'
    : ended ? '(no output)'
    : shellStatus === 'unknown' ? 'No output recorded.' : 'Waiting for output…';
  const summary = toolSummary(item.tool, item.input, pathLabel);
  const command = item.tool === 'Bash' ? summary : '';
  const agentName = (item.tool === 'Task' || item.tool === 'Agent') && typeof item.input.subagent_type === 'string' ? item.input.subagent_type : null;
  const path = item.input.file_path ?? diff?.file;
  const openPath = openFile && (item.tool === 'Read' || item.tool === 'Write' || item.tool === 'Edit' || item.tool === 'MultiEdit') && !diff?.targets?.length &&
    typeof path === 'string' && path.trim()
    ? () => openFile(path)
    : undefined;
  const output = item.result?.content ?? '';
  const resultText = output.length > 8000 ? output.slice(0, 8000) + (item.tool === 'Bash' ? '\n… (output truncated)' : '\n…') : output || '(no output)';
  const linkedOutput = (text: string) => sessionId && openFile
    ? <ToolOutputLinks text={text} tool={item.tool} sessionId={sessionId} open={openFile} />
    : text;
  const toolLabel = (
    <>
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="shrink-0 text-[12px] font-medium">
        {item.tool}
        {agentName ? ` · ${agentName}` : ''}
      </span>
    </>
  );
  return (
    <div className={cn('overflow-hidden rounded-lg border bg-background', error ? 'border-destructive/40' : 'border-border')}>
      <div className="flex items-center">
        {openPath ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 pl-3">
            {toolLabel}
            <button type="button" role="link" onClick={openPath} className="min-w-0 cursor-pointer text-left font-mono text-xs text-primary underline underline-offset-2 focus-visible:outline-ring">
              <TruncatedText className="block truncate">{summary}</TruncatedText>
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className={cn('flex h-10 min-w-0 items-center gap-2 px-3 text-left', openPath ? 'shrink-0' : 'flex-1')}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={openPath ? `${open ? 'Collapse' : 'Expand'} ${item.tool} details` : undefined}
        >
          {openPath ? null : (
            <>
              {toolLabel}
              {item.tool === 'Bash' ? (
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{summary}</span>
              ) : (
                <TruncatedText className={cn('min-w-0 flex-1 truncate text-xs text-muted-foreground', MONO.has(item.tool) && 'font-mono')}>{summary}</TruncatedText>
              )}
            </>
          )}
          {diff ? <DiffStat {...diffStats(diff.lines)} /> : null}
          {item.steps ? <span className="shrink-0 font-mono text-xs text-muted-foreground">{item.steps} steps</span> : null}
          <span
            className={cn('size-1.5 shrink-0 rounded-full', pending ? 'bg-st-working hs-pulse' : error ? 'bg-st-error' : shell && label !== 'Succeeded' ? 'bg-muted-foreground' : 'bg-st-done')}
            role={shell ? undefined : "img"}
            aria-hidden={shell ? true : undefined}
            aria-label={shell ? undefined : pending ? 'running' : error ? 'error' : 'done'}
          />
          {shell ? <span className="shrink-0 text-xs text-muted-foreground">{label}</span> : null}
          <ChevronDown className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform duration-150', open && 'rotate-180')} />
        </button>
        {action}
      </div>
      {open ? (
        <div className="border-t border-border">
          {diff ? (
            <>
              {sessionId && openFile && diff.targets?.length ? (
                <ul className="px-3 py-2 font-mono text-xs whitespace-pre-wrap break-all">
                  {diff.targets.map(({ path, deleted }) => (
                    <li key={JSON.stringify([path, deleted])}>
                      {deleted ? pathLabel(path) : <FileLink sessionId={sessionId} path={path} open={openFile}>{path}</FileLink>}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Diff file={diff.file} lines={diff.lines} bare />
            </>
          ) : (
            <pre
              tabIndex={command ? 0 : undefined}
              aria-label={command ? 'Shell command' : undefined}
              className={cn(
                'm-0 max-h-48 overflow-auto whitespace-pre-wrap bg-code px-3 py-2 font-mono text-content-code',
                command ? 'break-words text-foreground' : 'text-muted-foreground',
              )}
            >
              {command || JSON.stringify(item.input, null, 2)}
            </pre>
          )}
          {shell ? (
            <div className="border-t border-border">
              {shell.unavailable && !finalOutput ? <p className="px-3 pt-2 text-xs text-muted-foreground">Live output unavailable.</p> : null}
              {liveOutput && shell.truncated ? <p className="px-3 pt-2 text-xs text-muted-foreground">Earlier output omitted.</p> : null}
              {liveOutput ? <pre tabIndex={0} aria-label="Live shell output" className="m-0 max-h-64 overflow-auto whitespace-pre-wrap break-words px-3 py-2 font-mono text-content-code">{liveOutput}</pre> : null}
              {finalOutput || !liveOutput ? (
                <pre
                  tabIndex={0}
                  aria-label="Shell output"
                  className={cn('m-0 max-h-64 overflow-auto whitespace-pre-wrap break-words px-3 py-2 font-mono text-content-code', error && 'bg-danger-bg text-destructive')}
                >
                  {error && finalOutput ? linkedOutput(finalOutput) : finalOutput || emptyOutput}
                </pre>
              ) : null}
            </div>
          ) : item.result ? (
            <pre
              className={cn(
                'm-0 max-h-64 overflow-auto border-t border-border px-3 py-2 font-mono text-content-code whitespace-pre-wrap',
                error ? 'bg-danger-bg text-destructive' : 'text-muted-foreground',
              )}
            >
              {item.tool === 'Grep' || item.tool === 'Glob' || (item.tool === 'Bash' && error)
                ? linkedOutput(resultText)
                : resultText}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
