import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ProjectCodegraphDialog } from '@/components/project/ProjectCodegraphDialog';
import { api, type ProjectCodegraphStatus } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: { projectCodegraphStatus: vi.fn(), projectCodegraphRun: vi.fn() },
  errMsg: String,
}));

const fresh: ProjectCodegraphStatus = {
  toolAvailable: true, indexed: false, ignored: false, tracked: false, running: false,
  runtimeError: null, runError: null, stats: null,
};

afterEach(() => vi.resetAllMocks());

function openDialog() {
  const client = new QueryClient();
  render(<QueryClientProvider client={client}>
    <ProjectCodegraphDialog project={{ id: 'project', name: 'Example' }} onClose={vi.fn()} />
  </QueryClientProvider>);
  return client;
}

it('initializes on demand, displays progress, and refreshes an existing index', async () => {
  const read = vi.mocked(api.projectCodegraphStatus);
  read.mockResolvedValue(fresh);
  const run = vi.mocked(api.projectCodegraphRun);
  run.mockImplementation(async () => { read.mockResolvedValue({ ...fresh, running: true }); });
  const client = openDialog();
  const initialize = await screen.findByRole('button', { name: 'Initialize index' });
  expect(run).not.toHaveBeenCalled();
  fireEvent.click(initialize);
  expect(await screen.findByText('Indexing…')).toBeTruthy();
  expect((initialize as HTMLButtonElement).disabled).toBe(true);
  expect(run).toHaveBeenCalledTimes(1);
  expect(run).toHaveBeenCalledWith('project', 'init');

  read.mockResolvedValue({
    ...fresh, indexed: true, ignored: true,
    stats: { fileCount: 8, nodeCount: 23, lastIndexed: '2026-11-27T02:00:00Z' },
  });
  await act(() => client.invalidateQueries({ queryKey: ['project-codegraph', 'project'] }));
  expect(await screen.findByText('Indexed')).toBeTruthy();
  expect(screen.getByText('23')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh index' }));
  await waitFor(() => expect(run).toHaveBeenLastCalledWith('project', 'refresh'));
});

it('repairs the ignore rule for an existing index even if CodeGraph is not installed', async () => {
  const read = vi.mocked(api.projectCodegraphStatus);
  read.mockResolvedValue({ ...fresh, indexed: true, toolAvailable: false });
  const run = vi.mocked(api.projectCodegraphRun);
  run.mockImplementation(async () => { read.mockResolvedValue({ ...fresh, indexed: true, ignored: true, toolAvailable: false }); });
  openDialog();
  expect(await screen.findByText(/CodeGraph CLI was not found/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Refresh index' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Add to local Git exclude' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Add to local Git exclude' })).toBeNull());
  expect(run).toHaveBeenCalledWith('project', 'exclude');
});
