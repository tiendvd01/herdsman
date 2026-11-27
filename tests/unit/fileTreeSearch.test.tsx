import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FileTree } from '@/components/files/FileTree';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api, type ProjectFileEntry } from '@/lib/api';
import { HomeDirectory } from '@/lib/homePath';
import { useFileStore } from '@/stores/useFileStore';

vi.mock('@/lib/api', () => ({
  api: {
    projectFiles: vi.fn(),
    projectFilesChanged: vi.fn(),
    projectFilesSearch: vi.fn(),
    projectFileRead: vi.fn(),
    absoluteFileRead: vi.fn(),
    absoluteFilesSearch: vi.fn(),
    projectFileSave: vi.fn(),
  },
  errMsg: String,
}));

const project = { id: 'project', name: 'Project', path: '/project', sort: 0, created_at: 0, missing: false };
const file = (path: string) => ({ path, name: path.slice(path.lastIndexOf('/') + 1), directory: false });

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(288);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(240);
  useFileStore.setState({ tabs: [], active: {} });
  vi.mocked(api.projectFilesChanged).mockResolvedValue([]);
  vi.mocked(api.projectFiles).mockImplementation(async (_, path) => path === ''
    ? [{ path: 'src', name: 'src', directory: true }]
    : [file('src/main.ts')]);
  vi.mocked(api.projectFileRead).mockResolvedValue({ text: '', writable: true });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderFiles(home?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const panel = (current = project) => (
    <QueryClientProvider client={client}>
      <HomeDirectory.Provider value={home}>
        <TooltipProvider><FileTree key={current.id} project={current} /></TooltipProvider>
      </HomeDirectory.Provider>
    </QueryClientProvider>
  );
  const view = render(panel());
  return {
    reopen: () => {
      view.rerender(null);
      view.rerender(panel());
    },
    switchProject: () => view.rerender(panel({ ...project, id: 'other' })),
    input: screen.getByRole<HTMLInputElement>('textbox', { name: 'Search files' }),
  };
}

it('mutes ignored items, keeps them openable, and refreshes the tree on reopen', async () => {
  const ignoredFile = { ...file('cache/local.txt'), ignored: true };
  vi.mocked(api.projectFiles)
    .mockResolvedValueOnce([{ name: 'cache', path: 'cache', directory: true, ignored: true }])
    .mockResolvedValueOnce([ignoredFile])
    .mockResolvedValueOnce([{ name: 'cache', path: 'cache', directory: true }]);
  vi.mocked(api.projectFilesSearch).mockResolvedValue([ignoredFile]);
  const { input, reopen } = renderFiles();

  const folder = await screen.findByRole('treeitem', { name: 'cache, Git ignored' });
  expect(within(folder).getByText('cache').classList.contains('text-git-ignored-fg')).toBe(true);
  fireEvent.click(folder);
  const ignored = await screen.findByRole('treeitem', { name: 'local.txt, Git ignored' });
  expect(within(ignored).getByText('local.txt').classList.contains('text-git-ignored-fg')).toBe(true);
  const tree = screen.getByRole('tree', { name: 'Project files' });
  fireEvent.keyDown(tree, { key: 'ArrowDown' });
  fireEvent.keyDown(tree, { key: 'Enter' });
  expect(api.projectFileRead).toHaveBeenCalledWith(project.id, 'cache/local.txt');

  fireEvent.change(input, { target: { value: 'local' } });
  const result = await screen.findByRole('treeitem', { name: 'cache/local.txt' });
  expect(within(result).getByText('local.txt').classList.contains('text-git-ignored-fg')).toBe(false);

  reopen();
  const refreshed = await screen.findByRole('treeitem', { name: 'cache' });
  expect(within(refreshed).getByText('cache').classList.contains('text-git-ignored-fg')).toBe(false);
});

it('opens the exact path with the keyboard and restores the open folder on clear', async () => {
  vi.mocked(api.projectFilesSearch).mockResolvedValue([file('src/main.ts'), file('tests/main.ts')]);
  const { input } = renderFiles();
  fireEvent.click(await screen.findByRole('treeitem', { name: 'src' }));
  await screen.findByRole('treeitem', { name: 'main.ts' });
  fireEvent.change(input, { target: { value: ' MAIN ' } });

  const results = await screen.findByRole('tree', { name: 'File search results' });
  expect(within(results).getByRole('treeitem', { name: 'src/main.ts' })).toBeTruthy();
  expect(within(results).getByRole('treeitem', { name: 'tests/main.ts' })).toBeTruthy();
  expect(api.projectFilesSearch).toHaveBeenCalledWith(project.id, 'MAIN');

  fireEvent.keyDown(results, { key: 'ArrowDown' });
  fireEvent.keyDown(results, { key: 'Enter' });
  expect(api.projectFileRead).toHaveBeenCalledWith(project.id, 'tests/main.ts');
  fireEvent.click(within(results).getByRole('treeitem', { name: 'tests/main.ts' }));
  expect(api.projectFileRead).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Clear file search' }));

  expect(input.value).toBe('');
  expect(screen.getByRole('treeitem', { name: 'src' }).getAttribute('aria-expanded')).toBe('true');
  expect(useFileStore.getState().tabs.map(({ path }) => path)).toEqual(['tests/main.ts']);
});

