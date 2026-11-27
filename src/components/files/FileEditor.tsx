import { usePathLabel } from '@/lib/homePath';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useRef, useState } from 'react';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting } from '@codemirror/language';
import { codeHighlightStyle, languageForFile } from '@/lib/highlightCode';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { AlertCircle, Download, FileText, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { TruncatedText } from '@/components/ui/truncated-text';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription } from '@/components/ui/empty';
import { Markdown } from '@/components/conversation/Markdown';
import { toast } from '@/components/ui/toast';
import { api, errMsg } from '@/lib/api';
import { isDirty, useFileStore, type FileTab } from '@/stores/useFileStore';
import { useQueryClient } from '@tanstack/react-query';
import { editorHover } from './editorHover';

export function FileEditor({ file, workspaceId }: { file: FileTab; workspaceId?: string }) {
  const pathLabel = usePathLabel();
  const [preview, setPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hoverStatus, setHoverStatus] = useState<string | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const qc = useQueryClient();
  const save = useRef<() => void>(() => {});
  save.current = () => {
    void useFileStore.getState().save(file.id)
      .then(() => {
        void qc.invalidateQueries({ queryKey: ['files'] });
        void qc.invalidateQueries({ queryKey: ['diff'] });
      })
      .catch((error) => toast(errMsg(error), 'error'));
  };
  const ready = !!file.document;
  const writable = !!file.document?.writable;
  const canPreview = ready && /\.(md|markdown)$/i.test(file.path);
  const showingPreview = canPreview && preview;
  const text = file.draft ?? file.document?.text ?? '';

  async function download() {
    setDownloading(true);
    try {
      await api.projectMarkdownDownload(file.projectId, file.path, text);
    } catch (error) {
      toast(errMsg(error), 'error');
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    if (!host.current || !ready) return;
    const initial = useFileStore.getState().tabs.find((item) => item.id === file.id)?.draft ?? '';
    const hover = /\.(?:[cm]?[jt]s|[jt]sx)$/i.test(file.path)
      ? editorHover(file.projectId, workspaceId, file.path, initial, setHoverStatus)
      : undefined;
    const lineEnding = initial.includes('\r\n') && !initial.replaceAll('\r\n', '').includes('\n') ? '\r\n' : '\n';
    const language = new Compartment();
    const state = EditorState.create({
      doc: initial,
      extensions: [
        EditorState.lineSeparator.of(lineEnding),
        EditorState.readOnly.of(!writable),
        EditorView.editable.of(writable),
        EditorView.contentAttributes.of({ 'aria-label': 'File contents', spellcheck: 'false' }),
        lineNumbers(), highlightActiveLine(), highlightActiveLineGutter(),
        history(), language.of([]), syntaxHighlighting(codeHighlightStyle), hover?.extensions ?? [],
        keymap.of([{ key: 'Mod-s', run: () => { if (writable) save.current(); return true; } }, ...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) useFileStore.getState().edit(file.id, update.state.sliceDoc());
        }),
        EditorView.theme({
          '&': { height: '100%', color: 'var(--foreground)', background: 'var(--background)' },
          '.cm-scroller': { fontFamily: 'var(--font-mono)', fontSize: 'var(--code-content-size)', overflow: 'auto' },
          '.cm-gutters': { color: 'var(--muted-foreground)', background: 'var(--background)', borderColor: 'var(--border)' },
          '.cm-activeLine, .cm-activeLineGutter': { background: 'var(--muted)' },
          '.cm-content': { padding: '8px 0', caretColor: 'var(--foreground)' },
          '.cm-line': { padding: '0 12px' },
          '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
          '&.cm-focused': { outline: 'none' },
        }),
      ],
    });
    const view = new EditorView({ parent: host.current, state });
    editor.current = view;
    let disposed = false;
    void languageForFile(file.path).then((support) => {
      if (!disposed) view.dispatch({ effects: language.reconfigure(support ?? []) });
    }).catch(() => {});
    return () => {
      disposed = true;
      hover?.dispose();
      editor.current = null;
      view.destroy();
    };
  }, [file.id, file.path, file.projectId, workspaceId, ready, writable]);

  useEffect(() => {
    const view = editor.current;
    if (!view || !file.position) return;
    setPreview(false);
    const line = view.state.doc.line(Math.min(file.position.line, view.state.doc.lines));
    const anchor = Math.min(line.to, line.from + (file.position.column ?? 1) - 1);
    view.dispatch({ selection: { anchor }, effects: EditorView.scrollIntoView(anchor, { y: 'center' }) });
  }, [file.id, file.position, ready, writable, workspaceId]);

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label={file.name}>
      <div className="flex min-h-11 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 text-xs">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <TruncatedText className="min-w-0 flex-1 truncate text-muted-foreground">{pathLabel(file.path)}</TruncatedText>
        {hoverStatus && <Badge variant="outline" role="status" title={hoverStatus}>
          {hoverStatus === 'Starting type hover…' ? hoverStatus : 'Type hover unavailable'}
        </Badge>}
        {ready && !writable ? <Badge variant="outline">Read-only</Badge> : null}
        {canPreview ? (
          <Button size="xs" variant="outline" onClick={() => setPreview(!preview)}>
            {showingPreview ? 'Source' : 'Preview'}
          </Button>
        ) : null}
        {showingPreview ? (
          <Button size="xs" variant="outline" disabled={downloading} onClick={() => void download()}>
            {downloading ? <Spinner label="Downloading" /> : <Download data-icon="inline-start" />}
            Download
          </Button>
        ) : null}
        {writable ? (
          <Button size="xs" variant="outline" disabled={!isDirty(file) || file.saving} onClick={() => save.current()}>
            {file.saving ? <Spinner label="Saving" /> : <Save data-icon="inline-start" />}
            {file.saving ? 'Saving…' : 'Save'}
          </Button>
        ) : null}
      </div>
      {file.loadError ? <div className="p-3"><Alert variant="destructive"><AlertCircle /><AlertDescription>{file.loadError}</AlertDescription></Alert></div> : null}
      {!ready && !file.loadError ? <p role="status" className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Spinner label="Loading" className="text-muted-foreground" />Loading file…</p> : null}
      <div ref={host} hidden={showingPreview} className="min-h-0 flex-1" />
      {showingPreview ? (
        <div className="min-h-0 flex-1 overflow-auto p-4" role="region" aria-label="Markdown preview" tabIndex={0}>
          {text ? <Markdown text={text} /> : <Empty><EmptyDescription>This file is empty.</EmptyDescription></Empty>}
        </div>
      ) : null}
    </section>
  );
}
