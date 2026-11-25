import { Blob } from 'node:buffer';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RightPanel } from '@/components/panels/RightPanel';
import { GitHistoryRows } from '@/components/panels/GitHistoryRows';
import { materialFileIcon } from '@/components/files/materialFileIcons';
import { WorkspaceView } from '@/components/layout/WorkspaceView';
import { TooltipProvider } from '@/components/ui/tooltip';
import { runTabShortcut } from '@/lib/keyboardShortcuts';
import { api } from '@/lib/api';
import { qk } from '@/lib/queries';
import { useFileStore } from '@/stores/useFileStore';
import { useUiStore } from '@/stores/useUiStore';

vi.mock('@/lib/api', () => ({
  api: {
    projectList: vi.fn(), filesChanged: vi.fn(), fileDiff: vi.fn(), gitHistory: vi.fn(async () => null),
    commitChanges: vi.fn(), commitFileDiff: vi.fn(),
  },
  errMsg: String,
}));
vi.mock('@/components/files/FileEditor', () => ({
  FileEditor: ({ file }: { file: { draft: string } }) => <div>{file.draft}</div>,
}));
vi.mock('@/components/conversation/SessionView', () => ({ SessionView: () => null }));
vi.mock('@/components/history/HistoryPopover', () => ({ HistoryPopover: () => null }));

// Shiki's WASM loader uses Blob.stream, which jsdom does not implement.
beforeAll(() => vi.stubGlobal('Blob', Blob));
afterAll(() => vi.unstubAllGlobals());

beforeEach(() => {
  vi.clearAllMocks();
  useUiStore.setState({
    projectId: 'p1', workspaceId: 'w1', rightOpen: true, rightTab: 'files', gitTreeView: false,
    sidebarOpen: false, sessionByWorkspace: {}, tempTabs: {}, statuses: {},
  });
  useFileStore.setState({ tabs: [], diffs: [], active: {} });
});

