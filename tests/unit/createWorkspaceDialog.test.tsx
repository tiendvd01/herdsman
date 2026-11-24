import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    gitBranches: vi.fn(),
    workspaceCreate: vi.fn(),
  },
  errMsg: (error: Error) => error.message,
}));

const branchInfo = {
  is_repo: true,
  current: 'develop',
  default_branch: 'main',
  branches: ['develop', 'feature/login', 'main'],
  checked_out: ['develop', 'main'],
};

function openDialog() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <CreateWorkspaceDialog project={{ id: 'p1', name: 'Project', path: '/repo', sort: 0, created_at: 0, missing: false }} open onOpenChange={vi.fn()} />
    </QueryClientProvider>,
  );
}

const createButton = () => screen.getByRole<HTMLButtonElement>('button', { name: 'Create workspace' });

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.gitBranches).mockResolvedValue(branchInfo);
  vi.mocked(api.workspaceCreate).mockRejectedValue(new Error('Branch is already checked out'));
});

it('submits the available local branch and refreshes its availability on failure', async () => {
  vi.mocked(api.gitBranches).mockResolvedValueOnce(branchInfo).mockResolvedValue({
    ...branchInfo,
    checked_out: [...branchInfo.checked_out, 'feature/login'],
  });
  openDialog();
  await screen.findByText('New branches start from main.');
  const input = screen.getByLabelText('Branch');
  fireEvent.focus(input);
  expect(screen.getByRole('option', { name: 'feature/login' })).toBeTruthy();
  expect(screen.queryByRole('option', { name: 'develop' })).toBeNull();
  expect(createButton().disabled).toBe(true);
  fireEvent.change(input, { target: { value: 'develop' } });
  expect(createButton().disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Continue login' } });
  fireEvent.change(input, { target: { value: 'login' } });
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  expect(screen.getByRole('option', { name: 'feature/login', selected: true })).toBeTruthy();
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(screen.queryByRole('listbox')).toBeNull();
  fireEvent.click(createButton());
  expect(api.workspaceCreate).toHaveBeenCalledWith(expect.objectContaining({
    dir: { kind: 'existing_worktree', branch: 'feature/login' },
    name: 'Continue login',
  }));
  await screen.findByText('Branch is already checked out');
  await screen.findByText('This branch is already checked out.');
  expect(createButton().disabled).toBe(true);
  expect(screen.getByLabelText<HTMLInputElement>('Name').value).toBe('Continue login');
});

it('uses the default base for a typed branch and keeps the project folder option', async () => {
  openDialog();
  await screen.findByText('New branches start from main.');
  fireEvent.change(screen.getByLabelText('Branch'), { target: { value: 'feature/new' } });
  fireEvent.click(createButton());
  expect(api.workspaceCreate).toHaveBeenCalledWith(expect.objectContaining({
    dir: { kind: 'worktree', branch: 'feature/new' },
  }));
  await waitFor(() => expect(createButton().disabled).toBe(false));
  fireEvent.click(screen.getByRole('radio', { name: /Project folder/ }));
  fireEvent.click(createButton());
  await waitFor(() => expect(createButton().disabled).toBe(false));
  expect(api.workspaceCreate).toHaveBeenLastCalledWith(expect.objectContaining({ dir: { kind: 'project' } }));
});

it('does not turn a removed existing branch into a new branch on retry', async () => {
  vi.mocked(api.gitBranches).mockResolvedValueOnce(branchInfo).mockResolvedValue({
    ...branchInfo,
    branches: ['develop', 'main'],
  });
  vi.mocked(api.workspaceCreate).mockRejectedValueOnce(new Error('Branch was removed'));
  openDialog();
  await screen.findByText('New branches start from main.');
  fireEvent.change(screen.getByLabelText('Branch'), { target: { value: 'feature/login' } });
  fireEvent.click(createButton());
  await screen.findByText('This branch is no longer available.');
  expect(createButton().disabled).toBe(true);
});
