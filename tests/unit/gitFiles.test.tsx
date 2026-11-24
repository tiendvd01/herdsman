import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RightPanel } from '@/components/panels/RightPanel';
import { materialFileIcon } from '@/components/files/materialFileIcons';
import { WorkspaceView } from '@/components/layout/WorkspaceView';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { qk } from '@/lib/queries';
import { useFileStore } from '@/stores/useFileStore';
import { useUiStore } from '@/stores/useUiStore';

vi.mock('@/lib/api', () => ({
  api: { projectList: vi.fn(), filesChanged: vi.fn(), fileDiff: vi.fn() },
  errMsg: String,
}));
vi.mock('@/components/files/FileEditor', () => ({
  FileEditor: ({ file }: { file: { draft: string } }) => <div>{file.draft}</div>,
}));
vi.mock('@/components/conversation/SessionView', () => ({ SessionView: () => null }));
vi.mock('@/components/history/HistoryPopover', () => ({ HistoryPopover: () => null }));

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
  fireEvent.click(screen.getByRole('button', { name: `Close changes for ${path}` }));
  expect(screen.queryByRole('tab', { name: `Changes: ${path}` })).toBeNull();
  fireEvent.click(screen.getByRole('tab', { name: 'main.ts' }));
  expect(screen.getByText('Unsaved draft')).toBeTruthy();
  expect(useFileStore.getState().diffs).toHaveLength(2);
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
