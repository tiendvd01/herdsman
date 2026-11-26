import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { useFileStore } from '@/stores/useFileStore';

const native = vi.hoisted(() => ({
  invoke: vi.fn(async () => {}),
  listen: vi.fn(async (_name: string, _callback: () => void) => () => {}),
  onCloseRequested: vi.fn(async (_callback: (event: { preventDefault: () => void }) => void) => () => {}),
}));

vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => true, invoke: native.invoke }));
vi.mock('@tauri-apps/api/event', () => ({ listen: native.listen }));
vi.mock('@tauri-apps/api/window', () => ({ getCurrentWindow: () => ({ onCloseRequested: native.onCloseRequested }) }));
vi.mock('@/components/layout/PullRequests', () => ({ usePullRequests: () => ({ unread: 0, projectQuery: { data: [] } }) }));
vi.mock('@/components/layout/NavigationRail', () => ({ NavigationRail: () => null }));
vi.mock('@/components/layout/StatusBar', () => ({ StatusBar: () => null }));
vi.mock('@/components/layout/Sidebar', () => ({ Sidebar: () => null }));
vi.mock('@/components/layout/WorkspaceView', () => ({ WorkspaceView: () => null }));
vi.mock('@/components/layout/ZoomIndicator', () => ({ ZoomIndicator: () => null }));
vi.mock('@/components/panels/RightPanel', () => ({ RightPanel: () => null }));
vi.mock('@/lib/zoomShortcuts', () => ({ useZoomEffect: () => {} }));

afterEach(() => {
  cleanup();
  useFileStore.setState({ tabs: [], active: {} });
  vi.clearAllMocks();
});

it('holds a native close request until the file draft has been reviewed', async () => {
  useFileStore.setState({ tabs: [
    { id: 'one', projectId: 'p', path: 'note.txt', name: 'note.txt',
      document: { text: 'saved', writable: true }, draft: 'unsaved' },
  ] });
  render(<QueryClientProvider client={new QueryClient()}><AppShell /></QueryClientProvider>);
  const preventDefault = vi.fn();
  const closeRequested = native.onCloseRequested.mock.calls[0][0];
  act(() => closeRequested({ preventDefault }));
  expect(preventDefault).toHaveBeenCalledTimes(1);
  expect(native.invoke).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(useFileStore.getState().tabs[0].draft).toBe('unsaved');
  expect(native.invoke).not.toHaveBeenCalled();

  act(() => native.listen.mock.calls[0][1]());
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(native.invoke).toHaveBeenCalledWith('exit_after_file_review'));
  expect(native.invoke).toHaveBeenNthCalledWith(1, 'project_file_save', {
    projectId: 'p', path: 'note.txt', baseline: 'saved', text: 'unsaved',
  });
  expect(useFileStore.getState().tabs).toEqual([]);
});
