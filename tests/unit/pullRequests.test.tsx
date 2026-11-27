import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useUiStore } from '@/stores/useUiStore';

const native = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => true, invoke: native.invoke }));
vi.mock('@tauri-apps/api/event', () => ({ listen: async () => () => {} }));
vi.mock('@tauri-apps/api/window', () => ({ getCurrentWindow: () => ({ onCloseRequested: async () => () => {} }) }));
vi.mock('@/components/layout/Sidebar', () => ({ Sidebar: () => <nav aria-label="Project sidebar" /> }));
vi.mock('@/components/layout/WorkspaceView', () => ({ WorkspaceView: () => <section aria-label="Active workspace" /> }));
vi.mock('@/components/panels/RightPanel', () => ({ RightPanel: () => <aside aria-label="Right panel" /> }));
vi.mock('@/components/settings/SettingsView', () => ({ SettingsView: () => <h1>Settings</h1> }));
vi.mock('@/components/settings/ProjectSkillsSection', () => ({ ProjectSkillsSection: ({ projectId }: { projectId: string }) => <p>Project skill configuration: {projectId}</p> }));
vi.mock('@/components/layout/ZoomIndicator', () => ({ ZoomIndicator: () => null }));
vi.mock('@/lib/zoomShortcuts', () => ({ useZoomEffect: () => {} }));
vi.mock('@/lib/queries', () => ({
  useAppInfo: () => ({ data: { hc_connected: true, node_path: '/bin/node' } }),
  useProjects: () => ({ data: [{ id: 'a', name: 'Project A' }, { id: 'b', name: 'Project B' }], isSuccess: true }),
}));

afterEach(() => {
  cleanup();
  native.invoke.mockReset();
});

function chooseView(label: RegExp) {
  const tab = screen.getByRole('tab', { name: label });
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  expect(tab.getAttribute('aria-selected')).toBe('true');
}

