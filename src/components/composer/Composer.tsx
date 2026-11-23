import { TruncatedText } from '@/components/ui/truncated-text';
// Message box (FR-016): send, paste/attach images, slash commands, interrupt a turn; permission mode (FR-022a/b).
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Maximize2, Minimize2, Paperclip, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errCode, errMsg } from '@/lib/api';
import { createWorkspaceSession } from '@/lib/actions';
import { qk } from '@/lib/queries';
import { COMPOSER, effectiveComposerHeight } from '@/lib/layout';
import { useViewportHeight } from '@/lib/useLayoutWidths';
import { useUiStore } from '@/stores/useUiStore';
import type { PermissionMode, Session, SessionStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button, Kbd } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/toast';
import { ImagePreview, ImageThumbnail, type ImageSelection } from '@/components/conversation/ImagePreview';
import { COLUMN } from '@/components/conversation/MessageList';
import { ResizeHandle } from '@/components/layout/ResizeHandle';
import { ModeSwitcher } from './ModeSwitcher';
import { ModelSwitcher } from './ModelSwitcher';
import { UsageIndicators } from './UsageIndicators';

interface SlashItem {
  cmd: string;
  desc: string;
  hint?: string;
}

const CLEAR: SlashItem = { cmd: '/clear', desc: 'Start a new conversation', hint: '[name]' };

// Fallback when the engine can't report its commands (old agent, echo engine without support, error).
const SLASH: SlashItem[] = [
  { cmd: '/compact', desc: 'Compact context' },
  CLEAR,
  { cmd: '/review', desc: 'Review current changes' },
  { cmd: '/init', desc: 'Create CLAUDE.md for the project' },
];

export const commandsKey = (sessionId: string) => ['commands', sessionId] as const;

interface Img {
  name: string;
  media_type: string;
  data_b64: string;
  url: string;
}

