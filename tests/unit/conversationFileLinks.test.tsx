import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
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
  await files.openSessionFile('session', '/workspace/src/file.ts', () => true);
  expect(useFileStore.getState().tabs.map(({ draft }) => draft)).toEqual(['draft']);

  const state = useFileStore.getState();
  await files.openSessionFile('session', 'src/obsolete.ts', () => false);
  expect(useFileStore.getState()).toBe(state);
  read.mockRejectedValueOnce(new Error('The file could not be found.'));
  await expect(files.openSessionFile('session', 'src/missing.ts', () => true)).rejects.toThrow('could not be found');
  expect(useFileStore.getState()).toBe(state);
});