it('sets PR notifications read or unread in the selected scope', async () => {
  useUiStore.getState().setScreen('projects');
  useUiStore.getState().selectWorkspace('a', 'workspace-a');
  const a = { id: 'a', name: 'Project A' };
  const b = { id: 'b', name: 'Project B' };
  const snapshot = {
    account: 'developer',
    projects: {
      a: { repository: 'me/shared', pulls: [] },
      b: { repository: 'me/shared', pulls: [] },
    },
    notifications: [
      { repository: 'me/shared', projects: [a, b], event: { key: 'shared', title: 'Shared change', number: 1, kind: 'New comment', read: true } },
      { repository: 'me/a', projects: [a], event: { key: 'same', title: 'Change A', number: 2, kind: 'New comment', read: true } },
      { repository: 'me/b', projects: [b], event: { key: 'same', title: 'Change B', number: 3, kind: 'New comment', read: true } },
    ],
  };
  let fail = true;
  native.invoke.mockImplementation(async (command, params) => {
    if (command === 'pull_requests_refresh') return structuredClone(snapshot);
    if (command !== 'pull_requests_set_read') return;
    if (fail) throw new Error('Write failed');
    for (const { repository, event } of snapshot.notifications) {
      if (params.eventsByRepository[repository]?.includes(event.key)) event.read = params.read;
    }
  });
  render(<QueryClientProvider client={new QueryClient()}><TooltipProvider><AppShell /><Toaster /></TooltipProvider></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Pull Requests' }));
  const button = await screen.findByRole<HTMLButtonElement>('button', { name: 'Mark all as unread' });
  await waitFor(() => expect(button.disabled).toBe(false));
  fireEvent.click(button);
  const error = await screen.findByRole('alert');
  expect(error.textContent).toContain('Try again');
  fireEvent.click(within(error).getByRole('button', { name: 'Dismiss' }));
  expect(screen.queryByText('Unread', { exact: true })).toBeNull();
  expect(button.disabled).toBe(false);

  fail = false;
  fireEvent.click(button);
  expect(native.invoke).toHaveBeenLastCalledWith('pull_requests_set_read', {
    account: 'developer', read: false, eventsByRepository: { 'me/a': ['same'], 'me/shared': ['shared'] },
  });
  await screen.findByRole('button', { name: 'Pull Requests, 2 unread' });
  expect(screen.getByRole('tab', { name: /^Notifications.*2/ })).toBeTruthy();
  expect(button.disabled).toBe(true);

  const picker = within(screen.getByRole('navigation', { name: 'Select project' }));
  fireEvent.click(picker.getByRole('button', { name: 'Project B' }));
  chooseView(/^Notifications.*1/);
  expect(within(screen.getByRole('button', { name: /Shared change/ })).getByText('Unread')).toBeTruthy();
  expect(within(screen.getByRole('button', { name: /Change B/ })).queryByText('Unread')).toBeNull();
  fireEvent.click(picker.getByRole('button', { name: 'All projects' }));
  fireEvent.click(screen.getByRole('button', { name: 'Mark all as unread' }));
  expect(native.invoke).toHaveBeenLastCalledWith('pull_requests_set_read', {
    account: 'developer', read: false, eventsByRepository: { 'me/a': ['same'], 'me/b': ['same'], 'me/shared': ['shared'] },
  });
  await screen.findByRole('button', { name: 'Pull Requests, 3 unread' });
  expect(screen.getByRole('tab', { name: /^Notifications.*3/, selected: true })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await screen.findByRole('button', { name: 'Refresh' });
  expect(screen.getAllByText('Unread', { exact: true })).toHaveLength(3);

  fireEvent.click(picker.getByRole('button', { name: 'Project A' }));
  fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
  expect(native.invoke).toHaveBeenLastCalledWith('pull_requests_set_read', {
    account: 'developer', read: true, eventsByRepository: { 'me/a': ['same'], 'me/shared': ['shared'] },
  });
  const icon = await screen.findByRole('button', { name: 'Pull Requests, 1 unread' });
  expect(icon.querySelector('[data-slot="unread-dot"]')).toBeTruthy();
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Mark all as read' }).disabled).toBe(true);

  fireEvent.click(picker.getByRole('button', { name: 'All projects' }));
  fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
  await screen.findByRole('button', { name: 'Pull Requests' });
  expect(icon.querySelector('[data-slot="unread-dot"]')).toBeNull();
  expect(screen.queryByText('Unread', { exact: true })).toBeNull();
});

it('opens a separate PR screen, filters content and routes unread events without changing the workspace', async () => {
  useUiStore.getState().setScreen('projects');
  useUiStore.getState().selectWorkspace('a', 'workspace-a');
  const pr = { number: 4, isDraft: false, reviewDecision: null, ci: 'FAILURE', mergeStateStatus: 'BEHIND', baseRefName: 'main', headRefName: 'feature/work', updatedAt: '2026-11-25T09:30:00Z' };
  native.invoke.mockImplementation(async (command) => command === 'pull_requests_refresh' ? {
    account: 'developer',
    projects: {
      a: { repository: 'me/a', pulls: [{ ...pr, role: 'authored', title: 'Own change' }] },
      b: { repository: 'me/b', pulls: [{ ...pr, role: 'requested', title: 'Requested change' }] },
    },
    notifications: [
      { repository: 'me/b', projects: [{ id: 'b', name: 'Project B' }],
        event: { key: 'same-key', title: 'Requested change', number: 4, kind: 'Review requested', read: false } },
      { repository: 'me/a', projects: [{ id: 'a', name: 'Project A' }],
        event: { key: 'same-key', title: 'Own change', number: 4, kind: 'New comment', read: false } },
    ],
  } : undefined);
  render(<QueryClientProvider client={new QueryClient()}><TooltipProvider><AppShell /></TooltipProvider></QueryClientProvider>);

  const icon = await screen.findByRole('button', { name: 'Pull Requests, 2 unread' });
  const projects = screen.getByRole('button', { name: 'Projects', current: 'page' });
  expect(screen.getByRole('navigation', { name: 'Views' }).querySelector('button')).toBe(projects);
  expect(icon.textContent).toBe('');
  expect(icon.querySelector('[data-slot="unread-dot"]')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Expand navigation' }));
  const collapse = screen.getByRole('button', { name: 'Collapse navigation' });
  expect(collapse.getAttribute('aria-expanded')).toBe('true');
  expect(projects.textContent).toBe('Projects');
  expect(icon.textContent).toBe('Pull Requests');
  expect(screen.getByRole('navigation', { name: 'Project sidebar' })).toBeTruthy();
  fireEvent.click(icon);
  expect(icon.getAttribute('aria-current')).toBe('page');
  expect(screen.queryByRole('navigation', { name: 'Project sidebar' })).toBeNull();
  expect(icon.textContent).toBe('Pull Requests');
  fireEvent.click(collapse);
  expect(icon.textContent).toBe('');
  expect(icon.querySelector('[data-slot="unread-dot"]')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Expand navigation' }).getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('region', { name: 'Active workspace' })).toBeNull();
  expect(screen.queryByRole('complementary', { name: 'Right panel' })).toBeNull();
  const ownRow = screen.getByRole('button', { name: /^Own change/ });
  expect(within(ownRow).getByText('CI failed')).toBeTruthy();
  expect(ownRow.querySelector('time')?.dateTime).toBe('2026-11-25T09:30:00Z');
  const prPanel = screen.getByRole('tabpanel', { name: 'Overview' });
  prPanel.scrollTop = 180;
  fireEvent.click(ownRow);
  expect(screen.getByRole('article', { name: 'Own change' })).toBeTruthy();
  expect(prPanel.scrollTop).toBe(0);
  prPanel.scrollTop = 600;
  const back = screen.getByRole('button', { name: 'Back to list' });
  expect(prPanel.contains(back)).toBe(false);
  back.focus();
  expect(document.activeElement).toBe(back);
  fireEvent.click(back);
  expect(screen.queryByRole('button', { name: 'Back to list' })).toBeNull();
  expect(prPanel.scrollTop).toBe(180);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Own change/ }));
  expect(screen.queryByRole('button', { name: /^Requested change/ })).toBeNull();

  const picker = within(screen.getByRole('navigation', { name: 'Select project' }));
  expect(picker.getByRole('button', { name: 'Project A', current: true })).toBeTruthy();
  fireEvent.click(picker.getByRole('button', { name: 'All projects' }));
  chooseView(/^Review Requested.*1/);
  expect(screen.getByRole('tab', { name: /^Authored by Me.*1/ })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Own change/ })).toBeNull();
  expect(screen.getByRole('button', { name: /^Requested change/ })).toBeTruthy();
  chooseView(/^Notifications.*2/);
  expect(screen.queryByRole('button', { name: /^Requested change/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /^Review requested/ }));
  await screen.findByRole('button', { name: 'Pull Requests, 1 unread' });
  expect(icon.querySelector('[data-slot="unread-dot"]')).toBeTruthy();
  expect(picker.getByRole('button', { name: 'Project B', current: true })).toBeTruthy();
  expect(useUiStore.getState().projectId).toBe('a');
  expect(useUiStore.getState().workspaceId).toBe('workspace-a');
  const detail = screen.getByRole('article', { name: 'Requested change' });
  expect(within(detail).getByRole('heading', { name: 'Requested change' })).toBe(document.activeElement);
  expect(within(detail).getByText('me/b · #4')).toBeTruthy();
  expect(within(detail).getByText('feature/work → main')).toBeTruthy();
  expect(within(detail).getByText('Failed')).toBeTruthy();
  expect(within(detail).getByText('Update from main')).toBeTruthy();
  fireEvent.click(within(detail).getByRole('button', { name: 'Open on GitHub' }));
  expect(native.invoke).toHaveBeenCalledWith('pull_request_open', { repository: 'me/b', number: 4 });
  fireEvent.click(screen.getByRole('button', { name: 'Back to list' }));
  expect(screen.getByRole('tab', { name: /^Notifications.*0/, selected: true })).toBeTruthy();
  expect(screen.queryByRole('article')).toBeNull();

  fireEvent.click(picker.getByRole('button', { name: 'Project A' }));
  expect(screen.queryByRole('button', { name: /^Requested change/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /^New comment/ }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Pull Requests' }).textContent).toBe(''));
  fireEvent.click(projects);
  expect(projects.getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('navigation', { name: 'Project sidebar' })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Active workspace' })).toBeTruthy();
  expect(screen.getByRole('complementary', { name: 'Right panel' })).toBeTruthy();
  expect(useUiStore.getState().workspaceId).toBe('workspace-a');

  try {
    act(() => useUiStore.getState().setGitHubAccount('work-account'));
    await waitFor(() => expect(native.invoke).toHaveBeenCalledWith('pull_requests_refresh', { githubAccount: 'work-account' }));
  } finally {
    act(() => useUiStore.getState().setGitHubAccount(null));
  }
});

it('opens Skills and Settings as separate screens inside the main content', () => {
  useUiStore.getState().setScreen('projects');
  useUiStore.getState().selectWorkspace('a', 'workspace-a');
  native.invoke.mockResolvedValue({ projects: {}, notifications: [] });
  render(<QueryClientProvider client={new QueryClient()}><TooltipProvider><AppShell /></TooltipProvider></QueryClientProvider>);

  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  expect(screen.getByRole('button', { name: 'Settings', current: 'page' })).toBeTruthy();
  expect(screen.getByRole('main').contains(screen.getByRole('heading', { name: 'Settings' }))).toBe(true);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByRole('region', { name: 'Active workspace' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Skills' }));
  expect(screen.getByRole('button', { name: 'Skills', current: 'page' })).toBeTruthy();
  const picker = within(screen.getByRole('navigation', { name: 'Select project' }));
  expect(picker.getByRole('button', { name: 'Project A', current: true })).toBeTruthy();
  expect(picker.queryByRole('button', { name: 'All projects' })).toBeNull();
  fireEvent.click(picker.getByRole('button', { name: 'Project B' }));
  expect(screen.getByRole('main').contains(screen.getByText('Project skill configuration: b'))).toBe(true);
  expect(useUiStore.getState().workspaceId).toBe('workspace-a');
  expect(screen.queryByRole('heading', { name: 'Settings' })).toBeNull();

  const skillsHeader = screen.getByRole('heading', { name: 'Skills' }).closest('header');
  fireEvent.click(screen.getByRole('button', { name: 'Pull Requests' }));
  const pullRequests = screen.getByRole('region', { name: 'Pull Requests' });
  const pullRequestsHeader = within(pullRequests).getByRole('heading', { name: 'Pull Requests' }).closest('header');
  expect(pullRequestsHeader?.className).toBe(skillsHeader?.className);
  expect(within(pullRequests).getByRole('tablist', { name: 'Pull request views' })).toBeTruthy();
  expect(within(pullRequests).getByRole('button', { name: /Refresh/ })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Projects' }));
  expect(screen.getByRole('region', { name: 'Active workspace' })).toBeTruthy();
});

it('keeps readable details through an offline refresh and removes them when access is lost', async () => {
  useUiStore.getState().setScreen('projects');
  useUiStore.getState().selectWorkspace('a', 'workspace-a');
  const snapshot = {
    account: 'developer',
    projects: {
      a: { repository: 'me/a', pulls: [{ number: 4, title: 'Private change', role: 'authored', isDraft: true,
        reviewDecision: null, ci: null, mergeStateStatus: 'UNKNOWN', baseRefName: 'main' }] },
    },
    notifications: [],
  };
  let failure: { code: string; message: string } | undefined;
  native.invoke.mockImplementation(async (command) => {
    if (command !== 'pull_requests_refresh') return;
    if (failure) throw failure;
    return snapshot;
  });
  render(<QueryClientProvider client={new QueryClient()}><TooltipProvider><AppShell /></TooltipProvider></QueryClientProvider>);

  fireEvent.click(screen.getByRole('button', { name: 'Pull Requests' }));
  fireEvent.click(await screen.findByRole('button', { name: /^Private change/ }));
  expect(screen.getByText('Unknown → main')).toBeTruthy();
  failure = { code: 'offline', message: 'Could not refresh from GitHub.' };
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(await screen.findByText('Showing last known data. Could not refresh from GitHub.')).toBeTruthy();
  expect(screen.getByRole('article', { name: 'Private change' })).toBeTruthy();

  failure = { code: 'access', message: 'GitHub access is unavailable.' };
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(await screen.findByText('GitHub access is unavailable.')).toBeTruthy();
  expect(screen.queryByText('Private change')).toBeNull();
  expect(screen.getByRole('tab', { name: 'Authored by Me' })).toBeTruthy();

  failure = { code: 'offline', message: 'Still offline.' };
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(await screen.findByText('Still offline.')).toBeTruthy();
  expect(screen.queryByText('Private change')).toBeNull();
});

it('asks for a project before reading an ambiguous notification and opens in-app details for a merged PR', async () => {
  useUiStore.getState().setScreen('projects');
  useUiStore.getState().selectWorkspace('a', 'workspace-a');
  native.invoke.mockImplementation(async (command) => command === 'pull_request_detail' ? {
    headSha: 'head', body: 'Merged PR description',
    summary: { title: 'Merged PR', state: 'merged', headRefName: 'feature', baseRefName: 'main' },
    checks: {}, workflows: {}, reviews: {}, threads: {},
  } : command === 'pull_requests_refresh' ? {
    account: 'developer',
    projects: { a: { repository: 'me/shared', pulls: [] }, b: { repository: 'me/shared', pulls: [] } },
    notifications: [{
      repository: 'me/shared',
      projects: [{ id: 'a', name: 'Project A' }, { id: 'b', name: 'Project B' }],
      event: { key: 'done', title: 'No longer tracked', number: 4, kind: 'New comment', read: false },
    }],
  } : undefined);
  render(<QueryClientProvider client={new QueryClient()}><TooltipProvider><AppShell /></TooltipProvider></QueryClientProvider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Pull Requests, 1 unread' }));
  const picker = within(screen.getByRole('navigation', { name: 'Select project' }));
  fireEvent.click(picker.getByRole('button', { name: 'All projects' }));
  chooseView(/^Notifications/);
  fireEvent.click(screen.getByRole('button', { name: /^New comment/ }));
  const choice = within(screen.getByRole('group', { name: 'Choose a project' }));
  expect(document.activeElement).toBe(choice.getByRole('button', { name: 'Project A' }));
  expect(native.invoke.mock.calls.some(([command]) => command === 'pull_requests_read')).toBe(false);
  fireEvent.click(choice.getByRole('button', { name: 'Project B' }));
  const detail = await screen.findByRole('article', { name: 'Merged PR' });
  expect(within(detail).getByText('Merged')).toBeTruthy();
  expect(within(detail).getByText('Merged PR description')).toBeTruthy();
  expect(native.invoke).toHaveBeenCalledWith('pull_request_detail', expect.objectContaining({
    repository: 'me/shared', number: 4, expectedAccount: 'developer',
  }));
  expect(native.invoke.mock.calls.some(([command]) => command === 'pull_request_open')).toBe(false);
  expect(picker.getByRole('button', { name: 'Project B', current: true })).toBeTruthy();
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Pull Requests, 1 unread' })).toBeNull());
  fireEvent.click(within(detail).getByRole('button', { name: 'Open on GitHub' }));
  expect(native.invoke).toHaveBeenCalledWith('pull_request_open', { repository: 'me/shared', number: 4 });
  fireEvent.click(screen.getByRole('button', { name: 'Back to list' }));
  expect(screen.getByRole('tab', { name: /^Notifications/, selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: /^New comment/ })).toBeTruthy();
});

it('opens a toast from the workspace in the PR detail of its project', async () => {
  useUiStore.getState().setScreen('projects');
  useUiStore.getState().selectWorkspace('a', 'workspace-a');
  const client = new QueryClient();
  const snapshot = {
    account: 'developer',
    projects: {
      a: { repository: 'me/a', pulls: [] },
      b: { repository: 'me/b', pulls: [] },
    },
  };
  const notifications = [{ repository: 'me/b', projects: [{ id: 'b', name: 'Project B' }],
    event: { key: 'review', title: 'Check permissions', number: 9, kind: 'Review requested', read: false } }];
  let hasUpdate = false;
  native.invoke.mockImplementation(async (command) => command === 'pull_requests_refresh'
    ? { ...snapshot, notifications: hasUpdate ? notifications : [] } : undefined);
  render(<QueryClientProvider client={client}><TooltipProvider><AppShell /><Toaster /></TooltipProvider></QueryClientProvider>);
  const navigation = within(screen.getByRole('navigation', { name: 'Views' }));
  fireEvent.click(navigation.getByRole('button', { name: 'Pull Requests' }));
  await screen.findByRole('tab', { name: /^Notifications.*0/ });
  fireEvent.click(navigation.getByRole('button', { name: 'Projects' }));
  expect(screen.getByRole('region', { name: 'Active workspace' })).toBeTruthy();
  hasUpdate = true;
  await act(() => client.invalidateQueries({ queryKey: ['pull-requests'] }));
  fireEvent.click(await screen.findByRole('button', { name: 'View' }));
  expect(screen.getByRole('article', { name: 'Check permissions' })).toBeTruthy();
  const description = screen.getByRole('region', { name: 'Description' });
  expect(await within(description).findByText('Details are unavailable.')).toBeTruthy();
  expect(native.invoke.mock.calls.some(([command]) => command === 'pull_request_open')).toBe(false);
  expect(screen.getByRole('button', { name: 'Project B', current: true })).toBeTruthy();
  await waitFor(() => expect(screen.getByRole('tab', { name: /^Notifications.*0/ })).toBeTruthy());
  fireEvent.click(screen.getByRole('button', { name: 'Back to list' }));
  expect(screen.getByRole('tab', { name: 'Overview', selected: true })).toBeTruthy();
});

it('shows the same notification types in Overview, Notifications and toasts', async () => {
  useUiStore.getState().setScreen('projects');
  useUiStore.getState().selectWorkspace('a', 'workspace-a');
  const client = new QueryClient();
  const cases = [
    ['Review requested', 'Warning'],
    ['Changes requested', 'Warning'],
    ['Base branch update required', 'Warning'],
    ['Approved', 'Approved'],
    ['New comment', 'Info'],
    ['New review', 'Info'],
    ['Unknown event', 'Info'],
    ['CI failed', 'Error'],
  ];
  const notifications = cases.map(([kind], index) => ({
    repository: 'me/a',
    projects: [{ id: 'a', name: 'Project A' }],
    event: { key: String(index), title: `Change ${index}`, number: index + 1, kind, read: false },
  }));
  let visible = 0;
  native.invoke.mockImplementation(async (command) => command === 'pull_requests_refresh' ? {
    account: 'developer',
    projects: { a: { repository: 'me/a', pulls: [] }, b: { repository: 'me/b', pulls: [] } },
    notifications: notifications.slice(0, visible),
  } : undefined);
  render(<QueryClientProvider client={client}><TooltipProvider><AppShell /><Toaster /></TooltipProvider></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Pull Requests' }));
  await screen.findByRole('tab', { name: /^Notifications.*0/ });
  const section = screen.getByRole('region', { name: 'PR Notifications' });

  for (const [index, [kind, label]] of cases.entries()) {
    visible += 1;
    await act(() => client.invalidateQueries({ queryKey: ['pull-requests'] }));
    const toast = await screen.findByRole('status');
    expect(within(toast).getByText(label, { exact: true })).toBeTruthy();
    expect(toast.textContent).toContain(kind);
    fireEvent.click(within(toast).getByRole('button', { name: 'Dismiss' }));
    const row = within(section).getByRole('button', { name: new RegExp(`^${kind} · #${index + 1}`) });
    expect(within(row).getByText(label, { exact: true }).querySelector('svg')).toBeTruthy();
  }

  chooseView(/^Notifications.*8/);
  const list = screen.getByRole('region', { name: 'PR Notifications' });
  for (const [index, [kind, label]] of cases.entries()) {
    const row = within(list).getByRole('button', { name: new RegExp(`^${kind} · #${index + 1}`) });
    expect(within(row).getByText(label, { exact: true })).toBeTruthy();
  }
  fireEvent.click(within(list).getByRole('button', { name: 'Mark all as read' }));
  await waitFor(() => expect(within(list).queryByText('Unread', { exact: true })).toBeNull());
  expect(within(list).getAllByText('Warning', { exact: true })).toHaveLength(3);
  fireEvent.click(within(list).getByRole('button', { name: 'Mark all as unread' }));
  await waitFor(() => expect(within(list).getAllByText('Unread', { exact: true })).toHaveLength(8));
  expect(within(list).getAllByText('Warning', { exact: true })).toHaveLength(3);
});

const emptyDetail = {
  headSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  body: '',
  checks: { data: { state: null, items: [] } },
  workflows: { data: [] },
  threads: { data: [] },
  reviews: { data: [] },
};

function detailFixture() {
  const pull = { number: 4, isDraft: false, reviewDecision: 'REVIEW_REQUIRED', ci: 'PENDING',
    mergeStateStatus: 'CLEAN', baseRefName: 'main', role: 'authored', headRefOid: emptyDetail.headSha };
  return {
    account: 'developer', notifications: [],
    projects: {
      a: { repository: 'me/a', pulls: [{ ...pull, title: 'Change in A' }] },
      b: { repository: 'me/b', pulls: [{ ...pull, title: 'Change in B' }] },
    },
  };
}

function renderDetailsShell() {
  useUiStore.getState().setScreen('projects');
  useUiStore.getState().selectWorkspace('a', 'workspace-a');
  render(<QueryClientProvider client={new QueryClient()}><TooltipProvider><AppShell /></TooltipProvider></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Pull Requests' }));
}

it.each(['loading', 'failed'])('returns to the list when PR detail status is %s', async (state) => {
  native.invoke.mockImplementation(async (command) => {
    if (command === 'pull_requests_refresh') return detailFixture();
    if (command !== 'pull_request_detail') return;
    if (state === 'failed') throw new Error('Details unavailable');
    return new Promise(() => {});
  });
  renderDetailsShell();
  fireEvent.click(await screen.findByRole('button', { name: /^Change in A/ }));
  const message = state === 'failed' ? 'Details unavailable' : 'Loading details…';
  expect((await screen.findAllByText(message)).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: 'Back to list' }));
  expect(screen.queryByRole('article', { name: 'Change in A' })).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Change in A/ }));
});

it('reads Markdown and review threads and shows CI steps for parallel jobs and the current attempt', async () => {
  let attempt = 1;
  native.invoke.mockImplementation(async (command) => {
    if (command === 'pull_requests_refresh') return detailFixture();
    if (command !== 'pull_request_detail') return;
    return {
      ...emptyDetail,
      body: '## How to test\n\n- Run tests\n\n```sh\ncheck-pr\n```\n\n[Docs](https://example.org/docs) [Unsafe](javascript:alert%281%29) <script>hidden()</script>',
      checks: { data: { state: 'PENDING', items: [{ id: 'lint', context: 'External lint', state: 'SUCCESS', targetUrl: 'https://example.org/ci' }] } },
      workflows: { data: [{
        id: 1, name: 'Test workflow', run_attempt: attempt, html_url: 'https://github.com/me/a/actions/runs/1',
        status: 'in_progress', jobs: { data: [
          { id: 2, name: 'macOS', status: 'in_progress', steps: [
            { number: 1, name: 'Install', status: 'completed', conclusion: 'success' },
            { number: 2, name: attempt === 1 ? 'Unit tests' : 'Rerun unit tests', status: 'in_progress' },
          ] },
          { id: 3, name: 'Linux', status: 'in_progress', steps: [{ number: 1, name: 'Integration tests', status: 'in_progress' }] },
        ] },
      }] },
      threads: { data: [
        { id: 'open', path: 'src/main.rs', line: 5, isResolved: false, comments: [
          { id: 'comment', author: { login: 'reviewer' }, body: 'Please split this check.' },
          { id: 'reply', author: { login: 'developer' }, body: 'I will update it.' },
        ] },
        { id: 'closed', path: 'src/old.rs', originalLine: 9, isResolved: true, isOutdated: true, comments: [
          { id: 'closed-comment', body: 'Resolved behavior' },
        ] },
      ] },
      reviews: { data: [{ id: 1, body: 'Review summary text', user: { login: 'lead' }, state: 'CHANGES_REQUESTED' }] },
    };
  });
  renderDetailsShell();
  fireEvent.click(await screen.findByRole('button', { name: /^Change in A/ }));
  const description = within(await screen.findByRole('region', { name: 'Description' }));
  expect(await description.findByRole('heading', { name: 'How to test' })).toBeTruthy();
  expect(description.getByText('check-pr').tagName).toBe('CODE');
  expect(description.getByRole('link', { name: 'Docs' }).getAttribute('href')).toBe('https://example.org/docs');
  expect(description.queryByRole('link', { name: 'Unsafe' })).toBeNull();
  expect(description.queryByText('hidden()')).toBeNull();

  const review = within(screen.getByRole('region', { name: 'Review Comments' }));
  expect(review.getByText('Review summary text')).toBeTruthy();
  expect(review.getByText('src/main.rs:5').closest('details')?.nextElementSibling?.textContent).toContain('src/old.rs:9');
  expect(review.getByText('Please split this check.').nextElementSibling).toBeNull();
  expect(review.getByText('I will update it.')).toBeTruthy();
  expect(review.getByText('Outdated')).toBeTruthy();

  const progress = within(screen.getByRole('region', { name: 'Progress' }));
  const workflow = progress.getByText('Test workflow').closest('details')!;
  const mac = progress.getByText('macOS').closest('details')!;
  workflow.open = true;
  mac.open = true;
  expect(progress.getByText('Unit tests (2/2)')).toBeTruthy();
  expect(progress.getByText('Integration tests (1/1)')).toBeTruthy();
  expect(progress.getByText('External lint')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh details' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh details' })).toBeTruthy());
  expect(workflow.open && mac.open).toBe(true);
  attempt = 2;
  fireEvent.click(screen.getByRole('button', { name: 'Refresh details' }));
  expect(await progress.findByText('Attempt 2')).toBeTruthy();
  expect(progress.queryByText('Unit tests (2/2)', { exact: true })).toBeNull();
  expect(progress.getByText('Rerun unit tests (2/2)')).toBeTruthy();
});