it('keeps the list open and separates diff tabs from other files, workspaces and editor drafts', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  const path = 'src/main.ts';
  const otherPath = 'tests/main.ts';
  const fileId = JSON.stringify(['p1', path]);
  const changes = [
    { path, status: 'M', label: 'Modified' },
    { path: otherPath, status: 'M', label: 'Modified' },
    { path: 'README.md', status: 'D', label: 'Deleted' },
    { path: 'package.json', status: 'R', label: 'Renamed' },
    { path: 'deploy/Dockerfile', status: 'M', label: 'Modified' },
    { path: 'misc/unknown.zzz', status: '??', label: 'Untracked' },
  ];
  client.setQueryData(qk.projects, [{ id: 'p1', name: 'Project' }]);
  client.setQueryData(qk.workspaces('p1', true), [
    { id: 'w1', project_id: 'p1', name: 'One' },
    { id: 'w2', project_id: 'p1', name: 'Two' },
  ]);
  for (const workspace of ['w1', 'w2']) {
    client.setQueryData(qk.sessions(workspace), []);
    client.setQueryData(qk.files(workspace), changes);
  }
  useFileStore.setState({
    tabs: [{ id: fileId, projectId: 'p1', path, name: 'main.ts', draft: 'Unsaved draft' }],
    active: { p1: fileId },
  });
  vi.mocked(api.fileDiff).mockImplementation(async (workspace, file) => {
    if (file === otherPath) return '';
    return `+Patch for ${workspace}`;
  });

  render(
    <QueryClientProvider client={client}>
      <TooltipProvider><WorkspaceView /><RightPanel /></TooltipProvider>
    </QueryClientProvider>,
  );

  const selectChange = (file: string) => fireEvent.click(screen.getByRole('button', { name: `Changes for ${file}, Git status M: Modified` }));
  const diffTab = (file: string) => screen.getByRole('tab', { name: `Changes: ${file}` });

  for (const { path: changedPath, status, label } of changes) {
    const row = screen.getByRole('button', { name: `Changes for ${changedPath}, Git status ${status}: ${label}` });
    const icon = row.querySelector('img');
    expect(icon?.getAttribute('alt')).toBe('');
    expect(icon?.getAttribute('src')).toBe(materialFileIcon(changedPath.split('/').pop()!, false));
  }

  selectChange(path);
  selectChange(path);
  expect(screen.getAllByRole('tab', { name: `Changes: ${path}` })).toHaveLength(1);
  expect(diffTab(path).getAttribute('aria-selected')).toBe('true');
  expect(await screen.findByText('Patch for w1')).toBeTruthy();
  expect(screen.getByRole('list', { name: 'Changed files' })).toBeTruthy();

  selectChange(otherPath);
  expect(diffTab(otherPath).getAttribute('aria-selected')).toBe('true');
  expect(await screen.findByText('No changes to display.')).toBeTruthy();

  act(() => useUiStore.setState({ workspaceId: 'w2' }));
  expect(screen.queryByRole('tab', { name: `Changes: ${path}` })).toBeNull();
  selectChange(path);
  expect(await screen.findByText('Patch for w2')).toBeTruthy();

  act(() => useUiStore.setState({ workspaceId: 'w1' }));
  fireEvent.click(diffTab(path));
  expect(await screen.findByText('Patch for w1')).toBeTruthy();
  act(() => runTabShortcut('close-tab'));
  expect(screen.queryByRole('tab', { name: `Changes: ${path}` })).toBeNull();
  fireEvent.click(screen.getByRole('tab', { name: 'main.ts' }));
  expect(screen.getByText('Unsaved draft')).toBeTruthy();
  expect(useFileStore.getState().diffs).toHaveLength(2);
  act(() => useFileStore.setState(({ tabs }) => ({
    tabs: tabs.map((tab) => tab.id === fileId
      ? { ...tab, document: { text: 'Saved', writable: true } }
      : tab),
  })));
  act(() => runTabShortcut('close-tab'));
  expect(screen.getByRole('dialog', { name: 'Save changes to main.ts?' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByRole('tab', { name: /^main\.ts/ })).toBeTruthy();
});

it('groups the current workspace changes and keeps the same diff when switching views', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  const changes = [
    { path: 'src/ui/index.ts', status: 'M' },
    { path: 'src/lib/index.ts', status: 'R' },
    { path: 'old/removed.ts', status: 'D' },
    { path: 'README.md', status: '??' },
  ];
  client.setQueryData(qk.projects, [{ id: 'p1', name: 'Project' }]);
  client.setQueryData(qk.files('w1'), changes);
  client.setQueryData(qk.files('w2'), [changes[0]]);
  vi.mocked(api.filesChanged).mockResolvedValue([changes[0], changes[1], changes[3], { path: 'new/file.ts', status: 'A' }]);

  render(
    <QueryClientProvider client={client}>
      <TooltipProvider><RightPanel /></TooltipProvider>
    </QueryClientProvider>,
  );

  const toggle = () => screen.getByRole('button', { name: 'Tree view' });
  const folder = (name: string) => screen.getByRole('button', { name });
  const file = (path: string) => screen.getByRole('button', { name: new RegExp(`^Changes for ${path},`) });

  expect(toggle().getAttribute('aria-pressed')).toBe('false');
  expect(file('src/ui/index.ts').textContent).toContain('src/ui/index.ts');
  fireEvent.click(toggle());
  expect(toggle().getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('heading', { name: 'Changes (4)' })).toBeTruthy();
  expect(file('src/ui/index.ts').textContent).not.toContain('src/ui/');
  expect(folder('src').closest('li')?.contains(folder('ui'))).toBe(true);
  expect(folder('ui').closest('li')?.contains(file('src/ui/index.ts'))).toBe(true);
  expect(folder('lib').closest('li')?.contains(file('src/lib/index.ts'))).toBe(true);
  expect(file('old/removed.ts').textContent).toContain('D');
  expect(file('README.md').closest('ul')).toBe(screen.getByRole('list', { name: 'Changed files' }));

  fireEvent.click(file('src/ui/index.ts'));
  expect(file('src/ui/index.ts').getAttribute('aria-current')).toBe('true');
  fireEvent.click(file('src/lib/index.ts'));
  expect(useFileStore.getState().diffs.map((diff) => diff.path)).toEqual(['src/ui/index.ts', 'src/lib/index.ts']);
  expect(file('src/lib/index.ts').getAttribute('aria-current')).toBe('true');
  fireEvent.click(toggle());
  expect(file('src/lib/index.ts').getAttribute('aria-current')).toBe('true');

  fireEvent.click(toggle());
  fireEvent.click(folder('ui'));
  expect(folder('ui').getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('button', { name: /^Changes for src\/ui\/index/ })).toBeNull();
  fireEvent.keyDown(folder('ui'), { key: 'ArrowDown' });
  expect(document.activeElement).toBe(folder('lib'));

  fireEvent.click(screen.getByRole('button', { name: 'Refresh Git changes' }));
  expect(await screen.findByRole('button', { name: 'new' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'old' })).toBeNull();
  expect(folder('ui').getAttribute('aria-expanded')).toBe('false');

  act(() => useUiStore.setState({ workspaceId: 'w2' }));
  expect(folder('ui').getAttribute('aria-expanded')).toBe('true');
  expect(screen.queryByRole('button', { name: 'lib' })).toBeNull();
  expect(screen.getByRole('heading', { name: 'Changes (1)' })).toBeTruthy();
  act(() => useUiStore.setState({ rightTab: 'log' }));
  act(() => useUiStore.setState({ rightTab: 'files' }));
  expect(toggle().getAttribute('aria-pressed')).toBe('true');
});

