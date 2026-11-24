import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
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
vi.mock('@/components/ui/toast', () => ({ toast: vi.fn() }));
vi.mock('@/components/conversation/SessionView', () => ({ SessionView: () => null }));
vi.mock('@/components/history/HistoryPopover', () => ({ HistoryPopover: () => null }));

function renderWorkspace(status: SessionStatus = 'idle', withNeighbor = false, completionSeqs?: [number, number]) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(qk.projects, [{ id: 'p1', name: 'Project' }]);
  client.setQueryData(qk.workspaces('p1', true), [{ id: 'w1', project_id: 'p1', name: 'Workspace' }]);
  const session = {
    id: 's1', title: 'Final task', status, pinned_tab: true, engine: 'claude', created_at: 1,
    completion_seq: completionSeqs?.[0],
  } as Session;
  const neighbor: Session = { ...session, id: 's2', title: 'Other task', status: 'idle', created_at: 2, completion_seq: completionSeqs?.[1] };
  const sessions = withNeighbor ? [session, neighbor] : [session];
  client.setQueryData(qk.sessions('w1'), sessions);
  vi.mocked(api.sessionHistory).mockResolvedValue([{ ...session, pinned_tab: false }, ...sessions.slice(1)]);
  const view = render(
    <QueryClientProvider client={client}>
      <TooltipProvider><WorkspaceView /></TooltipProvider>
    </QueryClientProvider>,
  );
  return { sessions, unmount: view.unmount };
}

function requestClose() {
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
    requestClose();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(api.sessionClose).not.toHaveBeenCalled();
    expect(screen.getByRole('tab')).toBeTruthy();
    expect(useUiStore.getState().workspaceId).toBe('w1');
  });

  it('keeps the workspace open by default and clears the closed tab', async () => {
    renderWorkspace();
    requestClose();
    fireEvent.click(screen.getByRole('button', { name: 'Close session' }));
    await waitFor(() => expect(screen.queryByRole('tab')).toBeNull());
    expect(api.sessionClose).toHaveBeenCalledWith('s1');
    expect(useUiStore.getState().workspaceId).toBe('w1');
    expect(useUiStore.getState().sessionByWorkspace.w1).toBeUndefined();
  });

  it('warns about stopping a running agent and closes the workspace view if requested', async () => {
    renderWorkspace('working');
    requestClose();
    expect(screen.getByText(/stops the agent/)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Also close the workspace view' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stop and close' }));
    await waitFor(() => expect(useUiStore.getState().workspaceId).toBeNull());
    expect(api.sessionClose).toHaveBeenCalledWith('s1');
    expect(useUiStore.getState().sessionByWorkspace.w1).toBeUndefined();
  });
});

