// Actions shared by the sidebar, header and command menu.
import type { QueryClient } from '@tanstack/react-query';
import { api, errMsg } from './api';
import { qk } from './queries';
import type { ClaudeHit, Engine, Session, Workspace } from './types';
import { useUiStore, type Theme } from '@/stores/useUiStore';
import { toast } from '@/components/ui/toast';

export async function createWorkspaceSession(qc: QueryClient, workspaceId: string, engine: Engine, title?: string) {
  const session = await api.sessionCreate(workspaceId, engine, undefined, title);
  // WorkspacePane needs the new ID in the cache before it can select it.
  qc.setQueryData<Session[]>(qk.sessions(workspaceId), (old) => [
    ...(old ?? []).filter((s) => s.id !== session.id),
    session,
  ]);
  void qc.invalidateQueries({ queryKey: qk.sessions(workspaceId) });
  return session;
}

export async function createSession(qc: QueryClient, workspaceId: string, engine: Engine = 'claude') {
  try {
    const s = await createWorkspaceSession(qc, workspaceId, engine);
    useUiStore.getState().selectSession(workspaceId, s.id);
    return s;
  } catch (e) {
    toast(errMsg(e), 'error');
  }
}

export async function openStoredSession(qc: QueryClient, { workspace, session }: { workspace: Workspace; session: Session }) {
  const { id, project_id: projectId } = workspace;
  const ui = useUiStore.getState();
  qc.setQueryData<Workspace[]>(qk.workspaces(projectId, true), (old) =>
    [workspace, ...(old ?? []).filter((w) => w.id !== id)]);
  qc.setQueryData<Session[]>(qk.sessions(id), (old) =>
    [session, ...(old ?? []).filter((s) => s.id !== session.id)]);
  if (session.status === 'done') {
    ui.setStatus(session.id, { state: 'done' });
    ui.addTempTab(id, session.id);
  }
  if (workspace.deleted_at != null) ui.selectWorkspace(projectId, id);
  else ui.reopenWorkspace(projectId, id);
  ui.selectSession(id, session.id);
  await Promise.all([
    qc.invalidateQueries({ queryKey: qk.projects }),
    qc.invalidateQueries({ queryKey: qk.allWorkspaces }),
    qc.invalidateQueries({ queryKey: qk.allSessions }),
    qc.invalidateQueries({ queryKey: ['palette-search'] }),
  ]);
}

export async function openClaudeConversation(qc: QueryClient, hit: ClaudeHit) {
  try {
    await openStoredSession(qc, await api.claudeOpen(hit.claude_session_id, hit.workspace_id ?? undefined));
  } catch (e) {
    toast(errMsg(e), 'error');
  }
}

const NEXT_THEME: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };

export function cycleTheme() {
  const ui = useUiStore.getState();
  ui.setTheme(NEXT_THEME[ui.theme]);
}