it('retries a failed search and ignores an earlier query and project', async () => {
  let finishOldSearch!: (files: ProjectFileEntry[]) => void;
  vi.mocked(api.projectFilesSearch)
    .mockImplementationOnce(() => new Promise((resolve) => { finishOldSearch = resolve; }))
    .mockRejectedValueOnce(new Error('Cannot search files.'))
    .mockResolvedValueOnce([]);
  const { input, switchProject } = renderFiles();
  fireEvent.change(input, { target: { value: 'old' } });
  await waitFor(() => expect(api.projectFilesSearch).toHaveBeenCalledWith(project.id, 'old'));

  fireEvent.change(input, { target: { value: 'current' } });
  fireEvent.click(await screen.findByRole('button', { name: 'Retry search' }));
  expect(await screen.findByText('No matching files.')).toBeTruthy();

  await act(async () => finishOldSearch([file('old.ts')]));
  expect(screen.queryByText('old.ts')).toBeNull();
  expect(screen.getByText('No matching files.')).toBeTruthy();

  switchProject();
  expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Search files' }).value).toBe('');
  expect(screen.queryByText('No matching files.')).toBeNull();
});

it('opens explicitly entered absolute paths and preserves normal project tabs', async () => {
  vi.mocked(api.absoluteFileRead).mockResolvedValue({ text: 'External', writable: false });
  vi.mocked(api.absoluteFilesSearch).mockImplementation(async (path) => [file(path)]);
  const { input } = renderFiles();
  fireEvent.change(input, { target: { value: '/project/src/main.ts' } });
  fireEvent.click(await screen.findByRole('treeitem', { name: '/project/src/main.ts' }));
  await waitFor(() => expect(api.projectFileRead).toHaveBeenCalledWith(project.id, 'src/main.ts'));

  const path = '/project-other/with spaces.txt';
  fireEvent.change(input, { target: { value: path } });
  expect(await screen.findByRole('treeitem', { name: path })).toBeTruthy();
  expect(api.absoluteFileRead).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: 'Enter' });
  await waitFor(() => expect(useFileStore.getState().tabs[1]?.document?.text).toBe('External'));
  expect(api.absoluteFileRead).toHaveBeenCalledWith(path);
  expect(api.projectFilesSearch).not.toHaveBeenCalled();

  const store = useFileStore.getState();
  const external = store.tabs[1];
  store.edit(external.id, 'Attempted edit');
  await store.save(external.id);
  expect(api.projectFileSave).not.toHaveBeenCalled();
});

it('uses the pasted directory for results and filters within it as the path changes', async () => {
  const folder = '/outside project';
  const direct = file(`${folder}/notes.txt`);
  const nested = file(`${folder}/sub/deep-report.md`);
  vi.mocked(api.absoluteFilesSearch).mockResolvedValueOnce([direct]).mockResolvedValueOnce([nested]);
  const { input } = renderFiles();
  fireEvent.change(input, { target: { value: folder } });
  expect(await screen.findByRole('treeitem', { name: direct.path })).toBeTruthy();

  fireEvent.change(input, { target: { value: `${folder}/report` } });
  expect(await screen.findByRole('treeitem', { name: nested.path })).toBeTruthy();
  expect(screen.queryByRole('treeitem', { name: direct.path })).toBeNull();
  expect(api.absoluteFilesSearch).toHaveBeenLastCalledWith(`${folder}/report`);
  expect(api.projectFilesSearch).not.toHaveBeenCalled();
});

it('expands a home-relative path to a hidden directory before searching and opening', async () => {
  const path = '/home/dev user/.claude/test.md';
  vi.mocked(api.absoluteFilesSearch).mockResolvedValue([file(path)]);
  vi.mocked(api.absoluteFileRead).mockResolvedValue({ text: 'Example', writable: false });
  const { input } = renderFiles('/home/dev user/');
  fireEvent.change(input, { target: { value: '~/.claude/test.md' } });
  fireEvent.click(await screen.findByRole('treeitem', { name: path }));
  await waitFor(() => expect(api.absoluteFileRead).toHaveBeenCalledWith(path));
  expect(api.absoluteFilesSearch).toHaveBeenCalledWith(path);
  expect(api.projectFilesSearch).not.toHaveBeenCalled();
});
