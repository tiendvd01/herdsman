import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { ToolCard } from '@/components/conversation/ToolCard';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Markdown } from '@/components/conversation/Markdown';
import { api } from '@/lib/api';
import { useFileStore } from '@/stores/useFileStore';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useFileStore.setState({ tabs: [], active: {} });
});

it('opens plain paths, inline paths and Markdown file links while preserving web links and code blocks', async () => {
  const openFile = vi.fn();
  const exists = vi.spyOn(api, 'sessionFileExists').mockImplementation(async (_sessionId, path) =>
    ['src/lib/api.ts', '/workspace/Report draft.md', 'docs/guide.md'].includes(path));
  const client = new QueryClient();
  const text = 'See src/lib/api.ts, `/workspace/Report draft.md` and [guide](docs/guide.md).\n\n'
    + '(3 nút close/minimize/maximize), `docs/deleted.md` and [missing](docs/missing.md).\n\n'
    + '[web](https://example.com/a/b)\n\n```\nsrc/private.txt\n```';
  const { rerender } = render(
    <QueryClientProvider client={client}>
      <Markdown text={text} sessionId="session" openFile={openFile} />
    </QueryClientProvider>,
  );
  expect(screen.queryByRole('link', { name: 'src/lib/api.ts' })).toBeNull();
  expect(openFile).not.toHaveBeenCalled();
  for (const label of ['src/lib/api.ts', '/workspace/Report draft.md', 'guide']) {
    fireEvent.click(await screen.findByRole('link', { name: label }));
  }
  expect(openFile.mock.calls).toEqual([['src/lib/api.ts'], ['/workspace/Report draft.md'], ['docs/guide.md']]);
  expect(screen.getByRole('link', { name: 'web' }).getAttribute('href')).toBe('https://example.com/a/b');
  expect(screen.queryByRole('link', { name: 'src/private.txt' })).toBeNull();
  await waitFor(() => expect(client.getQueryData(['session-file-exists', 'session', 'docs/missing.md'])).toBe(false));
  for (const label of ['close/minimize/maximize', 'docs/deleted.md', 'missing']) {
    expect(screen.queryByRole('link', { name: label })).toBeNull();
  }
  expect(screen.getByText('(3 nút close/minimize/maximize),', { exact: false })).toBeTruthy();
  expect(exists).toHaveBeenCalledWith('session', 'close/minimize/maximize');
  rerender(<QueryClientProvider client={client}><Markdown text={text} /></QueryClientProvider>);
  expect(screen.queryByRole('link', { name: 'src/lib/api.ts' })).toBeNull();
  expect(screen.getByRole('link', { name: 'guide' }).getAttribute('href')).toBe('docs/guide.md');
});

it('opens the resolved tab, keeps its draft and preserves selection after failure or an obsolete read', async () => {
  const document = { text: 'original', writable: true };
  const read = vi.spyOn(api, 'sessionFileRead').mockResolvedValue({ projectId: 'project', path: 'src/file.ts', document });
  const files = useFileStore.getState();
  await files.openSessionFile('session', './src/file.ts', () => true);
  expect(read).toHaveBeenCalledWith('session', './src/file.ts');
  const [tab] = useFileStore.getState().tabs;
  expect(useFileStore.getState().active.project).toBe(tab.id);
  files.edit(tab.id, 'draft');
  await files.openSessionFile('session', '/workspace/src/file.ts', () => true, { line: 4, column: 2 });
  expect(useFileStore.getState().tabs[0].position).toEqual({ line: 4, column: 2 });
  expect(useFileStore.getState().tabs.map(({ draft }) => draft)).toEqual(['draft']);

  const state = useFileStore.getState();
  await files.openSessionFile('session', 'src/obsolete.ts', () => false);
  expect(useFileStore.getState()).toBe(state);
  read.mockRejectedValueOnce(new Error('The file could not be found.'));
  await expect(files.openSessionFile('session', 'src/missing.ts', () => true)).rejects.toThrow('could not be found');
  expect(useFileStore.getState()).toBe(state);
});

it('resolves locations and inline filenames while checking only the file path', async () => {
  const open = vi.fn();
  const exists = vi.spyOn(api, 'sessionFileExists').mockResolvedValue(true);
  render(<QueryClientProvider client={new QueryClient()}>
    <Markdown text={'See src/main.ts:12:5, `main.ts:3` and `README.md`.'} sessionId="session" openFile={open} />
  </QueryClientProvider>);
  for (const label of ['src/main.ts:12:5', 'main.ts:3', 'README.md']) {
    fireEvent.click(await screen.findByRole('link', { name: label }));
  }
  expect(open.mock.calls).toEqual([
    ['src/main.ts', { line: 12, column: 5 }],
    ['main.ts', { line: 3, column: undefined }],
    ['README.md'],
  ]);
  expect(exists).toHaveBeenCalledWith('session', 'src/main.ts');
});

it.each([
  ['Grep', 'src/a file.ts:12:match', 'src/a file.ts:12', ['src/a file.ts', { line: 12 }]],
  ['Glob', 'src/a, file.ts', 'src/a, file.ts', ['src/a, file.ts']],
  ['Bash', 'error at src/main.ts:12:5: unexpected token', 'src/main.ts:12:5', ['src/main.ts', { line: 12, column: 5 }]],
] as const)('links completed %s results', async (tool, content, label, call) => {
  const open = vi.fn();
  vi.spyOn(api, 'sessionFileExists').mockResolvedValue(true);
  render(<QueryClientProvider client={new QueryClient()}><TooltipProvider>
    <ToolCard sessionId="session" openFile={open} item={{
      kind: 'tool', key: 'tool', tool_use_id: 'tool', ts: 1, steps: 0, tool, input: {},
      result: { content, is_error: tool === 'Bash' },
    }} />
  </TooltipProvider></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button'));
  fireEvent.click(await screen.findByRole('link', { name: label }));
  expect(open.mock.calls).toEqual([call]);
});

it('opens each diff target and skips a deleted target even when its name exists', async () => {
  const open = vi.fn();
  const exists = vi.spyOn(api, 'sessionFileExists').mockResolvedValue(true);
  render(<QueryClientProvider client={new QueryClient()}><TooltipProvider>
    <ToolCard sessionId="session" openFile={open} item={{
      kind: 'tool', key: 'tool', tool_use_id: 'tool', ts: 1, steps: 0, tool: 'Edit',
      input: {
        file_path: 'src/first.ts, src/a, file.ts, src/old.ts, src/deleted.ts',
        unified_diff: [
          '--- src/first.ts', '@@ -0,0 +1 @@', '+first',
          '--- src/a, file.ts', '+second',
          '--- a/src/old.ts', '+++ b/src/new.ts', '@@ -1 +1 @@', '-old', '+new',
          '--- a/src/deleted.ts', '+++ /dev/null', '@@ -1 +0,0 @@', '-deleted',
        ].join('\n'),
      },
    }} />
  </TooltipProvider></QueryClientProvider>);
  for (const path of ['src/a, file.ts', 'src/new.ts']) {
    fireEvent.click(await screen.findByRole('link', { name: path }));
  }
  expect(open.mock.calls).toEqual([['src/a, file.ts'], ['src/new.ts']]);
  expect(exists).not.toHaveBeenCalledWith('session', 'src/deleted.ts');
  expect(screen.getByText('src/deleted.ts')).toBeTruthy();
});
