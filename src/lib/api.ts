// Wrapper có kiểu cho các Tauri command (contracts/tauri-commands.md).
import { invoke } from '@tauri-apps/api/core';
import type {
  ModelList,
  SlashCommandInfo,
  AgentNode,
  AppInfo,
  ThemeFile,
  BranchInfo,
  ChangedFile,
  Engine,
  PermissionMode,
  Project,
  RunningRef,
  SearchHit,
  ClaudeHit,
  Session,
  TaskRef,
  Workspace,
} from './types';

export interface ApiError {
  code: string;
  message: string;
}

export function errMsg(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as ApiError).message);
  return String(e);
}

export function errCode(e: unknown): string | undefined {
  if (e && typeof e === 'object' && 'code' in e) return String((e as ApiError).code);
  return undefined;
}

export type DirChoice = { kind: 'project' } | { kind: 'worktree'; base_branch: string; branch?: string };

export interface ProjectFileEntry {
  name: string;
  path: string;
  directory: boolean;
}

export interface ProjectFileDocument {
  text: string;
  writable: boolean;
}

export const api = {
  projectFiles: (projectId: string, path: string) =>
    invoke<ProjectFileEntry[]>('project_files_list', { projectId, path }),
  projectFileRead: (projectId: string, path: string) =>
    invoke<ProjectFileDocument>('project_file_read', { projectId, path }),
  projectFileSave: (projectId: string, path: string, baseline: string, text: string) =>
    invoke<void>('project_file_save', { projectId, path, baseline, text }),

  appInfo: () => invoke<AppInfo>('app_info'),
  fontFamilies: () => invoke<string[]>('font_families'),
  themeFiles: () => invoke<ThemeFile[]>('theme_files'),
  settingsGet: (key: string) => invoke<string | null>('settings_get', { key }),
  settingsSet: (key: string, value: string) => invoke<void>('settings_set', { key, value }),

  projectList: () => invoke<Project[]>('project_list'),
  projectAdd: (path: string) => invoke<Project>('project_add', { path }),
  projectRename: (id: string, name: string) => invoke<Project>('project_rename', { id, name }),
  projectDeletePreview: (id: string) => invoke<RunningRef[]>('project_delete_preview', { id }),
  projectDelete: (id: string) => invoke<void>('project_delete', { id, confirm: true }),

  workspaceList: (projectId?: string, includeArchived = false) =>
    invoke<Workspace[]>('workspace_list', { projectId, includeArchived }),
  workspaceCreate: (args: {
    projectId: string;
    name?: string;
    dir: DirChoice;
    engine: Engine;
    permissionMode?: PermissionMode;
  }) => invoke<{ workspace: Workspace; session: Session }>('workspace_create', args),
  workspaceRename: (id: string, name: string) => invoke<Workspace>('workspace_rename', { id, name }),
  workspaceDirtyCheck: (id: string) => invoke<{ dirty: boolean; files: string[] }>('workspace_dirty_check', { id }),
  workspaceArchive: (id: string, removeWorktreeDir: boolean, confirmDirty = false) =>
    invoke<Workspace>('workspace_archive', { id, removeWorktreeDir, confirmDirty }),
  workspaceUnarchive: (id: string) => invoke<Workspace>('workspace_unarchive', { id }),
  workspaceDelete: (id: string, removeWorktreeDir: boolean, confirmDirty = false) =>
    invoke<void>('workspace_delete', { id, removeWorktreeDir, confirmDirty }),
  gitBranches: (projectId: string) => invoke<BranchInfo>('git_branches', { projectId }),

  sessionHistory: (workspaceId: string) => invoke<Session[]>('session_history', { workspaceId }),
  sessionGet: (id: string) => invoke<Session>('session_get', { id }),
  sessionCreate: (workspaceId: string, engine: Engine, permissionMode?: PermissionMode, title?: string) =>
    invoke<Session>('session_create', { workspaceId, engine, permissionMode, title }),
  sessionOpen: (id: string) => invoke<void>('session_open', { id }),
  sessionCloseView: (id: string) => invoke<void>('session_close_view', { id }),
  sessionPrompt: (id: string, text: string, images?: { media_type: string; data_b64: string }[]) =>
    invoke<void>('session_prompt', { id, text, images }),
  sessionImage: (id: string, attachmentId: string) =>
    invoke<string>('session_image', { id, attachmentId }),
  sessionInterrupt: (id: string) => invoke<void>('session_interrupt', { id }),
  sessionPermission: (id: string, requestId: string, decision: 'allow' | 'deny') =>
    invoke<void>('session_permission', { id, requestId, decision }),
  sessionSetPermissionMode: (id: string, mode: PermissionMode, confirmBypass = false) =>
    invoke<void>('session_set_permission_mode', { id, mode, confirmBypass }),
  sessionListModels: (id: string) => invoke<ModelList>('session_list_models', { id }),
  sessionListCommands: (id: string) => invoke<{ commands: SlashCommandInfo[] }>('session_list_commands', { id }),
  sessionSetModel: (id: string, model: string) => invoke<void>('session_set_model', { id, model }),
  sessionResume: (id: string) => invoke<Session>('session_resume', { id }),
  sessionClose: (id: string) => invoke<void>('session_close', { id }),
  sessionKill: (id: string) => invoke<void>('session_kill', { id }),
  sessionSetPinned: (id: string, pinned: boolean) => invoke<void>('session_set_pinned', { id, pinned }),
  search: (query: string, workspaceId?: string, projectId?: string) => invoke<SearchHit[]>('search', { query, workspaceId, projectId }),
  claudeSearch: (query: string, scope?: { workspaceId?: string; projectId?: string }) =>
    invoke<ClaudeHit[]>('claude_search', { query, ...scope, palette: !!scope }),
  claudeOpen: (claudeSessionId: string, cwd: string, workspaceId?: string) =>
    invoke<Session>('claude_open', { claudeSessionId, cwd, workspaceId }),

  terminalRead: (terminal: string, lines = 2000) => invoke<string>('terminal_read', { terminal, lines }),
  taskRun: (projectId: string, command: string) => invoke<TaskRef>('task_run', { projectId, command }),
  taskList: (projectId: string) => invoke<TaskRef[]>('task_list', { projectId }),
  taskKill: (terminal: string) => invoke<void>('task_kill', { terminal }),
  taskRemove: (terminal: string) => invoke<void>('task_remove', { terminal }),
  agentTree: (sessionId: string) => invoke<AgentNode | null>('agent_tree', { sessionId }),
  filesChanged: (workspaceId: string) => invoke<ChangedFile[]>('files_changed', { workspaceId }),
  projectFilesChanged: (projectId: string) => invoke<ChangedFile[]>('project_files_changed', { projectId }),
  fileDiff: (workspaceId: string, path: string) => invoke<string>('file_diff', { workspaceId, path }),
};
