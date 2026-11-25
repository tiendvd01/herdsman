import { Prec } from '@codemirror/state';
import { closeHoverTooltips, EditorView, hoverTooltip, keymap } from '@codemirror/view';
import { api, errMsg } from '@/lib/api';

export function editorHover(projectId: string, workspaceId: string | undefined, path: string, text: string,
  setStatus: (status: string | null) => void) {
  const session = crypto.randomUUID();
  let disposed = false;
  let revision = 0;
  let available = false;
  setStatus('Starting type hover…');
  const opening = Promise.resolve().then(() => api.editorLspOpen(session, projectId, workspaceId, path, text)).then(() => {
    available = true;
    if (!disposed) setStatus(null);
  }).catch((error) => {
    if (!disposed) setStatus(errMsg(error));
  });

  const tooltip = hoverTooltip(async (view, pos, side) => {
    if (!available || disposed) return null;
    const { doc } = view.state;
    const word = view.state.wordAt(side < 0 && pos > 0 ? pos - 1 : pos);
    if (!word || pos < word.from || pos > word.to) return null;
    const line = doc.lineAt(word.from);
    const request = ++revision;
    let contents: string | null;
    try {
      contents = await api.editorLspHover(session, view.state.sliceDoc(), line.number - 1, word.from - line.from);
    } catch (error) {
      available = false;
      if (!disposed) setStatus(errMsg(error));
      return null;
    }
    const summary = contents?.replace(/^```[\w-]*[ \t]*$/gm, '').trim();
    if (!summary || disposed || request !== revision || view.state.doc !== doc) return null;
    return {
      pos: word.from,
      end: word.to,
      above: true,
      create: () => {
        const dom = document.createElement('div');
        dom.setAttribute('role', 'tooltip');
        dom.className = 'max-h-60 max-w-[min(32rem,85vw)] overflow-auto rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs whitespace-pre-wrap break-words text-foreground shadow-md';
        dom.textContent = summary;
        return { dom };
      },
    };
  }, { hideOnChange: true });

  function dismiss(view: EditorView) {
    revision++;
    if (!view.state.field(tooltip.active).length) return false;
    view.dispatch({ effects: closeHoverTooltips });
    return true;
  }

  return {
    extensions: [
      tooltip,
      EditorView.domEventHandlers({ mouseleave: () => { revision++; }, scroll: (_, view) => { dismiss(view); } }),
      Prec.high(keymap.of([{ key: 'Escape', run: dismiss }])),
    ],
    dispose: () => {
      if (disposed) return;
      disposed = true;
      void opening.then(() => {
        if (available) return api.editorLspClose(session);
      }).catch(() => {});
    },
  };
}
