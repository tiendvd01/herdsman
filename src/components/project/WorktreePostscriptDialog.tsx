import { useEffect, useId, useRef, useState, type MutableRefObject } from 'react';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting } from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { api, errMsg } from '@/lib/api';
import { codeHighlightStyle, languageForFile } from '@/lib/highlightCode';

const shellEditorLanguage = new Compartment();
const shellEditorReadOnly = new Compartment();
const shellEditorTheme = EditorView.theme({
  '&': { color: 'var(--foreground)', background: 'var(--background)' },
  '.cm-scroller': {
    minHeight: '8rem',
    maxHeight: 'min(16rem, 40vh)',
    overflow: 'auto',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--code-content-size)',
  },
  '.cm-gutters': { color: 'var(--muted-foreground)', background: 'var(--surface)', borderColor: 'var(--border)' },
  '.cm-content': { caretColor: 'var(--foreground)' },
  '.cm-line': { paddingInline: '0.5rem' },
  '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
  '&.cm-focused': { outline: 'none' },
});

function ShellCommandEditor({ initialCommand, editor, disabled }: {
  initialCommand: string;
  editor: MutableRefObject<EditorView | null>;
  disabled: boolean;
}) {
  const [initial] = useState(initialCommand);
  const host = useRef<HTMLDivElement>(null);
  const fieldId = useId();
  useEffect(() => {
    if (!host.current) return;
    const lineEnding = initial.includes('\r\n') && !initial.replaceAll('\r\n', '').includes('\n') ? '\r\n' : '\n';
    const view = new EditorView({
      parent: host.current,
      doc: initial,
      extensions: [
        EditorState.lineSeparator.of(lineEnding),
        EditorView.contentAttributes.of({ 'aria-labelledby': `${fieldId}-label`, 'aria-describedby': `${fieldId}-help`, spellcheck: 'false' }),
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        shellEditorLanguage.of([]),
        shellEditorReadOnly.of([]),
        syntaxHighlighting(codeHighlightStyle),
        shellEditorTheme,
      ],
    });
    editor.current = view;
    view.focus();
    void languageForFile('postscript.sh').then((support) => {
      if (editor.current === view && support) view.dispatch({ effects: shellEditorLanguage.reconfigure(support) });
    }).catch(() => {});
    return () => {
      editor.current = null;
      view.destroy();
    };
  }, [editor, fieldId, initial]);

  useEffect(() => {
    editor.current?.dispatch({ effects: shellEditorReadOnly.reconfigure([
      EditorState.readOnly.of(disabled), EditorView.editable.of(!disabled),
    ]) });
  }, [editor, disabled]);

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span id={`${fieldId}-label`}>Shell command</span>
      <div ref={host} className="min-w-0 overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring" />
      <span id={`${fieldId}-help`} className="text-xs text-muted-foreground">
        Runs in each new worktree after creation. Save an empty command to turn it off.
      </span>
    </div>
  );
}

export function WorktreePostscriptDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const editor = useRef<EditorView | null>(null);
  const query = useQuery({
    queryKey: ['project-postscript', projectId],
    queryFn: () => api.projectPostscriptGet(projectId),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const save = useMutation({
    mutationFn: (command: string) => api.projectPostscriptSet(projectId, command),
    onSuccess: onClose,
  });
  const error = save.error ?? query.error;

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !save.isPending) onClose(); }}>
      <DialogContent>
        <DialogHeader title="Worktree Postscript" />
        <form onSubmit={(event) => {
          event.preventDefault();
          if (editor.current && query.isSuccess && !save.isPending) save.mutate(editor.current.state.sliceDoc());
        }}>
          {query.isPending && <Spinner label="Loading postscript" />}
          {query.data !== undefined && (
            <ShellCommandEditor key={projectId} initialCommand={query.data ?? ''} editor={editor} disabled={save.isPending} />
          )}
          {error && <p role="alert" className="mt-2 text-sm text-destructive">{errMsg(error)}</p>}
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>Cancel</Button>
            <Button type="submit" disabled={!query.isSuccess || save.isPending}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
