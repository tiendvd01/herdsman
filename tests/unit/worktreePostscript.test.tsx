import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { redo, undo } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { WorktreePostscriptDialog } from '@/components/project/WorktreePostscriptDialog';
import { WorktreePostscriptStatus } from '@/components/workspace/WorktreePostscriptStatus';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    projectPostscriptGet: vi.fn(),
    projectPostscriptSet: vi.fn(),
    workspacePostscriptGet: vi.fn(),
  },
  errMsg: String,
}));

beforeEach(() => {
  // jsdom has no text layout for CodeMirror to measure.
  const createRange = document.createRange.bind(document);
  vi.spyOn(document, 'createRange').mockImplementation(() => Object.assign(createRange(), {
    getClientRects: () => [],
    getBoundingClientRect: () => new DOMRect(),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(ui, {
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}

it('loads a project command and allows an empty save to clear it', async () => {
  vi.mocked(api.projectPostscriptGet).mockResolvedValue('echo ready');
  vi.mocked(api.projectPostscriptSet).mockResolvedValue(undefined);
  const close = vi.fn();
  renderWithQuery(<WorktreePostscriptDialog projectId="project" onClose={close} />);
  const editor = EditorView.findFromDOM(await screen.findByRole('textbox', { name: 'Shell command' }))!;
  expect(editor.state.sliceDoc()).toBe('echo ready');
  act(() => editor.dispatch({ changes: { from: 0, to: editor.state.doc.length } }));
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(api.projectPostscriptSet).toHaveBeenCalledWith('project', '');
});

it('edits shell code with history and keeps the script after a save error', async () => {
  vi.mocked(api.projectPostscriptGet).mockResolvedValue('echo "ready"');
  vi.mocked(api.projectPostscriptSet)
    .mockRejectedValueOnce(new Error('Save failed'))
    .mockResolvedValue(undefined);
  const close = vi.fn();
  renderWithQuery(<WorktreePostscriptDialog projectId="shell-project" onClose={close} />);
  const input = await screen.findByRole('textbox', { name: 'Shell command' });
  const editor = EditorView.findFromDOM(input)!;
  expect(editor).toBeTruthy();
  await waitFor(() => expect(input.querySelector('.syntax-string')?.textContent).toContain('"ready"'));
  const script = 'if true; then\n  echo "ready"\n\n  echo done\nfi';
  act(() => editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: script } }));
  act(() => { expect(undo(editor)).toBe(true); });
  expect(editor.state.sliceDoc()).toBe('echo "ready"');
  act(() => { expect(redo(editor)).toBe(true); });
  expect(editor.state.sliceDoc()).toBe(script);
  expect(editor.dom.querySelectorAll('.cm-lineNumbers .cm-gutterElement').length).toBeGreaterThan(1);
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Save failed');
  expect(close).not.toHaveBeenCalled();
  expect(EditorView.findFromDOM(input)).toBe(editor);
  expect(editor.state.sliceDoc()).toBe(script);
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(api.projectPostscriptSet).toHaveBeenLastCalledWith('shell-project', script);
});

it('discards a canceled edit and loads each project independently', async () => {
  vi.mocked(api.projectPostscriptGet).mockImplementation(async (projectId) =>
    projectId === 'first' ? 'echo saved' : null);
  const close = vi.fn();
  const dialog = (projectId: string) => <WorktreePostscriptDialog projectId={projectId} onClose={close} />;
  const { rerender } = renderWithQuery(dialog('first'));
  const editor = EditorView.findFromDOM(await screen.findByRole('textbox', { name: 'Shell command' }))!;
  act(() => editor.dispatch({ changes: { from: editor.state.doc.length, insert: '\necho draft' } }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(close).toHaveBeenCalledOnce();
  expect(api.projectPostscriptSet).not.toHaveBeenCalled();

  rerender(dialog('second'));
  const second = EditorView.findFromDOM(await screen.findByRole('textbox', { name: 'Shell command' }))!;
  expect(second.state.sliceDoc()).toBe('');
  rerender(dialog('first'));
  const reopened = EditorView.findFromDOM(await screen.findByRole('textbox', { name: 'Shell command' }))!;
  expect(reopened.state.sliceDoc()).toBe('echo saved');
});

it('refreshes a running workspace result and exposes failure details', async () => {
  vi.mocked(api.workspacePostscriptGet)
    .mockResolvedValueOnce({ status: 'running', stdout: '', stderr: '', error: null })
    .mockResolvedValue({ status: 'failed', stdout: 'Setup started', stderr: 'Missing file', error: 'Exit code 7' });
  renderWithQuery(<WorktreePostscriptStatus workspaceId="workspace" />);
  expect(await screen.findByText('Running')).toBeTruthy();
  expect(await screen.findByText('Failed', {}, { timeout: 3000 })).toBeTruthy();
  fireEvent.click(screen.getByText('Failed'));
  expect(screen.getByText('Exit code 7')).toBeTruthy();
  expect(screen.getByText('Setup started')).toBeTruthy();
  expect(screen.getByText('Missing file')).toBeTruthy();
  expect(api.workspacePostscriptGet).toHaveBeenCalledWith('workspace');
});
