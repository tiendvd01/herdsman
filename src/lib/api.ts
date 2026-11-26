// Wrapper có kiểu cho các Tauri command (contracts/tauri-commands.md).
import { Channel, invoke } from '@tauri-apps/api/core';
import type {
  ModelList,
  SlashCommandInfo,
  AgentNode,
  AppInfo,
  ThemeFile,
  BranchInfo,
  GitHistory,
  ChangedFile,
  Engine,
  PermissionMode,
  Project,
  SearchHit,
  StoredHistoryEntry,
  ClaudeHit,
  Session,
  Workspace,
} from './types';

export interface ProjectSkillId {
  source_id: string;
  directory: string;
}

export interface ProjectSkillCatalog {
  sources: { id: string; path: string; available: boolean }[];
  skills: (ProjectSkillId & {
    name: string;
    description: string;
    path: string;
    enabled: boolean;
    native: boolean;
    global: boolean;
    reason: string | null;
  })[];
  enabled: ProjectSkillId[];
}

export type ProjectSkillChange =
  | { kind: 'add'; path: string }
  | ({ kind: 'set'; enabled: boolean } & ProjectSkillId)
  | { kind: 'remove'; source_id: string; confirmed: string[] };

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

export type DirChoice =
  | { kind: 'project' }
  | { kind: 'worktree'; base_branch?: string; branch?: string }
  | { kind: 'existing_worktree'; branch: string };

export interface ProjectFileEntry {
  name: string;
  path: string;
  directory: boolean;
  ignored?: boolean;
}

export interface ProjectFileDocument {
  text: string;
  writable: boolean;
}

export interface WorkspaceTerminalRef {
  address: string;
  state: string;
}

