// Long conversations use a virtual list; each row subscribes on its own so deltas only re-render the live part.
import { memo, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AlertCircle, ImageIcon, Info, Terminal } from 'lucide-react';
import { useSessionStore, type Item } from '@/stores/useSessionStore';
import { Markdown } from './Markdown';
import { ToolCard } from './ToolCard';

export const COLUMN = 'mx-auto w-full max-w-[768px] px-6';

export function MessageList({ sessionId, working, agentName }: { sessionId: string; working: boolean; agentName: string }) {
  const count = useSessionStore((s) => s.sessions[sessionId]?.items.length ?? 0);
  const hasStream = useSessionStore((s) => !!s.sessions[sessionId]?.streaming);
  const parentRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const total = count + 1; // +1: streaming row / running indicator

  const v = useVirtualizer({
    count: total,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 6,
  });

  // Auto-scroll to the bottom while the user is at the bottom.
  const streamLen = useSessionStore((s) => s.sessions[sessionId]?.streaming?.text.length ?? 0);
  useEffect(() => {
    if (stick.current) v.scrollToIndex(total - 1, { align: 'end' });
  }, [total, streamLen, v]);
  // Rows grow after measuring (diagrams, charts render lazily): keep pinned to the bottom.
  const innerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const inner = innerRef.current;
    const el = parentRef.current;
    if (!inner || !el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (stick.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={parentRef}
      className="min-h-0 flex-1 overflow-y-auto"
      onScroll={(e) => {
        const el = e.currentTarget;
        stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      }}
    >
      <div ref={innerRef} style={{ height: v.getTotalSize(), position: 'relative' }}>
        {v.getVirtualItems().map((row) => (
          <div
            key={row.key}
            data-index={row.index}
            ref={v.measureElement}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${row.start}px)` }}
          >
            <div className={COLUMN}>
              {row.index < count ? (
                <Row sessionId={sessionId} index={row.index} />
              ) : (
                <StreamRow sessionId={sessionId} show={hasStream || working} agentName={agentName} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const Row = memo(function Row({ sessionId, index }: { sessionId: string; index: number }) {
  const item = useSessionStore((s) => s.sessions[sessionId]?.items[index]);
  const prevKind = useSessionStore((s) => (index > 0 ? s.sessions[sessionId]?.items[index - 1]?.kind : undefined));
  if (!item) return null;
  // A reply opens with the first assistant/tool item after a user message; give it extra room.
  const startsReply = (item.kind === 'assistant' || item.kind === 'tool') && (prevKind === undefined || prevKind === 'user');
  return (
    <>
      {startsReply ? <div className="pt-2" /> : null}
      <ItemView item={item} />
    </>
  );
});

function ItemView({ item }: { item: Item }) {
  switch (item.kind) {
    case 'user':
      return (
        <div className="ml-auto flex max-w-[80%] flex-col items-end gap-2 pt-6">
          {item.images ? (
            <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-border pl-2 pr-3 text-xs">
              <span aria-hidden="true" className="flex size-5 items-center justify-center rounded bg-muted text-muted-foreground">
                <ImageIcon className="size-[13px]" />
              </span>
              <span>
                {item.images} {item.images === 1 ? 'image' : 'images'}
              </span>
            </div>
          ) : null}
          <div className="rounded-xl bg-muted px-3 py-2 text-content whitespace-pre-wrap break-words">
            {item.source === 'hc_send' ? (
              <div className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Terminal className="size-3" /> via hc send
              </div>
            ) : null}
            {item.text}
          </div>
        </div>
      );
    case 'assistant':
      return (
        <div className="flex flex-col gap-4 pt-4">
          {item.blocks.map((b, i) =>
            b.kind === 'thinking' ? (
              <details key={i} className="text-[12px] text-muted-foreground">
                <summary className="cursor-pointer select-none">Thinking</summary>
                <div className="mt-1 whitespace-pre-wrap border-l border-border pl-3">{b.text}</div>
              </details>
            ) : (
              <Markdown key={i} text={b.text} />
            ),
          )}
        </div>
      );
    case 'tool':
      return (
        <div className="pt-4">
          <ToolCard item={item} />
        </div>
      );
    case 'turn_end':
      return (
        <div className="flex items-center gap-3 pt-6 text-[11px] text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono">
            {item.interrupted ? 'interrupted · ' : ''}
            {item.tokens != null ? `${item.tokens.toLocaleString('en-US')} tokens` : 'turn complete'}
            {item.cost != null ? ` · $${item.cost.toFixed(4)}` : ''}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      );
    case 'notice':
      return (
        <div className="pt-6">
          <div
            role={item.tone === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-[12px] ${item.tone === 'error' ? 'border-destructive/40 bg-danger-bg text-destructive' : 'border-border bg-background'}`}
          >
            {item.tone === 'error' ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <Info className="mt-0.5 size-4 shrink-0" />}
            <span className="whitespace-pre-wrap break-words">{item.text}</span>
          </div>
        </div>
      );
  }
}

function StreamRow({ sessionId, show, agentName }: { sessionId: string; show: boolean; agentName: string }) {
  const text = useSessionStore((s) => s.sessions[sessionId]?.streaming?.text);
  const lastKind = useSessionStore((s) => {
    const items = s.sessions[sessionId]?.items;
    return items?.[items.length - 1]?.kind;
  });
  if (!show) return <div className="h-6" />;
  return (
    <div className="pb-6">
      {lastKind === undefined || lastKind === 'user' ? <div className="pt-2" /> : null}
      <div className="pt-4">
        {text ? <Markdown text={text} streaming /> : null}
        <span className="hs-caret text-foreground" aria-label={`${agentName} is replying`} />
      </div>
    </div>
  );
}