it('restores the Agents tab when an older preference selected Tasks', async () => {
  const stored = JSON.parse(localStorage.getItem('herdsman-ui')!);
  localStorage.setItem('herdsman-ui', JSON.stringify({
    ...stored,
    state: { ...stored.state, rightTab: 'tasks' },
  }));
  await useUiStore.persist.rehydrate();
  expect(useUiStore.getState().rightTab).toBe('agents');

  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(qk.projects, [{ id: 'p1', name: 'Project' }]);
  render(<QueryClientProvider client={client}><TooltipProvider><RightPanel /></TooltipProvider></QueryClientProvider>);
  expect(screen.getByRole('tab', { name: 'Agents', selected: true })).toBeTruthy();
  expect(screen.queryByRole('tab', { name: 'Tasks' })).toBeNull();
});

it('draws merge edges, switches history with the workspace, and resizes in both directions', async () => {
  const height = vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(400);
  const frame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 1;
  });
  try {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    client.setQueryData(qk.projects, []);
    client.setQueryData(qk.files('w1'), []);
    client.setQueryData(qk.files('w2'), []);
    client.setQueryData(qk.gitHistory('w1'), { truncated: false, commits: [
      { id: 'merge', short_id: 'mer', subject: 'Merge topic', parents: ['main', 'topic'],
        branches: [{ name: 'develop', remote: false }, { name: 'origin/develop', remote: true }] },
      { id: 'topic', short_id: 'top', subject: 'Topic work', parents: ['main'] },
      { id: 'main', short_id: 'mai', subject: 'Main work', parents: [] },
    ] });

    render(<QueryClientProvider client={client}><TooltipProvider><RightPanel /></TooltipProvider></QueryClientProvider>);

    const merge = screen.getByText('Merge topic').closest('li');
    expect(merge?.textContent).toBe('merMerge topicdeveloporigin/develop');
    const mergeEdges = [...merge!.querySelectorAll('button svg path')];
    const [mainColor, topicColor] = mergeEdges.map((path) => path.getAttribute('stroke'));
    expect(mergeEdges).toHaveLength(2);
    expect(mainColor).not.toBe(topicColor);
    const topic = screen.getByText('Topic work').closest('li')!;
    expect(topic.querySelector('svg circle')?.getAttribute('fill')).toBe(topicColor);
    expect([...topic.querySelectorAll('svg path')].map((path) => path.getAttribute('stroke')))
      .toEqual([mainColor, topicColor, mainColor]);
    const splitter = screen.getByRole('separator', { name: 'Resize Git Graph' });
    expect(splitter.getAttribute('aria-valuenow')).toBe('200');
    fireEvent.pointerDown(splitter, { button: 0, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(splitter, { clientY: 150, pointerId: 1 });
    expect(splitter.getAttribute('aria-valuenow')).toBe('250');
    fireEvent.pointerMove(splitter, { clientY: 240, pointerId: 1 });
    expect(splitter.getAttribute('aria-valuenow')).toBe('160');
    fireEvent.pointerUp(splitter, { pointerId: 1 });
    fireEvent.keyDown(splitter, { key: 'Home' });
    expect(splitter.getAttribute('aria-valuenow')).toBe('84');

    act(() => useUiStore.setState({ workspaceId: 'w2' }));
    expect(screen.queryByText('Merge topic')).toBeNull();
    expect(await screen.findByText('This workspace is not in a Git repository.')).toBeTruthy();
    expect(splitter.getAttribute('aria-valuenow')).toBe('84');
  } finally {
    height.mockRestore();
    frame.mockRestore();
  }
});

