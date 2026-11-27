// Long conversations use a virtual list; each row subscribes on its own so deltas only re-render the live part.
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { skipToken, useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AlertCircle, Info, Terminal } from 'lucide-react';
import { useSessionStore, type Item } from '@/stores/useSessionStore';
import { api, errMsg } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { useFileStore } from '@/stores/useFileStore';
import type { ChatAttachment } from '@/lib/types';
import { ImagePreview, ImageThumbnail, UnavailableImage, type ImageSelection } from './ImagePreview';
import { Markdown } from './Markdown';
import { FileLink, fileParts, fileReference, type OpenFile } from './fileLinks';
import { ToolCard } from './ToolCard';

export const COLUMN = 'mx-auto w-full max-w-[768px] px-6';

export function MessageList({ sessionId, working, agentName }: { sessionId: string; working: boolean; agentName: string }) {
  const count = useSessionStore((s) => s.sessions[sessionId]?.items.length ?? 0);
  const hasStream = useSessionStore((s) => !!s.sessions[sessionId]?.streaming);
  const parentRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [selection, setSelection] = useState<ImageSelection | null>(null);
  const fileRequest = useRef(0);
  useEffect(() => () => { fileRequest.current += 1; }, [sessionId]);
  const openFile = useCallback<OpenFile>((path, position) => {
    const request = ++fileRequest.current;
    const isCurrent = () => request === fileRequest.current;
    void useFileStore.getState().openSessionFile(sessionId, path, isCurrent, position).catch((error) => {
      if (isCurrent()) toast(`Could not open file: ${errMsg(error)}`, 'error');
    });
  }, [sessionId]);
  const previewScrollTop = useRef<number | null>(null);
  const selectImage = useCallback((image: ImageSelection) => {
    previewScrollTop.current = parentRef.current?.scrollTop ?? 0;
    stick.current = false;
    setSelection(image);
  }, []);
  function closeImage() {
    const el = parentRef.current;
    if (el && previewScrollTop.current !== null) {
      el.scrollTop = previewScrollTop.current;
      stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    }
    previewScrollTop.current = null;
    setSelection(null);
  }
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
      className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable_both-edges]"
      onScroll={(e) => {
        const el = e.currentTarget;
        if (previewScrollTop.current !== null) return;
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
                <Row sessionId={sessionId} index={row.index} onSelect={selectImage} openFile={openFile} />
              ) : (
                <StreamRow sessionId={sessionId} show={hasStream || working} agentName={agentName} openFile={openFile} />
              )}
            </div>
          </div>
        ))}
      </div>
      <ImagePreview image={selection} onClose={closeImage} />
    </div>
  );
}

const Row = memo(function Row({ sessionId, index, onSelect, openFile }: {
  sessionId: string;
  index: number;
  onSelect: (image: ImageSelection) => void;
  openFile: OpenFile;
}) {
  const item = useSessionStore((s) => s.sessions[sessionId]?.items[index]);
  const prevKind = useSessionStore((s) => (index > 0 ? s.sessions[sessionId]?.items[index - 1]?.kind : undefined));
  if (!item) return null;
  // A reply opens with the first assistant/tool item after a user message; give it extra room.
  const startsReply = (item.kind === 'assistant' || item.kind === 'tool') && (prevKind === undefined || prevKind === 'user');
  return (
    <>
      {startsReply ? <div className="pt-2" /> : null}
      <ItemView item={item} sessionId={sessionId} onSelect={onSelect} openFile={openFile} />
    </>
  );
});

function SessionToolCard({ item, sessionId, openFile }: {
  item: Extract<Item, { kind: 'tool' }>;
  sessionId: string;
  openFile: OpenFile;
}) {
  const disconnected = useSessionStore((s) => {
    const session = s.sessions[sessionId];
    return !!(session?.closed || session?.error);
  });
  const command = item.input.command;
  const eligible = item.tool === 'Bash' && typeof command === 'string' &&
    /^\s*["']?(?:[^\s"']*\/)?hc["']?\s+(?:run|read|wait|attach)\b/.test(command);
  const blocked = !!item.shell?.permission;
  const { data: target, error } = useQuery({
    queryKey: ['hc-output-target', sessionId, item.tool_use_id, !!item.result, item.shell?.permission],
    queryFn: eligible && !blocked ? () => api.hcOutputTarget(sessionId, item.tool_use_id) : skipToken,
    refetchInterval: !blocked && !item.result ? 1000 : false,
    retry: false,
  });
  const action = target && !blocked ? (
    <Button
      variant="ghost"
      size="xs"
      className="mr-2 shrink-0"
      onClick={() => void api.hcOutputOpen(sessionId, item.tool_use_id, target).catch((e) => toast(errMsg(e), 'error'))}
    >
      Open Output
    </Button>
  ) : eligible && error && item.result && !blocked ? (
    <span className="mr-2 shrink-0 text-xs text-muted-foreground">Output unavailable</span>
  ) : null;
  return <ToolCard item={item} sessionId={sessionId} disconnected={disconnected} action={action} openFile={openFile} />;
}

