// Bridges events from the Rust backend into stores/query cache, plus OS notifications (FR-020).
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useQueryClient } from '@tanstack/react-query';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { useSessionStore } from '@/stores/useSessionStore';
import { useUiStore } from '@/stores/useUiStore';
import { qk } from './queries';
import type { AgentEvent, SessionStatus } from './types';

const NOTIFY: Partial<Record<SessionStatus, string>> = {
  done: 'Agent finished',
  blocked: 'Agent needs your approval',
  error: 'Agent hit an error',
};

let notifyReady: Promise<boolean> | null = null;
async function notify(title: string, body: string) {
  notifyReady ??= (async () => (await isPermissionGranted()) || (await requestPermission()) === 'granted')();
  if (await notifyReady) sendNotification({ title, body });
}

export function useBackendEvents() {
  const qc = useQueryClient();
  useEffect(() => {
    const offs = [
      listen<{ session_id: string; events: AgentEvent[]; closed?: boolean; error?: { message: string } }>('session:events', (e) => {
        const { session_id, events, closed, error } = e.payload;
        useSessionStore.getState().applyEvents(session_id, events, { closed, error: error?.message });
      }),
      listen<{ session_id: string; workspace_id: string; state: SessionStatus; kind?: string | null }>('status:changed', (e) => {
        const { session_id, workspace_id, state, kind } = e.payload;
        const prev = useUiStore.getState().statuses[session_id]?.state;
        useUiStore.getState().setStatus(session_id, { state, kind, workspace_id });
        qc.invalidateQueries({ queryKey: qk.sessions(workspace_id) });
        const title = NOTIFY[state];
        if (title && prev && prev !== state && !document.hasFocus()) {
          qc.fetchQuery({ queryKey: ['session', session_id], queryFn: () => import('./api').then((m) => m.api.sessionGet(session_id)) })
            .then((s) => notify(title, s.title ?? 'Session'))
            .catch(() => notify(title, 'Session'));
        }
      }),
      listen('workspace:changed', () => {
        qc.invalidateQueries({ queryKey: qk.allWorkspaces });
        qc.invalidateQueries({ queryKey: qk.allSessions });
      }),
      listen('hc:connection', () => qc.invalidateQueries({ queryKey: qk.appInfo })),
      listen('tasks:changed', () => qc.invalidateQueries({ queryKey: ['tasks'] })),
      listen('agents:changed', () => qc.invalidateQueries({ queryKey: ['agentTree'] })),
    ];
    return () => {
      offs.forEach((p) => p.then((off) => off()));
    };
  }, [qc]);
}
