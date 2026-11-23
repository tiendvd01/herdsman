import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WorkspaceView } from '@/components/layout/WorkspaceView';
import { api } from '@/lib/api';
import { qk } from '@/lib/queries';
import type { Session, SessionStatus } from '@/lib/types';
import { useUiStore } from '@/stores/useUiStore';

vi.mock('@/lib/api', () => ({
  api: {
    projectList: vi.fn(),
    workspaceList: vi.fn(),
    sessionHistory: vi.fn(),
    sessionSetPinned: vi.fn(async () => {}),
    sessionClose: vi.fn(async () => {}),
  },
  errMsg: String,
}));
vi.mock('@/components/conversation/SessionView', () => ({ SessionView: () => null }));
vi.mock('@/components/history/HistoryPopover', () => ({ HistoryPopover: () => null }));

function renderWorkspace(status: SessionStatus = 'idle') {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(qk.projects, [{ id: 'p1', name: 'Project' }]);
  client.setQueryData(qk.workspaces('p1', true), [{ id: 'w1', project_id: 'p1', name: 'Workspace' }]);
  const session = {
    id: 's1', title: 'Final task', status, pinned_tab: true, engine: 'claude', created_at: 1,
  } as Session;
  client.setQueryData(qk.sessions('w1'), [session]);
  vi.mocked(api.sessionHistory).mockResolvedValue([{ ...session, pinned_tab: false }]);
  render(
    <QueryClientProvider client={client}>
      <TooltipProvider><WorkspaceView /></TooltipProvider>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Hide tab Final task' }));
}

describe('closing the last workspace session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({
      projectId: 'p1', workspaceId: 'w1', sessionByWorkspace: { w1: 's1' }, tempTabs: {}, statuses: {},
    });
  });

  it('lets the user cancel without closing either the session or workspace', () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(api.sessionClose).not.toHaveBeenCalled();
    expect(screen.getByRole('tab')).toBeTruthy();
    expect(useUiStore.getState().workspaceId).toBe('w1');
  });

  it('keeps the workspace open by default and clears the closed tab', async () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole('button', { name: 'Close session' }));
    await waitFor(() => expect(screen.queryByRole('tab')).toBeNull());
    expect(api.sessionClose).toHaveBeenCalledWith('s1');
    expect(useUiStore.getState().workspaceId).toBe('w1');
    expect(useUiStore.getState().sessionByWorkspace.w1).toBeUndefined();
  });

  it('warns about stopping a running agent and closes the workspace view if requested', async () => {
    renderWorkspace('working');
    expect(screen.getByText(/stops the agent/)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Also close the workspace view' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stop and close' }));
    await waitFor(() => expect(useUiStore.getState().workspaceId).toBeNull());
    expect(api.sessionClose).toHaveBeenCalledWith('s1');
    expect(useUiStore.getState().sessionByWorkspace.w1).toBeUndefined();
  });
});
