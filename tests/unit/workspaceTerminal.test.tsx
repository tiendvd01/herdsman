import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommandDialog } from '@/components/command/CommandDialog';
import { IS_MAC } from '@/lib/platform';
import { WorkspaceView } from '@/components/layout/WorkspaceView';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { qk } from '@/lib/queries';
import { useFileStore } from '@/stores/useFileStore';
import { useUiStore } from '@/stores/useUiStore';

vi.mock('@/lib/api', () => ({
  api: {
    projectList: vi.fn(),
    workspaceList: vi.fn(),
    sessionHistory: vi.fn(async () => []),
    sessionCreate: vi.fn(async (_workspaceId, engine) => ({
      id: 's2', title: 'New session', status: 'idle', engine, pinned_tab: true,
    })),
    workspaceTerminalList: vi.fn(async () => []),
    workspaceTerminalCreate: vi.fn(async () => ({ address: 't1', state: 'live' })),
    workspaceTerminalStop: vi.fn(async () => {}),
  },
  errMsg: String,
}));
vi.mock('@/components/conversation/SessionView', () => ({
  SessionView: ({ session }: { session: { id: string } }) => <div data-testid={`session-view-${session.id}`} />,
}));
vi.mock('@/components/history/HistoryPopover', () => ({ HistoryPopover: () => null }));
vi.mock('@/components/terminal/WorkspaceTerminal', () => ({
  default: ({ address }: { address: string }) => <div>Connected to {address}</div>,
}));

function renderWorkspace() {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(qk.projects, [{ id: 'p1', name: 'Project' }]);
  client.setQueryData(qk.workspaces('p1', true), [{ id: 'w1', project_id: 'p1', name: 'Workspace' }]);
  const existing = { id: 's1', title: 'Existing agent', status: 'idle', pinned_tab: true, engine: 'claude' } as Awaited<ReturnType<typeof api.sessionCreate>>;
  client.setQueryData(qk.sessions('w1'), [existing]);
  vi.mocked(api.sessionHistory).mockImplementation(async () => [existing, ...await Promise.all(vi.mocked(api.sessionCreate).mock.results.map((result) => result.value))]);
  render(
    <QueryClientProvider client={client}>
      <TooltipProvider><WorkspaceView /><CommandDialog /><Toaster /></TooltipProvider>
    </QueryClientProvider>,
  );
  return screen.getByRole('button', { name: 'New session in workspace' });
}

