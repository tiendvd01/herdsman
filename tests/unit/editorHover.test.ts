import { activateHover, EditorView, runScopeHandlers } from '@codemirror/view';
import { afterEach, expect, it, vi } from 'vitest';
import { editorHover } from '@/components/files/editorHover';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: { editorLspOpen: vi.fn(), editorLspHover: vi.fn(), editorLspClose: vi.fn() },
  errMsg: String,
}));

const cleanup: (() => void)[] = [];
afterEach(() => {
  cleanup.splice(0).forEach((dispose) => dispose());
  vi.clearAllMocks();
});

async function open() {
  const status = vi.fn();
  const doc = 'let value = 1;';
  const hover = editorHover('project', 'workspace', 'src/main.ts', doc, status);
  const view = new EditorView({ parent: document.body, doc, extensions: hover.extensions });
  cleanup.push(() => { hover.dispose(); view.destroy(); });
  await vi.waitFor(() => expect(status).toHaveBeenLastCalledWith(null));
  return { view, hover };
}

it('sends the current draft and renders the hover as text', async () => {
  vi.mocked(api.editorLspOpen).mockResolvedValue();
  vi.mocked(api.editorLspClose).mockResolvedValue();
  vi.mocked(api.editorLspHover).mockResolvedValue('let value: string <tag>');
  const { view, hover } = await open();
  view.dispatch({ changes: { from: 12, to: 13, insert: '"new"' } });
  activateHover(view, 6, 1);
  await vi.waitFor(() => expect(view.dom.textContent).toContain('let value: string <tag>'));
  expect(view.dom.querySelector('tag')).toBeNull();
  const [session] = vi.mocked(api.editorLspOpen).mock.calls[0];
  expect(api.editorLspHover).toHaveBeenCalledWith(session, 'let value = "new";', 0, 4);
  runScopeHandlers(view, new KeyboardEvent('keydown', { key: 'Escape' }), 'editor');
  expect(view.dom.textContent).not.toContain('let value: string');
  hover.dispose();
  await vi.waitFor(() => expect(api.editorLspClose).toHaveBeenCalledWith(session));
});

it('discards a pending result after an edit', async () => {
  vi.mocked(api.editorLspOpen).mockResolvedValue();
  let finish!: (value: string) => void;
  vi.mocked(api.editorLspHover).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  const { view } = await open();
  activateHover(view, 6, 1);
  view.dispatch({ changes: { from: 12, to: 13, insert: '2' } });
  finish('stale result');
  await Promise.resolve();
  expect(view.dom.textContent).not.toContain('stale result');
});

it('keeps the editor usable when the language server is unavailable', async () => {
  vi.mocked(api.editorLspOpen).mockRejectedValueOnce('Server unavailable');
  const status = vi.fn();
  const hover = editorHover('project', 'workspace', 'index.js', 'let value = 1;', status);
  const view = new EditorView({ parent: document.body, doc: 'let value = 1;', extensions: hover.extensions });
  cleanup.push(() => { hover.dispose(); view.destroy(); });

  await vi.waitFor(() => expect(status).toHaveBeenLastCalledWith('Server unavailable'));
  view.dispatch({ changes: { from: 12, to: 13, insert: '2' } });
  activateHover(view, 6, 1);
  expect(view.state.doc.toString()).toBe('let value = 2;');
  expect(api.editorLspHover).not.toHaveBeenCalled();
});
