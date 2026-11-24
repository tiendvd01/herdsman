import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandDialog } from '@/components/command/CommandDialog';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import type { SearchHit, Session, Workspace } from '@/lib/types';
import { useUiStore } from '@/stores/useUiStore';

vi.mock('@/lib/api', () => ({
  api: {
    appInfo: vi.fn(),
    projectList: vi.fn(),
    workspaceList: vi.fn(),
    sessionHistory: vi.fn(async () => []),
    sessionGet: vi.fn(),
    search: vi.fn(),
    claudeSearch: vi.fn(async () => []),
  },
  errMsg: String,
}));

const projects = [
  { id: 'p1', name: 'Local', path: '/local', sort: 0, created_at: 0, missing: false },
  { id: 'p2', name: 'Remote', path: '/remote', sort: 1, created_at: 0, missing: false },
];
const workspaces: Workspace[] = [
  { id: 'w1', project_id: 'p1', name: 'Current', archived_at: null },
  { id: 'w2', project_id: 'p1', name: 'Archived', archived_at: 1 },
  { id: 'w3', project_id: 'p2', name: 'Local', archived_at: null },
].map((w) => ({ ...w, work_dir: '/' + w.id, dir_kind: 'project', branch: null, base_branch: null, worktree_removed: false, created_at: 0 }));
const hits: SearchHit[] = workspaces.map((w) => ({
  session_id: 's-' + w.id,
  seq: 1,
  snippet: 'Shared content',
  workspace_id: w.id,
  workspace_name: w.name,
  workspace_archived: w.archived_at !== null,
  project_id: w.project_id,
  project_name: projects.find((p) => p.id === w.project_id)!.name,
  session_title: 'Session ' + w.id,
  engine_session_id: null,
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.appInfo).mockResolvedValue({ hc_connected: true } as Awaited<ReturnType<typeof api.appInfo>>);
  vi.mocked(api.projectList).mockResolvedValue(projects);
  vi.mocked(api.workspaceList).mockImplementation(async (projectId, includeArchived) =>
    workspaces.filter((w) => (!projectId || w.project_id === projectId) && (includeArchived || w.archived_at == null)));
  vi.mocked(api.sessionHistory).mockResolvedValue([]);
  vi.mocked(api.search).mockImplementation(async (_, ws, project) =>
    hits.filter((h) => (!ws || ws === h.workspace_id) && (!project || project === h.project_id)));
  vi.mocked(api.claudeSearch).mockResolvedValue([]);
  useUiStore.setState({
    cmdOpen: false, settingsOpen: false, sidebarOpen: true, rightOpen: true,
    projectId: 'p1', workspaceId: 'w1', recentWorkspaceIds: [], reopenedWorkspaceIds: [],
    collapsed: { p1: true }, sessionByWorkspace: {}, tempTabs: {},
  });
});

function openPalette(showSidebar = false) {
  render(<QueryClientProvider client={new QueryClient()}><TooltipProvider>
    {showSidebar && <Sidebar />}
    <CommandDialog />
  </TooltipProvider></QueryClientProvider>);
  fireEvent.keyDown(window, { key: 'k', metaKey: true });
  return screen.getByRole('combobox', { name: 'Search sessions, projects or commands' });
}

describe('CommandDialog', () => {
  it('retains the query through scope changes and opens an archived session', async () => {
    const input = openPalette(true);
    expect(await screen.findByText('Recent workspaces')).toBeTruthy();
    const scope = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Session scope' });
    expect(scope.value).toBe('workspace');
    fireEvent.change(input, { target: { value: 'shared' } });
    expect(await screen.findByText('Session w1')).toBeTruthy();
    expect(screen.queryByText('Session w2')).toBeNull();
    fireEvent.change(scope, { target: { value: 'all' } });
    expect(await screen.findByText('Session w3')).toBeTruthy();
    fireEvent.change(scope, { target: { value: 'project' } });
    expect(await screen.findByText('Session w2')).toBeTruthy();
    expect(screen.queryByText('Session w3')).toBeNull();
    expect((input as HTMLInputElement).value).toBe('shared');
    vi.mocked(api.sessionGet).mockResolvedValue({ status: 'done' } as Session);
    fireEvent.click(screen.getByText('Session w2'));
    await waitFor(() => expect(useUiStore.getState().tempTabs.w2).toEqual(['s-w2']));
    expect(useUiStore.getState().workspaceId).toBe('w2');
    expect(useUiStore.getState().reopenedWorkspaceIds).toContain('w2');
    expect(useUiStore.getState().collapsed.p1).toBe(false);
    const reopened = screen.getByRole('button', { name: /^Project folder\s*Archived$/ });
    expect(reopened.getAttribute('aria-current')).toBe('page');
    act(() => useUiStore.getState().selectWorkspace('p1', 'w1'));
    expect(screen.getByRole('button', { name: /^Project folder\s*Archived$/ })).toBe(reopened);
  });

  it('keeps category results separate and activates the highlighted action', async () => {
    const input = openPalette();
    fireEvent.change(input, { target: { value: 'Local' } });
    fireEvent.click(screen.getByRole('button', { name: 'Workspaces' }));
    expect((await screen.findByText('Remote')).closest('button')?.textContent).toContain('Local');
    expect(screen.queryByText('/local')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Projects' }));
    expect(screen.getByText('/local').closest('button')?.textContent).toContain('Local');
    expect(screen.queryByText('Remote')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.change(input, { target: { value: 'theme' } });
    expect(screen.getByRole('option', { name: 'Appearance' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: /Toggle theme/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    fireEvent.change(input, { target: { value: 'hide' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const option = document.getElementById(input.getAttribute('aria-activedescendant') ?? '');
    expect(option?.getAttribute('aria-selected')).toBe('true');
    expect(option?.textContent).toMatch(/side panel/i);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(useUiStore.getState().cmdOpen).toBe(false);
    expect(useUiStore.getState().rightOpen).toBe(false);
    expect(useUiStore.getState().sidebarOpen).toBe(true);
  });

  it('ignores a stale response and closes on Escape', async () => {
    let resolveOld: (value: SearchHit[]) => void = () => {};
    vi.mocked(api.search).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    vi.mocked(api.search).mockResolvedValueOnce([]);
    const input = openPalette();
    fireEvent.change(input, { target: { value: 'old' } });
    await waitFor(() => expect(api.search).toHaveBeenCalledWith('old', 'w1', undefined));
    fireEvent.change(input, { target: { value: 'missing' } });
    expect(await screen.findByText('No results')).toBeTruthy();
    resolveOld([hits[0]]);
    await waitFor(() => expect(screen.queryByText('Session w1')).toBeNull());
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(useUiStore.getState().cmdOpen).toBe(false);
  });

  it('clears session hits if the current scope disappears and waits for a valid scope', async () => {
    const input = openPalette();
    fireEvent.change(input, { target: { value: 'shared' } });
    expect(await screen.findByText('Session w1')).toBeTruthy();
    act(() => useUiStore.getState().selectWorkspace('p1', null));
    expect(screen.getByText('Choose an available session scope.')).toBeTruthy();
    expect(screen.queryByText('Session w1')).toBeNull();
    expect(api.search).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByRole('combobox', { name: 'Session scope' }), { target: { value: 'project' } });
    expect(await screen.findByText('Session w2')).toBeTruthy();
    expect(api.search).toHaveBeenLastCalledWith('shared', undefined, 'p1');
  });
});
