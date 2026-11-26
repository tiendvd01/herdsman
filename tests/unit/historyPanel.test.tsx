import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { RightPanel } from '@/components/panels/RightPanel';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import type { ClaudeHit, StoredHistoryEntry, Workspace } from '@/lib/types';
import { useUiStore } from '@/stores/useUiStore';

vi.mock('@/lib/api', () => ({
  api: { projectList: vi.fn(async () => []), historyStored: vi.fn(), historyClaude: vi.fn(), claudeOpen: vi.fn() },
  errMsg: String,
}));

const workspace: Workspace = {
  id: 'w1', project_id: 'p1', name: 'Primary', dir_kind: 'project', work_dir: '/primary',
  branch: null, base_branch: null, archived_at: null, worktree_removed: false, created_at: 10,
};
const saved: StoredHistoryEntry = {
  workspace, project_name: 'Project', snippet: 'A [[query]] from Herdsman',
  session: {
    id: 's1', workspace_id: 'w1', engine: 'claude', hc_terminal: null, title: 'Saved session',
    status: 'done', permission_mode: 'ask', model: null, engine_session_id: 'c1',
    last_seen_seq: 0, pinned_tab: false, created_at: 10, updated_at: 20, ended_at: 20,
  },
};
const duplicate: ClaudeHit = {
  claude_session_id: 'c1', session_id: 's1', cwd: workspace.work_dir, title: 'Original CLI title',
  snippet: 'A CLI query', updated_at: 25, workspace_id: workspace.id, workspace_name: workspace.name,
  project_id: workspace.project_id, project_name: 'Project',
};
const standalone: ClaudeHit = {
  ...duplicate, claude_session_id: 'c2', session_id: null, title: 'Standalone CLI session',
  cwd: '/outside', workspace_id: null, workspace_name: null, project_id: null, project_name: null, updated_at: 30,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.projectList).mockResolvedValue([]);
  useUiStore.setState({ rightOpen: true, rightTab: 'history', projectId: 'p1', workspaceId: 'w1', statuses: {}, tempTabs: {}, sessionByWorkspace: {} });
});

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><TooltipProvider><RightPanel /></TooltipProvider></QueryClientProvider>);
  return screen.getByRole('tabpanel', { name: 'History' });
}

it('combines duplicates, keeps readable sessions on a partial CLI error and preserves search when opening', async () => {
  vi.mocked(api.historyStored).mockResolvedValue([saved]);
  vi.mocked(api.historyClaude).mockResolvedValue({ hits: [duplicate], partial: true });
  const panel = renderPanel();
  const search = within(panel).getByRole('searchbox');
  fireEvent.change(search, { target: { value: 'query' } });
  await waitFor(() => expect(api.historyClaude).toHaveBeenCalledWith('query', 'w1'));
  const row = await within(panel).findByRole('button', { name: /Saved session/ });
  expect(within(panel).queryByText('Original CLI title')).toBeNull();
  expect(within(panel).getByText('A query from Herdsman')).toBeTruthy();
  expect(within(panel).getByText(/Some Claude Code CLI history/)).toBeTruthy();
  fireEvent.click(row);
  await waitFor(() => expect(useUiStore.getState().tempTabs.w1).toContain('s1'));
  expect(useUiStore.getState().rightTab).toBe('history');
  expect((search as HTMLInputElement).value).toBe('query');
  expect(api.claudeOpen).not.toHaveBeenCalled();
});

it('allows app-wide browsing and opens a standalone CLI session without a selected workspace', async () => {
  useUiStore.setState({ projectId: null, workspaceId: null });
  vi.mocked(api.historyStored).mockResolvedValue([]);
  vi.mocked(api.historyClaude).mockResolvedValue({ hits: [{ ...standalone, title: null }], partial: false });
  vi.mocked(api.claudeOpen).mockResolvedValue({ workspace, session: saved.session });
  const panel = renderPanel();
  expect(within(panel).getByRole('combobox', { name: 'History scope' }).textContent).toBe('All projects');
  const row = await within(panel).findByRole('button', { name: /Claude session c2/ });
  expect(within(row).getByText('/outside')).toBeTruthy();
  expect(api.claudeOpen).not.toHaveBeenCalled();
  fireEvent.click(row);
  await waitFor(() => expect(useUiStore.getState().sessionByWorkspace.w1).toBe('s1'));
  expect(api.claudeOpen).toHaveBeenCalledWith('c2', undefined);
  expect(within(panel).getByRole('combobox', { name: 'History scope' }).textContent).toBe('All projects');
  expect(useUiStore.getState().rightTab).toBe('history');
});