it('drops late results from another repository and removes details on access loss', async () => {
  let finishA: (value: typeof emptyDetail) => void = () => {};
  let revoked = false;
  native.invoke.mockImplementation(async (command, args) => {
    if (command === 'pull_requests_refresh') return detailFixture();
    if (command !== 'pull_request_detail') return;
    if (args.repository === 'me/a') return new Promise((resolve) => { finishA = resolve; });
    if (revoked) throw { code: 'access', message: 'Access denied.' };
    return { ...emptyDetail, body: 'Details from B', workflows: { error: { code: 'access', message: 'Actions unavailable' } } };
  });
  renderDetailsShell();
  fireEvent.click(await screen.findByRole('button', { name: /^Change in A/ }));
  await waitFor(() => expect(native.invoke).toHaveBeenCalledWith('pull_request_detail', expect.objectContaining({ repository: 'me/a' })));
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Select project' })).getByRole('button', { name: 'Project B' }));
  fireEvent.click(screen.getByRole('button', { name: /^Change in B/ }));
  expect(await screen.findByText('Details from B')).toBeTruthy();
  await act(async () => finishA({ ...emptyDetail, body: 'Private details from A' }));
  expect(screen.queryByText('Private details from A')).toBeNull();
  revoked = true;
  fireEvent.click(screen.getByRole('button', { name: 'Refresh details' }));
  await waitFor(() => expect(screen.queryByText('Details from B')).toBeNull());
});

it('reuses review details when reopening a PR and polls while it is open', async () => {
  let polls = 0;
  native.invoke.mockImplementation(async (command) => {
    if (command === 'pull_requests_refresh') return detailFixture();
    if (command === 'pull_request_detail') return { ...emptyDetail, body: `Details revision ${++polls}` };
  });
  renderDetailsShell();
  fireEvent.click(await screen.findByRole('button', { name: /^Change in A/ }));
  expect(await screen.findByText('Details revision 1')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Back to list' }));
  fireEvent.click(screen.getByRole('button', { name: /^Change in A/ }));
  expect(screen.getByText('Details revision 1')).toBeTruthy();
  expect(polls).toBe(1);
  expect(await screen.findByText('Details revision 2', {}, { timeout: 6500 })).toBeTruthy();
}, 9000);