it('uses all five graph colors before repeating and retains them on active paths', () => {
  const parents = ['one', 'two', 'three', 'four', 'five', 'six'];
  const commits = [
    { id: 'merge', short_id: 'mer', subject: 'Octopus merge', parents },
    ...parents.map((id) => ({ id, short_id: id, subject: `Commit ${id}`, parents: ['outside'] })),
  ];
  const { container, rerender } = render(<GitHistoryRows commits={commits} projectId="p1" workspaceId="w1" />, { wrapper: TooltipProvider });
  const colors = [...container.querySelectorAll('li:first-child svg path')].map((path) => path.getAttribute('stroke'));
  const dots = () => [...container.querySelectorAll('li:not(:first-child) svg circle')].map((dot) => dot.getAttribute('fill'));
  expect(colors).toHaveLength(6);
  expect(new Set(colors.slice(0, 5)).size).toBe(5);
  expect(new Set(colors).size).toBe(5);
  expect(dots()).toEqual(colors);
  rerender(<GitHistoryRows commits={commits.map((commit) => ({ ...commit }))} projectId="p1" workspaceId="w1" />);
  expect(dots()).toEqual(colors);
});

it('expands one commit and opens independent historical diffs in workspace tabs', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  const path = 'src/main.ts';
  client.setQueryData(qk.projects, [{ id: 'p1', name: 'Project' }]);
  client.setQueryData(qk.workspaces('p1', true), [{ id: 'w1', project_id: 'p1', name: 'One' }]);
  client.setQueryData(qk.sessions('w1'), []);
  client.setQueryData(qk.files('w1'), [{ path, status: 'M' }]);
  client.setQueryData(qk.gitHistory('w1'), { truncated: false, commits: [
    { id: 'first', short_id: 'aaa', subject: 'Rename file', parents: ['second'] },
    { id: 'second', short_id: 'bbb', subject: 'Add file', parents: [] },
  ] });
  vi.mocked(api.commitChanges).mockImplementation(async (_, id) => [
    { path, status: id === 'first' ? 'R' : 'A', original: id === 'first' ? 'old.ts' : null },
  ]);
  vi.mocked(api.commitFileDiff).mockImplementation(async (_, id) => `+Committed patch ${id}`);
  vi.mocked(api.fileDiff).mockResolvedValue('+Working patch');
  render(<QueryClientProvider client={client}><TooltipProvider><WorkspaceView /><RightPanel /></TooltipProvider></QueryClientProvider>);

  const first = screen.getByRole('button', { name: /Rename file/ });
  const second = screen.getByRole('button', { name: /Add file/ });
  fireEvent.click(first);
  const rename = await screen.findByRole('button', { name: /old.ts → src\/main.ts.*Renamed/ });
  expect(first.getAttribute('aria-expanded')).toBe('true');
  expect(first.closest('li')?.querySelector('svg line')).toBeTruthy();
  fireEvent.click(rename);
  fireEvent.click(rename);
  expect(screen.getAllByRole('tab', { name: 'Changes: src/main.ts (aaa)' })).toHaveLength(1);
  expect(await screen.findByText('Committed patch first')).toBeTruthy();
  expect(api.commitFileDiff).toHaveBeenCalledWith('w1', 'first', path, 'old.ts');

  fireEvent.click(second);
  expect(first.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(await screen.findByRole('button', { name: /src\/main.ts.*Added/ }));
  expect(await screen.findByText('Committed patch second')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /src\/main.ts.*Modified/ }));
  expect(await screen.findByText('Working patch')).toBeTruthy();
  expect(screen.getAllByRole('tab', { name: /^Changes: src\/main.ts/ })).toHaveLength(3);
  fireEvent.click(second);
  expect(screen.queryByRole('list', { name: 'Files changed in bbb' })).toBeNull();
});

it('highlights the old and new code inside Git diff rows while retaining row colors', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  const path = 'src/main.ts';
  client.setQueryData(qk.projects, [{ id: 'p1', name: 'Project' }]);
  client.setQueryData(qk.workspaces('p1', true), [{ id: 'w1', project_id: 'p1', name: 'One' }]);
  client.setQueryData(qk.sessions('w1'), []);
  client.setQueryData(qk.files('w1'), [{ path, status: 'M' }]);
  vi.mocked(api.fileDiff).mockResolvedValue('@@ -1 +1 @@\n-let x = "old";\n+const x = "new";\n');
  render(<QueryClientProvider client={client}><TooltipProvider><WorkspaceView /><RightPanel /></TooltipProvider></QueryClientProvider>);

  fireEvent.click(screen.getByRole('button', { name: /src\/main.ts.*Modified/ }));
  for (const [keyword, rowColor] of [['let', 'bg-diff-del'], ['const', 'bg-diff-add']]) {
    const token = await screen.findByText(keyword, { exact: true });
    expect(token.style.getPropertyValue('--patch-light')).toMatch(/^#/);
    expect(token.style.getPropertyValue('--patch-dark')).toMatch(/^#/);
    expect(token.parentElement?.classList.contains(rowColor)).toBe(true);
  }
});
