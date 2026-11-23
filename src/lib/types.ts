// Kiểu dữ liệu khớp backend Rust (src-tauri/src/store.rs, commands.rs) và AgentEvent (contracts/sidecar-socket.md).

export type SessionStatus = 'idle' | 'working' | 'blocked' | 'done' | 'error';
export type PermissionMode = 'ask' | 'accept_edits' | 'auto' | 'bypass';
export type Engine = 'claude' | 'codex' | 'echo';

export interface Project {
  id: string;
  name: string;
  path: string;
  sort: number;
  created_at: number;
  missing: boolean;
}

export interface Workspace {
  id: string;
  project_id: string;
  name: string | null;
  dir_kind: 'project' | 'worktree';
  work_dir: string;
  branch: string | null;
  base_branch: string | null;
  archived_at: number | null;
  worktree_removed: boolean;
  created_at: number;
}

export interface Session {
  id: string;
  workspace_id: string;
  engine: Engine;
  hc_terminal: string | null;
  title: string | null;
  status: SessionStatus;
  permission_mode: PermissionMode;
  model: string | null;
  engine_session_id: string | null;
  last_seen_seq: number;
  pinned_tab: boolean;
  created_at: number;
  updated_at: number;
  ended_at: number | null;
}

export interface SearchHit {
  session_id: string;
  seq: number;
  snippet: string;
  workspace_id: string;
  workspace_name: string | null;
  workspace_archived: boolean;
  project_id: string;
  project_name: string;
  session_title: string | null;
  engine_session_id: string | null;
}

/** Hit in a Claude Code transcript (~/.claude/projects), not a Herdsman/hc session. */
export interface ClaudeHit {
  claude_session_id: string;
  session_id?: string | null;
  cwd: string | null;
  title: string | null;
  snippet: string;
  updated_at: number;
  /** Herdsman workspace whose folder matches `cwd`; null when the folder is not added to the app. */
  workspace_id: string | null;
  workspace_name: string | null;
  project_id: string | null;
  project_name: string | null;
}

export interface AppInfo {
  hc_connected: boolean;
  hc_version: string | null;
  hc_path: string | null;
  node_path: string | null;
  data_dir: string;
}

/** Raw custom theme file from `<data_dir>/themes/` (spec 016); validated in the frontend. */
export interface ThemeFile {
  file: string;
  text?: string | null;
  error?: string | null;
}

export interface RunningRef {
  terminal: string;
  kind: string;
  session_id: string | null;
  title: string;
}

export interface TaskRef {
  terminal: string;
  command: string;
  state: 'live' | 'finished';
  exit_code: number | null;
  created_ms: number | null;
}

export interface AgentNode {
  terminal: string;
  title: string;
  state: string;
  status: string | null;
  kind: string | null;
  progress: number | null;
  children: AgentNode[];
}

export interface ChangedFile {
  status: string;
  path: string;
}

export interface BranchInfo {
  is_repo: boolean;
  branches: string[];
  current: string | null;
}

// ── Model switching (specs/005-chat-model-switcher) ──
export interface ModelOption {
  value: string;
  display_name: string;
  description: string;
  resolved_model?: string;
}
export interface ModelList {
  models: ModelOption[];
  current: string | null;
  /** The model the engine uses when the session has none set (resolved from its "default" alias). */
  default_model?: string | null;
}

// ── Slash commands (engine-reported: built-in + skills + custom commands) ──
export interface SlashCommandInfo {
  name: string;
  description: string;
  argument_hint: string;
  builtin: boolean;
}

// ── AgentEvent ──
interface Base {
  seq: number | null;
  ts: number;
}
export interface LimitWindow {
  pct: number | null;
  resets_at: string | null;
}
export interface UsageLimits {
  five_hour?: LimitWindow | null;
  seven_day?: LimitWindow | null;
}

export interface ChatAttachment {
  media_type: string;
  attachment_id?: string;
}

export type AgentEvent = Base &
  (
    | { type: 'session_started'; engine: string; model: string | null; cwd: string; permission_mode: PermissionMode; resumed: boolean }
    | { type: 'engine_session'; engine_session_id: string; model: string | null }
    | { type: 'user_message'; text: string; images?: ChatAttachment[]; source: 'app' | 'hc_send' }
    | { type: 'delta'; message_id: string | null; text: string; parent_tool_use_id?: string | null }
    | { type: 'assistant_message'; message_id: string | null; blocks: { kind: 'text' | 'thinking'; text: string }[]; parent_tool_use_id?: string | null }
    | { type: 'tool_use'; tool_use_id: string; tool: string; input: Record<string, unknown>; parent_tool_use_id?: string | null }
    | { type: 'tool_result'; tool_use_id: string; is_error: boolean; content: string }
    | { type: 'permission_request'; id: string; tool: string; input: Record<string, unknown>; cwd: string; tool_use_id?: string }
    | { type: 'permission_resolved'; id: string; decision: 'allow' | 'deny' | 'cancelled'; by: string }
    | { type: 'permission_mode_changed'; mode: PermissionMode }
    | { type: 'model_fallback'; unavailable_model: string; message: string }
    | { type: 'model_changed'; model: string; previous: string | null }
    | { type: 'status'; state: SessionStatus; kind: string | null }
    | { type: 'usage_snapshot'; context_pct: number | null; limits: UsageLimits | null }
    | { type: 'turn_end'; interrupted: boolean; is_error?: boolean; usage?: { input_tokens: number; output_tokens: number }; cost_usd?: number | null; model?: string }
    | { type: 'error'; code: string; message: string; recoverable: boolean }
  );
