// Actions shared by the sidebar, header and command menu.
import type { QueryClient } from '@tanstack/react-query';
import { api, errMsg } from './api';
import { qk } from './queries';
import type { ClaudeHit, Engine, Session } from './types';
import { useUiStore, type Theme } from '@/stores/useUiStore';
import { toast } from '@/components/ui/toast';

export async function createSession(qc: QueryClient, workspaceId: string, engine: Engine = 'claude') {
  try {
    const s = await api.sessionCreate(workspaceId, engine);
    // Put the new session in the cache before selecting it: otherwise WorkspacePane sees an
    // unknown `current` id until the refetch lands and falls back to the first tab.
    qc.setQueryData<Session[]>(qk.sessions(workspaceId), (old) => (old ? [...old.filter((x) => x.id !== s.id), s] : [s]));
    useUiStore.getState().selectSession(workspaceId, s.id);
    qc.invalidateQueries({ queryKey: qk.sessions(workspaceId) });
  } catch (e) {
    toast(errMsg(e), 'error');
  }
}

/** Open a Claude Code conversation found by search: reuse its Herdsman session or resume it in a new one. */
export async function openClaudeConversation(qc: QueryClient, hit: ClaudeHit) {
  if (!hit.cwd || !hit.workspace_id || !hit.project_id) {
    toast('Add this conversation’s folder as a project/workspace to open it here', 'error');
    return;
  }
  try {
    const s = await api.claudeOpen(hit.claude_session_id, hit.cwd);
    qc.setQueryData<Session[]>(qk.sessions(s.workspace_id), (old) => (old ? [...old.filter((x) => x.id !== s.id), s] : [s]));
    const ui = useUiStore.getState();
    ui.selectWorkspace(hit.project_id, s.workspace_id);
    if (s.status === 'done') ui.addTempTab(s.workspace_id, s.id);
    ui.selectSession(s.workspace_id, s.id);
    qc.invalidateQueries({ queryKey: qk.sessions(s.workspace_id) });
  } catch (e) {
    toast(errMsg(e), 'error');
  }
}

const NEXT_THEME: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };

export function cycleTheme() {
  const ui = useUiStore.getState();
  ui.setTheme(NEXT_THEME[ui.theme]);
}