export const api = {
  workspaceTerminalList: (workspaceId: string) =>
    invoke<WorkspaceTerminalRef[]>('workspace_terminal_list', { workspaceId }),
  workspaceTerminalCreate: (workspaceId: string) =>
    invoke<WorkspaceTerminalRef>('workspace_terminal_create', { workspaceId }),
  workspaceTerminalStop: (workspaceId: string, address: string) =>
    invoke<void>('workspace_terminal_stop', { workspaceId, address }),
  workspaceTerminalAttach: (id: string, workspaceId: string, address: string, rows: number, cols: number, onOutput: (bytes: ArrayBuffer) => void) =>
    invoke<void>('workspace_terminal_attach', { id, workspaceId, address, rows, cols, output: new Channel(onOutput) }),
  workspaceTerminalDetach: (id: string) => invoke<void>('workspace_terminal_detach', { id }),
  workspaceTerminalInput: (id: string, data: Uint8Array) =>
    invoke<void>('workspace_terminal_input', { id, data: Array.from(data) }),
  workspaceTerminalResize: (id: string, rows: number, cols: number) =>
    invoke<void>('workspace_terminal_resize', { id, rows, cols }),

  projectFiles: (projectId: string, path: string) =>
    invoke<ProjectFileEntry[]>('project_files_list', { projectId, path }),
  projectFilesSearch: (projectId: string, query: string) =>
    invoke<ProjectFileEntry[]>('project_files_search', { projectId, query }),
  projectFileRead: (projectId: string, path: string) =>
    invoke<ProjectFileDocument>('project_file_read', { projectId, path }),
  sessionFileExists: (sessionId: string, path: string) =>
    invoke<boolean>('session_file_exists', { sessionId, path }),
  sessionFileRead: (sessionId: string, path: string) =>
    invoke<{ projectId: string; path: string; document: ProjectFileDocument }>('session_file_read', { sessionId, path }),
  absoluteFileRead: (path: string) =>
    invoke<ProjectFileDocument>('absolute_file_read', { path }),
  absoluteFilesSearch: (path: string) =>
    invoke<ProjectFileEntry[]>('absolute_files_search', { path }),
  projectFileSave: (projectId: string, path: string, baseline: string, text: string) =>
    invoke<void>('project_file_save', { projectId, path, baseline, text }),
  projectMarkdownDownload: (projectId: string, path: string, text: string) =>
    invoke<void>('project_markdown_download', { projectId, path, text }),

  appInfo: () => invoke<AppInfo>('app_info'),
  fontFamilies: () => invoke<string[]>('font_families'),
  terminalFontData: (family: string) => invoke<ArrayBuffer>('terminal_font_data', { family }),
  themeFiles: () => invoke<ThemeFile[]>('theme_files'),
  notificationsRequestPermission: () => invoke<void>('notifications_request_permission'),
  settingsGet: (key: string) => invoke<string | null>('settings_get', { key }),
  settingsSet: (key: string, value: string) => invoke<void>('settings_set', { key, value }),

  projectSkillCatalog: (projectId: string) =>
    invoke<ProjectSkillCatalog>('project_skill_catalog', { projectId }),
  projectSkillChange: (projectId: string, change: ProjectSkillChange) =>
    invoke<void>('project_skill_change', { projectId, change }),
  projectList: () => invoke<Project[]>('project_list'),
  projectAdd: (path: string) => invoke<Project>('project_add', { path }),
  projectRename: (id: string, name: string) => invoke<Project>('project_rename', { id, name }),
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
  historyStored: (query: string, workspaceId?: string) =>
    invoke<StoredHistoryEntry[]>('history_stored', { query, workspaceId }),
  historyClaude: (query: string, workspaceId?: string) =>
    invoke<{ hits: ClaudeHit[]; partial: boolean }>('history_claude', { query, workspaceId }),
  claudeSearch: (query: string, scope?: { workspaceId?: string; projectId?: string }) =>
    invoke<ClaudeHit[]>('claude_search', { query, ...scope, palette: !!scope }),
  codexThreads: (workspaceId: string) => invoke<{ id: string; name: string }[]>('codex_threads', { workspaceId }),
  codexOpen: (workspaceId: string, threadId: string) => invoke<Session>('codex_open', { workspaceId, threadId }),
  claudeOpen: (claudeSessionId: string, workspaceId?: string) =>
    invoke<{ workspace: Workspace; session: Session }>('claude_open', { claudeSessionId, workspaceId }),
  sessionRehome: (id: string) => invoke<{ workspace: Workspace; session: Session }>('session_rehome', { id }),

  hcOutputTarget: (sessionId: string, toolId: string) => invoke<string>('hc_output_target', { sessionId, toolId }),
  hcOutputOpen: (sessionId: string, toolId: string, target: string) => invoke<void>('hc_output_open', { sessionId, toolId, target }),
  hcOutputRead: () => invoke<{ terminal: { address: string; name?: string; state: string; exit_code?: number }; text: string; complete: boolean }>('hc_output_read'),
  terminalRead: (terminal: string, lines = 2000) => invoke<string>('terminal_read', { terminal, lines }),
  agentTree: (sessionId: string) => invoke<AgentNode | null>('agent_tree', { sessionId }),
  gitHistory: (workspaceId: string) => invoke<GitHistory | null>('git_history', { workspaceId }),
  commitChanges: (workspaceId: string, commit: string) =>
    invoke<(ChangedFile & { original: string | null })[]>('git_commit_changes', { workspaceId, commit }),
  commitFileDiff: (workspaceId: string, commit: string, path: string, original?: string) =>
    invoke<string>('git_commit_file_diff', { workspaceId, commit, path, original }),
  filesChanged: (workspaceId: string) => invoke<ChangedFile[]>('files_changed', { workspaceId }),
  projectFilesChanged: (projectId: string) => invoke<ChangedFile[]>('project_files_changed', { projectId }),
  fileDiff: (workspaceId: string, path: string) => invoke<string>('file_diff', { workspaceId, path }),
  editorLspOpen: (session: string, projectId: string, workspaceId: string | undefined, path: string, text: string) =>
    invoke<void>('editor_lsp_open', { session, projectId, workspaceId, path, text }),
  editorLspHover: (session: string, text: string, line: number, character: number) =>
    invoke<string | null>('editor_lsp_hover', { session, text, line, character }),
  editorLspClose: (session: string) => invoke<void>('editor_lsp_close', { session }),
};
