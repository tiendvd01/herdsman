// Spec 002: workspace menu in the sidebar — labels, items, and deleting a workspace that is not open keeps the current selection.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Workspace } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  api: {
    workspaceDelete: vi.fn(async () => undefined),
    workspaceArchive: vi.fn(async () => ({})),
    workspaceRename: vi.fn(async () => ({})),
    workspaceDirtyCheck: vi.fn(async () => ({ dirty: false, files: [] })),
  },
  errMsg: (e: unknown) => String(e),
}));

import { api } from '@/lib/api';
import { WorkspaceMenu } from '@/components/workspace/WorkspaceMenu';
import { useUiStore } from '@/stores/useUiStore';

beforeAll(() => {
  // Radix popper needs these in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.scrollIntoView ??= () => {};
});

const ws = (id: string, name: string): Workspace => ({
  id,
  project_id: 'p1',
  name,
  dir_kind: 'project',
  work_dir: '/tmp/p1',
  branch: null,
  base_branch: null,
  archived_at: null,
  worktree_removed: false,
  created_at: 0,
});

function renderMenu(w: Workspace) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <WorkspaceMenu ws={w} variant="sidebar" />
    </QueryClientProvider>,
  );
}

async function openMenu(name: string) {
  const trigger = screen.getByRole('button', { name: `Options for workspace ${name}` });
  fireEvent.keyDown(trigger, { key: 'Enter' });
  await screen.findByRole('menu');
}

describe('WorkspaceMenu (sidebar)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({ projectId: 'p1', workspaceId: 'open-ws' });
  });

  it('labels the trigger with the workspace name and lists Rename, Archive, Delete workspace', async () => {
    renderMenu(ws('other', 'Refactor store'));
    await openMenu('Refactor store');
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Delete workspace' })).toBeTruthy();
  });

  it('deleting a workspace that is not open keeps the open workspace selected', async () => {
    renderMenu(ws('other', 'Refactor store'));
    await openMenu('Refactor store');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete workspace' }));
    const confirm = await screen.findByRole('button', { name: 'Delete' });
    fireEvent.click(confirm);
    await waitFor(() => expect(api.workspaceDelete).toHaveBeenCalledWith('other', false, false));
    expect(useUiStore.getState().workspaceId).toBe('open-ws');
  });

  it('deleting the open workspace clears the selection', async () => {
    useUiStore.setState({ workspaceId: 'other' });
    renderMenu(ws('other', 'Refactor store'));
    await openMenu('Refactor store');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete workspace' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(useUiStore.getState().workspaceId).toBeNull());
  });
});
