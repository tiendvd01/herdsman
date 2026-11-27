import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Markdown } from '@/components/conversation/Markdown';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { usePathLabel } from '@/lib/homePath';
import { api, errMsg } from '@/lib/api';
import type { CodexHistoryEntry, CodexHistoryMessage } from '@/lib/types';

export function codexHistoryTitle(entry: CodexHistoryEntry) {
  return entry.name.trim() || entry.preview.trim() || `Codex session ${entry.id.slice(0, 8)}`;
}

export function CodexHistoryDialog({ entry, onClose, restoreFocus }: {
  entry: CodexHistoryEntry;
  onClose: () => void;
  restoreFocus: () => void;
}) {
  const pathLabel = usePathLabel();
  const conversation = useQuery({
    queryKey: ['history-codex-conversation', entry.id, entry.cwd],
    queryFn: () => api.historyCodexRead(entry.id, entry.cwd),
    retry: false,
    gcTime: 0,
  });

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[min(720px,calc(100%-32px))]" bodyClassName="overflow-hidden"
        onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus(); }}>
        <DialogHeader title={<span className="line-clamp-2 break-words">{codexHistoryTitle(entry)}</span>}
          description={`Codex CLI · ${pathLabel(entry.cwd)}`} />
        {conversation.isPending && <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Loading conversation…</div>}
        {conversation.isError && <Alert variant="destructive"><AlertDescription>{errMsg(conversation.error)}</AlertDescription></Alert>}
        {conversation.data?.length === 0 && <p className="text-sm text-muted-foreground">No saved text messages.</p>}
        {!!conversation.data?.length && <Transcript messages={conversation.data} />}
      </DialogContent>
    </Dialog>
  );
}

function Transcript({ messages }: { messages: CodexHistoryMessage[] }) {
  const scroll = useRef<HTMLDivElement>(null);
  const virtual = messages.length > 100;
  const rows = useVirtualizer({
    enabled: virtual,
    count: messages.length,
    getScrollElement: () => scroll.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  function message({ role, text }: CodexHistoryMessage) {
    return (
      <article className="flex min-w-0 flex-col gap-1 break-words border-t border-border py-3 text-sm">
        <div className="font-medium text-muted-foreground">{role === 'user' ? 'You' : 'Codex'}</div>
        {role === 'assistant' ? <Markdown text={text} /> : <p className="whitespace-pre-wrap text-foreground">{text}</p>}
      </article>
    );
  }

  return (
    <div ref={scroll} role="region" aria-label="Conversation messages" tabIndex={0}
      className="min-h-0 max-h-[60vh] overflow-y-auto pr-2 focus-visible:outline-ring">
      {virtual ? (
        <div className="relative" style={{ height: rows.getTotalSize() }}>
          {rows.getVirtualItems().map(({ key, index, start }) => (
            <div key={key} data-index={index} ref={rows.measureElement} className="absolute inset-x-0 top-0"
              style={{ transform: `translateY(${start}px)` }}>
              {message(messages[index])}
            </div>
          ))}
        </div>
      ) : messages.map((entry, index) => <div key={index}>{message(entry)}</div>)}
    </div>
  );
}
