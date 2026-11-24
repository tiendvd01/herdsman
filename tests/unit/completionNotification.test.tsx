import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PropsWithChildren } from 'react';
import { useBackendEvents } from '@/lib/events';
import { useUiStore } from '@/stores/useUiStore';

const { listeners, send, granted, request } = vi.hoisted(() => ({
  listeners: new Map<string, (event: { payload: unknown }) => void>(),
  send: vi.fn(),
  granted: vi.fn(),
  request: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: async (name: string, fn: (event: { payload: unknown }) => void) => {
    listeners.set(name, fn);
    return () => listeners.delete(name);
  },
}));
vi.mock('@tauri-apps/plugin-notification', () => ({
  isPermissionGranted: granted,
  requestPermission: request,
  sendNotification: send,
}));
vi.mock('@/lib/api', () => ({ api: { sessionGet: async () => ({ title: 'Build project' }) } }));
vi.mock('@/lib/platform', () => ({ IS_MAC: true }));

function mountEvents() {
  const qc = new QueryClient();
  renderHook(useBackendEvents, {
    wrapper: ({ children }: PropsWithChildren) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
  });
}

function status(id: string, state: string, completion?: { seq: number; ts: number; title: string | null }) {
  listeners.get('status:changed')?.({ payload: { session_id: id, workspace_id: 'workspace', state, completion } });
}

beforeEach(() => {
  vi.clearAllMocks();
  useUiStore.setState({ completionNotifications: true, completionSound: true, statuses: {} });
  granted.mockResolvedValue(true);
  request.mockResolvedValue('denied');
});

afterEach(() => vi.restoreAllMocks());

it('notifies once per successful turn with sound across focus and sessions', async () => {
  const focus = vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  mountEvents();
  const completed = { seq: 5, ts: Date.now(), title: 'Build project' };
  act(() => {
    status('first', 'idle', completed);
    status('first', 'idle', completed);
  });
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  expect(send).toHaveBeenLastCalledWith({ title: 'Agent finished', body: 'Build project', sound: 'Tink' });

  focus.mockReturnValue(false);
  act(() => {
    status('second', 'idle', { ...completed, title: null });
    status('first', 'idle', { ...completed, seq: 9 });
    status('first', 'idle', completed);
  });
  await waitFor(() => expect(send).toHaveBeenCalledTimes(3));
  expect(send).toHaveBeenCalledWith({ title: 'Agent finished', body: 'Session', sound: 'Tink' });
  expect(useUiStore.getState().statuses.first).toMatchObject({ completionSeq: 9, completionTs: completed.ts });
});

it('ignores historical completion and terminal exit and respects denied permission', async () => {
  granted.mockResolvedValue(false);
  vi.spyOn(document, 'hasFocus').mockReturnValue(false);
  mountEvents();
  act(() => {
    status('old', 'idle', { seq: 17, ts: performance.timeOrigin - 1, title: 'Old task' });
    status('closing', 'working');
    status('closing', 'done');
  });
  expect(granted).not.toHaveBeenCalled();

  await act(async () => {
    status('denied', 'idle', { seq: 5, ts: Date.now(), title: null });
  });
  expect(request).toHaveBeenCalledOnce();
  expect(send).not.toHaveBeenCalled();
});

it('applies live preferences without replaying muted completions or suppressing approval alerts', async () => {
  vi.spyOn(document, 'hasFocus').mockReturnValue(false);
  mountEvents();
  const completion = { seq: 1, ts: Date.now(), title: 'Build project' };

  act(() => {
    status('preferences', 'working');
    useUiStore.getState().setCompletionSound(false);
    status('preferences', 'idle', completion);
  });
  await waitFor(() => expect(send).toHaveBeenCalledWith({ title: 'Agent finished', body: 'Build project' }));

  act(() => {
    useUiStore.getState().setCompletionNotifications(false);
    status('preferences', 'idle', { ...completion, seq: 2 });
    status('needs-approval', 'working');
    status('needs-approval', 'blocked');
  });
  await waitFor(() => expect(send).toHaveBeenCalledWith({ title: 'Agent needs your approval', body: 'Build project' }));
  expect(send).toHaveBeenCalledTimes(2);
  expect(useUiStore.getState().statuses.preferences?.state).toBe('idle');

  act(() => {
    useUiStore.getState().setCompletionNotifications(true);
    status('preferences', 'idle', { ...completion, seq: 2 });
    status('preferences', 'idle', { ...completion, seq: 3 });
  });
  await waitFor(() => expect(send).toHaveBeenCalledTimes(3));
  expect(send).toHaveBeenLastCalledWith({ title: 'Agent finished', body: 'Build project' });
});
