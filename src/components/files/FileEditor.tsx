import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useRef } from 'react';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { AlertCircle, FileText, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { TruncatedText } from '@/components/ui/truncated-text';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { errMsg } from '@/lib/api';
import { isDirty, useFileStore, type FileTab } from '@/stores/useFileStore';
import { useQueryClient } from '@tanstack/react-query';

const fileHighlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.operatorKeyword], color: 'var(--st-working)' },
  { tag: [tags.atom, tags.bool, tags.number], color: 'var(--warn-fg)' },
  { tag: [tags.string, tags.regexp], color: 'var(--diff-add-fg)' },
  { tag: [tags.typeName, tags.className, tags.function(tags.variableName)], color: 'var(--st-working)' },
  { tag: tags.comment, color: 'var(--muted-foreground)', fontStyle: 'italic' },
  { tag: tags.heading, color: 'var(--foreground)', fontWeight: 'bold' },
  { tag: tags.link, textDecoration: 'underline' },
]);

async function languageFor(path: string) {
  const extension = path.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx': {
      const { javascript } = await import('@codemirror/lang-javascript');
      return javascript({ typescript: extension.startsWith('ts'), jsx: extension.endsWith('x') });
    }
    case 'json': return (await import('@codemirror/lang-json')).json();
    case 'md':
    case 'markdown': return (await import('@codemirror/lang-markdown')).markdown();
    case 'rs': return (await import('@codemirror/lang-rust')).rust();
    default: return [];
  }
}

export function FileEditor({ file }: { file: FileTab }) {
  const host = useRef<HTMLDivElement>(null);
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
  useEffect(() => {
    if (!host.current || !ready) return;
    const initial = useFileStore.getState().tabs.find((item) => item.id === file.id)?.draft ?? '';
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
        history(), language.of([]), syntaxHighlighting(fileHighlightStyle),
        keymap.of([{ key: 'Mod-s', run: () => { if (writable) save.current(); return true; } }, ...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) useFileStore.getState().edit(file.id, update.state.sliceDoc());
        }),
        EditorView.theme({
          '&': { height: '100%', color: 'var(--foreground)', background: 'var(--background)' },
          '.cm-scroller': { fontFamily: 'var(--font-mono)', fontSize: 'calc(12px + var(--content-step, 0px))', overflow: 'auto' },
          '.cm-gutters': { color: 'var(--muted-foreground)', background: 'var(--background)', borderColor: 'var(--border)' },
          '.cm-activeLine, .cm-activeLineGutter': { background: 'var(--muted)' },
          '.cm-content': { padding: '8px 0' },
          '.cm-line': { padding: '0 12px' },
          '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
          '&.cm-focused': { outline: 'none' },
        }),
      ],
    });
    const view = new EditorView({ parent: host.current, state });
    let disposed = false;
    void languageFor(file.path).then((support) => {
      if (!disposed) view.dispatch({ effects: language.reconfigure(support) });
    }).catch(() => {});
    return () => {
      disposed = true;
      view.destroy();
    };
  }, [file.id, file.path, ready, writable]);

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label={file.name}>
      <div className="flex min-h-11 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 text-xs">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <TruncatedText className="min-w-0 flex-1 truncate text-muted-foreground">{file.path}</TruncatedText>
        {ready && !writable ? <Badge variant="outline">Read-only</Badge> : null}
        {writable ? (
          <Button size="xs" variant="outline" disabled={!isDirty(file) || file.saving} onClick={() => save.current()}>
            {file.saving ? <Spinner label="Saving" /> : <Save data-icon="inline-start" />}
            {file.saving ? 'Saving…' : 'Save'}
          </Button>
        ) : null}
      </div>
      {file.loadError ? <div className="p-3"><Alert variant="destructive"><AlertCircle /><AlertDescription>{file.loadError}</AlertDescription></Alert></div> : null}
      {!ready && !file.loadError ? <p role="status" className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Spinner label="Loading" className="text-muted-foreground" />Loading file…</p> : null}
      <div ref={host} className="min-h-0 flex-1" />
    </section>
  );
}