async function toImg(f: File): Promise<Img> {
  const bytes = new Uint8Array(await f.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { name: f.name || 'image.png', media_type: f.type, data_b64: btoa(bin), url: URL.createObjectURL(f) };
}

// Unsent drafts survive switching conversations (in memory, per session).
const drafts = new Map<string, { text: string; images: Img[] }>();

export function Composer({
  session,
  status,
  mode,
  disabled,
  onNeedResume,
  agentName = 'Agent',
  firstPrompt,
}: {
  session: Session;
  status: SessionStatus;
  mode: PermissionMode;
  disabled?: boolean;
  onNeedResume?: () => Promise<void>;
  agentName?: string;
  firstPrompt?: boolean;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState(() => drafts.get(session.id)?.text ?? '');
  const [images, setImages] = useState<Img[]>(() => drafts.get(session.id)?.images ?? []);
  const [preview, setPreview] = useState<ImageSelection | null>(null);
  const draftOwner = useRef(session.id);
  const [sending, setSending] = useState(false);
  const sendInFlight = useRef(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashIdx, setSlashIdx] = useState(0);
  // Spec 012: taller editor for long prompts; UI-only, back to normal on session switch.
  const [expanded, setExpanded] = useState(false);
  // Spec 013: saved editor height (default 300px), clamped to what the window allows right now.
  const composerHeight = useUiStore((s) => s.composerHeight);
  const setComposerHeight = useUiStore((s) => s.setComposerHeight);
  const viewportHeight = useViewportHeight();
  const editorHeight = effectiveComposerHeight(composerHeight, viewportHeight);
  const editorMax = effectiveComposerHeight(COMPOSER.max, viewportHeight);
  const ta = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const working = status === 'working' || status === 'blocked';
  const typedSlash = text.startsWith('/') && !/\s/.test(text);
  const clearCommand = images.length === 0 && !/[\r\n]/.test(text)
    ? /^\/clear(?:\s+(.+))?$/.exec(text.trim())
    : null;
  useEffect(() => {
    setExpanded(false);
    if (draftOwner.current !== session.id) {
      draftOwner.current = session.id;
      const d = drafts.get(session.id);
      setText(d?.text ?? '');
      setImages(d?.images ?? []);
      setPreview(null);
    }
  }, [session.id]);
  useEffect(() => {
    if (draftOwner.current !== session.id) return; // state still belongs to the previous session
    if (text || images.length) drafts.set(session.id, { text, images });
    else drafts.delete(session.id);
  }, [session.id, text, images]);
  // Engine-reported commands: built-ins plus the project's/user's skills and custom commands.
  const commands = useQuery({
    queryKey: commandsKey(session.id),
    queryFn: () => api.sessionListCommands(session.id),
    staleTime: 30_000,
    retry: (n, e) => errCode(e) !== 'unsupported' && n < 1,
  });
  const engineCommands = commands.data?.commands;
  const all: SlashItem[] = engineCommands?.length
    ? [
        ...engineCommands
          // Project/user skills first: they're what people come to the menu for.
          .filter((c) => c.name !== 'clear')
          .sort((a, b) => Number(a.builtin) - Number(b.builtin) || a.name.localeCompare(b.name))
          .map((c) => ({ cmd: '/' + c.name, desc: c.description, hint: c.argument_hint || undefined })),
        CLEAR,
      ]
    : SLASH;
  const menuShown = typedSlash || slashOpen;
  const { refetch: refetchCommands } = commands;
  // Pick up skills added mid-session when the menu opens (cached for 30s).
  useEffect(() => {
    if (menuShown) refetchCommands();
  }, [menuShown, refetchCommands]);
  const slash = typedSlash ? all.filter((s) => s.cmd.startsWith(text)) : slashOpen ? all : [];
  const slashListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    slashListRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [slashIdx, slash.length]);

  async function send() {
    const body = text.trim();
    if (!body || disabled || sendInFlight.current) return;
    sendInFlight.current = true;
    setSending(true);
    try {
      if (clearCommand) {
        const next = await createWorkspaceSession(qc, session.workspace_id, session.engine, clearCommand[1]);
        drafts.delete(session.id);
        const ui = useUiStore.getState();
        if (ui.workspaceId === session.workspace_id && ui.sessionByWorkspace[session.workspace_id] === session.id) {
          ui.selectSession(session.workspace_id, next.id);
        }
      } else {
        if (onNeedResume) await onNeedResume();
        await api.sessionPrompt(
          session.id,
          body,
          images.map(({ media_type, data_b64 }) => ({ media_type, data_b64 })),
        );
        qc.invalidateQueries({ queryKey: qk.sessions(session.workspace_id) });
        qc.invalidateQueries({ queryKey: ['workspaces'] });
      }
      if (draftOwner.current === session.id) {
        setText('');
        setImages([]);
        setExpanded(false);
      }
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      sendInFlight.current = false;
      setSending(false);
      ta.current?.focus();
    }
  }

  function toggleExpanded() {
    setExpanded((x) => !x);
    ta.current?.focus();
  }

  function interrupt() {
    api.sessionInterrupt(session.id).catch((e) => toast(errMsg(e), 'error'));
  }

  async function addFiles(files: File[]) {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    for (const f of imgs) {
      const img = await toImg(f);
      setImages((cur) => [...cur, img]);
    }
  }

  function pickSlash(cmd: string) {
    setText(cmd + ' ');
    setSlashOpen(false);
    ta.current?.focus();
  }

  const placeholder = working
    ? `${agentName} is working — your message will be queued…`
    : firstPrompt
      ? 'First prompt for this workspace…'
      : `Message ${agentName}… type / for commands`;

  return (
    <div className={cn(COLUMN, 'flex flex-col gap-1.5 pb-6', expanded ? 'min-h-0 shrink' : 'shrink-0')}>
      {slash.length ? (
        <div className="flex max-h-72 flex-col rounded-lg border border-border bg-background p-1 shadow-md">
          <span className="shrink-0 px-2 py-1.5 text-xs font-medium text-muted-foreground">Commands</span>
          <div ref={slashListRef} role="listbox" aria-label="Slash commands" className="flex min-h-0 flex-col overflow-y-auto">
            {slash.map((s, i) => (
              <button
                type="button"
                role="option"
                aria-selected={i === slashIdx}
                key={s.cmd}
                title={s.desc}
                className={cn('flex h-8 shrink-0 items-center gap-3 rounded px-2 text-left', i === slashIdx ? 'bg-accent' : 'hover:bg-accent')}
                onMouseMove={() => setSlashIdx(i)}
                onClick={() => pickSlash(s.cmd)}
              >
                <span className="shrink-0 font-mono text-[12px]">
                  {s.cmd}
                  {s.hint ? <span className="ml-1.5 text-muted-foreground">{s.hint}</span> : null}
                </span>
                <TruncatedText className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">{s.desc}</TruncatedText>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="relative flex min-h-0 flex-col gap-2 rounded-xl border border-input bg-background p-3 shadow-xs focus-within:ring-2 focus-within:ring-ring dark:shadow-none">
        {expanded ? (
          <ResizeHandle
            orientation="horizontal"
            side="left"
            label="Resize editor"
            value={editorHeight}
            min={COMPOSER.min}
            max={editorMax}
            onChange={setComposerHeight}
            onReset={() => setComposerHeight(COMPOSER.def)}
          />
        ) : null}
        {images.length ? (
          <div className="flex flex-wrap gap-1.5">
            {images.map((img, i) => (
              <span key={img.url} className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border pr-0.5 text-xs transition-colors duration-150 hover:border-foreground/50 hover:bg-accent/50 motion-reduce:transition-none">
                <ImageThumbnail
                  src={img.url}
                  label={img.name}
                  caption={img.name}
                  className="h-full items-center gap-1.5 pl-1"
                  onSelect={setPreview}
                />
                <button
                  type="button"
                  className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => setImages((c) => c.filter((_, j) => j !== i))}
                  aria-label={`Remove ${img.name}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <ImagePreview image={preview} onClose={() => setPreview(null)} />
        <label htmlFor={`composer-${session.id}`} className="sr-only">
          Message the agent
        </label>
        <textarea
          id={`composer-${session.id}`}
          ref={ta}
          rows={2}
          value={text}
          disabled={disabled}
          onChange={(e) => {
            setText(e.target.value);
            setSlashIdx(0);
          }}
          onPaste={(e) => {
            const files = [...e.clipboardData.files];
            if (files.some((f) => f.type.startsWith('image/'))) {
              e.preventDefault();
              addFiles(files);
            }
          }}
          onKeyDown={(e) => {
            if (slash.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
              e.preventDefault();
              setSlashIdx((i) => (e.key === 'ArrowDown' ? Math.min(slash.length - 1, i + 1) : Math.max(0, i - 1)));
              return;
            }
            if (slash.length && (e.key === 'Tab' || (e.key === 'Enter' && typedSlash && !clearCommand && !e.shiftKey && !e.nativeEvent.isComposing))) {
              e.preventDefault();
              pickSlash(slash[Math.min(slashIdx, slash.length - 1)].cmd);
              return;
            }
            if (e.key === 'Escape') {
              if (slash.length) {
                setSlashOpen(false);
                if (typedSlash) setText('');
              } else if (expanded) setExpanded(false);
              else if (working) interrupt();
              return;
            }
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          className={cn(
            'block min-h-[40px] w-full resize-none overflow-x-hidden overflow-y-auto bg-transparent px-0.5 text-content placeholder:text-muted-foreground focus:outline-none',
            // Expanded: saved height (spec 013), but shrink when the pane is short so the toolbar stays on screen.
            expanded ? 'shrink' : 'max-h-60 field-sizing-content',
          )}
          style={expanded ? { height: editorHeight } : undefined}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles([...(e.target.files ?? [])]);
                e.target.value = '';
              }}
            />
            <Tooltip content="Attach image (or paste with ⌘V)">
              <Button variant="ghost" size="icon" aria-label="Attach image" onClick={() => fileRef.current?.click()} disabled={disabled}>
                <Paperclip />
              </Button>
            </Tooltip>
            <Tooltip content={expanded ? 'Collapse editor (Esc)' : 'Expand editor'}>
              <Button
                variant="ghost"
                size="icon"
                aria-label={expanded ? 'Collapse editor' : 'Expand editor'}
                aria-pressed={expanded}
                onClick={toggleExpanded}
                disabled={disabled}
              >
                {expanded ? <Minimize2 /> : <Maximize2 />}
              </Button>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Slash commands"
              aria-expanded={slash.length > 0}
              className={cn('font-mono text-[14px] font-normal', slashOpen && 'bg-accent')}
              onClick={() => setSlashOpen((o) => !o)}
            >
              /
            </Button>
            <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
            <ModeSwitcher session={session} mode={mode} />
            <ModelSwitcher session={session} disabled={disabled || !!onNeedResume} />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <UsageIndicators sessionId={session.id} />
            {working ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={interrupt}>
                Interrupt turn
                <Kbd className="h-[18px] border-0 px-1">Esc</Kbd>
              </Button>
            ) : null}
            <Button size="icon" onClick={send} disabled={!text.trim() || sending || disabled} aria-label="Send">
              <ArrowUp />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