function ItemView({ item, sessionId, onSelect, openFile }: {
  item: Item;
  sessionId: string;
  onSelect: (image: ImageSelection) => void;
  openFile: OpenFile;
}) {
  switch (item.kind) {
    case 'user':
      return (
        <div className="ml-auto flex max-w-[80%] flex-col items-end gap-2 pt-6">
          {item.images.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {item.images.map((image, index) => (
                <HistoryImage
                  key={image.attachment_id ?? index}
                  sessionId={sessionId}
                  image={image}
                  label={`Image ${index + 1}`}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
          <div className="rounded-xl bg-muted px-3 py-2 text-content whitespace-pre-wrap break-words">
            {item.source === 'hc_send' ? (
              <div className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Terminal className="size-3" /> via hc send
              </div>
            ) : null}
            {fileParts(item.text).map(({ text, path }, i) => path
              ? <FileLink sessionId={sessionId} key={i} {...fileReference(path)} open={openFile}>{text}</FileLink>
              : text)}
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
              <Markdown sessionId={sessionId} key={i} text={b.text} openFile={openFile} />
            ),
          )}
        </div>
      );
    case 'tool':
      return (
        <div className="pt-4">
          <SessionToolCard item={item} sessionId={sessionId} openFile={openFile} />
        </div>
      );
    case 'turn_end': {
      const usage = item.usage;
      const cacheRead = usage?.cache_read_input_tokens;
      const cacheWrite = usage?.cache_creation_input_tokens;
      return (
        <div className="flex items-center gap-3 pt-6 text-[11px] text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span className="text-center font-mono">
            {item.interrupted ? 'interrupted · ' : ''}
            {item.tokens != null ? `${item.tokens.toLocaleString('en-US')} tokens` : 'turn complete'}
            {usage && (cacheRead != null || cacheWrite != null) && (
              <span className="block">
                {Math.max(0, usage.input_tokens - (cacheRead ?? 0) - (cacheWrite ?? 0)).toLocaleString('en-US')} new input
                {cacheRead != null && ` · ${cacheRead.toLocaleString('en-US')} cache read`}
                {cacheWrite != null && ` · ${cacheWrite.toLocaleString('en-US')} cache write`}
                {` · ${usage.output_tokens.toLocaleString('en-US')} output`}
              </span>
            )}
            {item.cost != null ? ` · $${item.cost.toFixed(4)}` : ''}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      );
    }
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

function StreamRow({ sessionId, show, agentName, openFile }: {
  sessionId: string;
  show: boolean;
  agentName: string;
  openFile: OpenFile;
}) {
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
        {text ? <Markdown sessionId={sessionId} text={text} streaming openFile={openFile} /> : null}
        <span className="hs-caret text-foreground" aria-label={`${agentName} is replying`} />
      </div>
    </div>
  );
}

export function HistoryImage({ sessionId, image, label, onSelect }: {
  sessionId: string;
  image: ChatAttachment;
  label: string;
  onSelect: (image: ImageSelection) => void;
}) {
  const { attachment_id: id, media_type: mediaType } = image;
  const supported = /^image\/[a-z0-9][a-z0-9.+-]*$/i.test(mediaType);
  const query = useQuery({
    queryKey: ['session-image', sessionId, id],
    queryFn: id && supported ? () => api.sessionImage(sessionId, id) : skipToken,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });
  if (!id || !supported || query.isError) return <UnavailableImage label={label} />;
  if (query.isPending) return <span role="status" className="text-xs text-muted-foreground">Loading {label}…</span>;
  if (!query.data) return <UnavailableImage label={label} />;
  return <ImageThumbnail src={`data:${mediaType};base64,${query.data}`} label={label} className="size-16 hover:outline-foreground" onSelect={onSelect} />;
}