describe('workspace launcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({
      projectId: 'p1', workspaceId: 'w1', sessionByWorkspace: { w1: 's1' }, tempTabs: {}, statuses: {},
    });
  });

  it('opens and dismisses the menu by keyboard and uses the chosen agent', async () => {
    const trigger = renderWorkspace();
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByRole('menuitem', { name: /^Codex(?: Codex)?$/ }).getAttribute('aria-disabled')).toBeNull();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(api.sessionCreate).not.toHaveBeenCalled();
    expect(api.workspaceTerminalCreate).not.toHaveBeenCalled();

    fireEvent.click(trigger, { detail: 0 });
    fireEvent.click(screen.getByRole('menuitem', { name: /Claude Code/ }));
    await waitFor(() => expect(api.sessionCreate).toHaveBeenCalledWith('w1', 'claude', undefined, undefined));
    expect(await screen.findByRole('tab', { name: /New session/ })).toBeTruthy();
  });

  it('creates and selects a Codex tab from the launcher', async () => {
    const trigger = renderWorkspace();
    fireEvent.click(trigger, { detail: 0 });
    expect(screen.queryByRole('menuitem', { name: /Open Codex conversation/ })).toBeNull();
    fireEvent.click(screen.getByRole('menuitem', { name: /^Codex(?: Codex)?$/ }));
    await waitFor(() => expect(api.sessionCreate).toHaveBeenCalledWith('w1', 'codex', undefined, undefined));
    expect((await screen.findByRole('tab', { name: /New session/ })).getAttribute('aria-selected')).toBe('true');
  });

  it('keeps an opened session view mounted when switching agent tabs', async () => {
    const trigger = renderWorkspace();
    const original = screen.getByTestId('session-view-s1');
    fireEvent.click(trigger, { detail: 0 });
    fireEvent.click(screen.getByRole('menuitem', { name: /^Codex(?: Codex)?$/ }));
    const secondTab = await screen.findByRole('tab', { name: /New session/ });
    const second = screen.getByTestId('session-view-s2');

    expect(original.closest('[role="tabpanel"]')?.hasAttribute('hidden')).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: /Existing agent/ }));
    expect(screen.getByTestId('session-view-s1')).toBe(original);
    expect(second.closest('[role="tabpanel"]')?.hasAttribute('hidden')).toBe(true);
    fireEvent.click(secondTab);
    expect(screen.getByTestId('session-view-s2')).toBe(second);
  });

  it('switches between terminal and agent tabs and closes the live terminal directly', async () => {
    const trigger = renderWorkspace();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Terminal' }));
    const terminal = await screen.findByRole('tab', { name: 'Terminal t1' });
    expect(api.workspaceTerminalCreate).toHaveBeenCalledWith('w1');
    expect(await screen.findByText('Connected to t1')).toBeTruthy();

    const shortcut = IS_MAC ? { metaKey: true } : { ctrlKey: true };
    fireEvent.keyDown(terminal, { ...shortcut, code: 'Digit1' });
    expect(screen.queryByText('Connected to t1')).toBeNull();
    fireEvent.keyDown(window, { ...shortcut, code: 'Digit2' });
    expect(await screen.findByText('Connected to t1')).toBeTruthy();
    fireEvent.keyDown(window, { ...shortcut, code: 'KeyW' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    await waitFor(() => expect(screen.queryByRole('tab', { name: 'Terminal t1' })).toBeNull());
    expect(api.workspaceTerminalStop).toHaveBeenCalledWith('w1', 't1');
    expect(api.workspaceTerminalStop).toHaveBeenCalledTimes(1);
    const agent = screen.getByRole('tab', { name: /Existing agent/ });
    expect(agent.getAttribute('aria-selected')).toBe('true');
    await waitFor(() => expect(document.activeElement).toBe(agent));
  });

  it('reorders mixed tabs without changing the selected terminal or stopping it', async () => {
    const trigger = renderWorkspace();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Terminal' }));
    const terminal = await screen.findByRole('tab', { name: 'Terminal t1' });
    expect(await screen.findByText('Connected to t1')).toBeTruthy();

    act(() => {
      useFileStore.setState({
        tabs: [{ id: 'file', projectId: 'p1', path: 'README.md', name: 'README.md' }],
        diffs: [{ id: 'diff', projectId: 'p1', workspaceId: 'w1', path: 'main.ts', name: 'main.ts' }],
      });
    });
    const diff = screen.getByRole('tab', { name: 'Changes: main.ts' });
    act(() => diff.focus());
    for (let i = 0; i < 3; i++) fireEvent.keyDown(diff, { altKey: true, key: 'ArrowLeft' });
    expect(screen.getAllByRole('tab').map((tab) => tab.getAttribute('aria-label') ?? tab.textContent))
      .toEqual(['Changes: main.ts', 'Existing agent', 'Terminal t1', 'README.md']);
    expect(document.activeElement).toBe(diff);
    expect(terminal.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Connected to t1')).toBeTruthy();
    expect(api.workspaceTerminalStop).not.toHaveBeenCalled();

    act(() => useFileStore.setState({ tabs: [], diffs: [] }));
    localStorage.removeItem('herdsman.navigation-order:tabs:w1');
  });

  it('keeps the terminal available when stopping fails and closes it on retry', async () => {
    vi.mocked(api.workspaceTerminalStop).mockRejectedValueOnce(new Error('Stop failed'));
    const trigger = renderWorkspace();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Terminal' }));
    const close = await screen.findByRole('button', { name: 'Close terminal t1' });
    fireEvent.click(close);
    expect(await screen.findByText('Error: Stop failed')).toBeTruthy();
    await waitFor(() => expect((close as HTMLButtonElement).disabled).toBe(false));
    expect(screen.getByRole('tab', { name: 'Terminal t1' })).toBeTruthy();

    fireEvent.click(close);
    await waitFor(() => expect(screen.queryByRole('tab', { name: 'Terminal t1' })).toBeNull());
    expect(api.workspaceTerminalStop).toHaveBeenCalledTimes(2);
  });
});