describe('session tab indicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({
      projectId: 'p1', workspaceId: 'w1', sessionByWorkspace: { w1: 's2' }, tempTabs: {}, statuses: {}, viewedCompletions: {},
    });
  });

  it.each([
    { status: 'working', selected: 's1' },
    { status: 'working', selected: 's2' },
    { status: 'blocked', selected: 's1' },
    { status: 'blocked', selected: 's2' },
  ] as const)('keeps the closing $status tab neutral when Done arrives and $selected is selected', async ({ status, selected }) => {
    useUiStore.getState().selectSession('w1', selected);
    let finishClose!: () => void;
    vi.mocked(api.sessionClose).mockReturnValueOnce(new Promise<void>((resolve) => { finishClose = resolve; }));
    renderWorkspace(status, true);
    requestClose();
    fireEvent.click(screen.getByRole('button', { name: 'Stop and close' }));
    await waitFor(() => expect(api.sessionClose).toHaveBeenCalledWith('s1'));

    act(() => useUiStore.getState().setStatus('s1', { state: 'done' }));
    const closingTab = within(screen.getByText('Final task').closest('button')!);
    expect(closingTab.queryByLabelText('Done')).toBeNull();
    expect(closingTab.getByLabelText('Closing session').classList.contains('text-muted-foreground')).toBe(true);
    expect(within(screen.getByText('Other task').closest('button')!).getByLabelText('Idle')).toBeTruthy();

    finishClose();
    await waitFor(() => expect(screen.queryByText('Final task')).toBeNull());
    act(() => useUiStore.getState().setStatus('s2', { state: 'idle', kind: 'turn_complete' }));
    expect(within(screen.getByRole('tab', { name: /Other task/ })).getByRole('img', { name: 'Done' }).classList.contains('bg-st-done')).toBe(true);
  });

  it('keeps a completed background session open and shows Working on its next turn', () => {
    renderWorkspace('working', true);
    act(() => useUiStore.getState().setStatus('s1', { state: 'idle', kind: 'turn_complete' }));
    expect(within(screen.getByRole('tab', { name: /Final task/ })).getByLabelText('Done')).toBeTruthy();
    act(() => useUiStore.getState().setStatus('s1', { state: 'working' }));
    expect(within(screen.getByRole('tab', { name: /Final task/ })).getByLabelText('Working')).toBeTruthy();
  });

  it('acknowledges visible completions, preserves background completions and persists across reload', async () => {
    const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    try {
      const completionTs = Math.ceil(performance.timeOrigin);
      const { unmount } = renderWorkspace('idle', true);
      act(() => {
        useUiStore.getState().setStatus('s1', { state: 'idle', kind: 'turn_complete', completionSeq: 10, completionTs });
        useUiStore.getState().setStatus('s2', { state: 'idle', kind: 'turn_complete', completionSeq: 20 });
      });
      let first = screen.getByRole('tab', { name: /Final task/ });
      let second = screen.getByRole('tab', { name: /Other task/ });
      fireEvent.focus(first);
      expect(within(first).getByLabelText('Done')).toBeTruthy();
      expect(within(second).getByLabelText('Done')).toBeTruthy();
      fireEvent.click(first);
      expect(within(first).getByLabelText('Idle')).toBeTruthy();
      expect(within(second).getByLabelText('Done')).toBeTruthy();

      const stored = localStorage.getItem('herdsman-ui')!;
      unmount();
      await act(async () => {
        useUiStore.setState({ viewedCompletions: {}, statuses: {} });
        localStorage.setItem('herdsman-ui', stored);
        await useUiStore.persist.rehydrate();
      });
      renderWorkspace('idle', true, [10, 20]);
      first = screen.getByRole('tab', { name: /Final task/ });
      second = screen.getByRole('tab', { name: /Other task/ });
      fireEvent.focus(window);
      expect(within(first).getByLabelText('Idle')).toBeTruthy();
      expect(within(second).getByLabelText('Done')).toBeTruthy();

      act(() => useUiStore.getState().setStatus('s1', { state: 'idle', completionSeq: 11, completionTs: performance.timeOrigin - 1 }));
      expect(within(first).getByLabelText('Done')).toBeTruthy();
      act(() => useUiStore.getState().setStatus('s1', { state: 'idle', completionSeq: 12, completionTs }));
      expect(within(first).getByLabelText('Idle')).toBeTruthy();
      expect(within(second).getByLabelText('Done')).toBeTruthy();

      hasFocus.mockReturnValue(false);
      fireEvent.blur(window);
      act(() => useUiStore.getState().setStatus('s1', { state: 'idle', completionSeq: 13, completionTs }));
      expect(within(first).getByLabelText('Done')).toBeTruthy();
      hasFocus.mockReturnValue(true);
      fireEvent.focus(window);
      expect(within(first).getByLabelText('Idle')).toBeTruthy();
      expect(within(second).getByLabelText('Done')).toBeTruthy();
    } finally {
      hasFocus.mockRestore();
    }
  });

  it('continues showing the live indicator after cancellation and a failed close', async () => {
    vi.mocked(api.sessionClose).mockRejectedValueOnce(new Error('Close failed'));
    const { sessions } = renderWorkspace('blocked', true);
    vi.mocked(api.sessionHistory).mockResolvedValue(sessions);
    requestClose();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    const tab = within(screen.getByRole('tab', { name: /Final task/ }));
    expect(tab.getByRole('img', { name: 'Awaiting approval' })).toBeTruthy();
    expect(api.sessionClose).not.toHaveBeenCalled();

    requestClose();
    fireEvent.click(screen.getByRole('button', { name: 'Stop and close' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Stop and close' })).toBeTruthy());
    expect(tab.getByLabelText('Awaiting approval')).toBeTruthy();
    expect(api.sessionSetPinned).toHaveBeenLastCalledWith('s1', true);
    expect(toast).toHaveBeenCalledWith('Error: Close failed', 'error');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('tab', { name: /Final task/ })).toBeTruthy();
  });

  it('preserves Done when the turn already completed before closing', async () => {
    useUiStore.getState().selectSession('w1', 's1');
    let finishClose!: () => void;
    vi.mocked(api.sessionClose).mockReturnValueOnce(new Promise<void>((resolve) => { finishClose = resolve; }));
    renderWorkspace('done');
    requestClose();
    fireEvent.click(screen.getByRole('button', { name: 'Close session' }));
    await waitFor(() => expect(api.sessionClose).toHaveBeenCalledWith('s1'));
    expect(within(screen.getByText('Final task').closest('button')!).getByLabelText('Done')).toBeTruthy();
    finishClose();
    await waitFor(() => expect(screen.queryByText('Final task')).toBeNull());
  });
});
