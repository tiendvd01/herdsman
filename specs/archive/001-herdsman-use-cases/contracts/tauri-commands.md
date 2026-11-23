# Contract — Tauri commands & events (UI ↔ Rust backend)

UI gọi `invoke(name, args)`; lỗi trả `{code, message}`. Kiểu TypeScript sinh từ Rust (`specta`/`ts-rs`) để không lệch.

## Commands

### Project (F1)
| Command | Args | Trả về | Lỗi |
|---|---|---|---|
| `project_list` | – | `Project[]` (kèm `missing: bool`) | |
| `project_add` | `{path}` | `Project` | `already_exists`, `not_a_directory` |
| `project_rename` | `{id, name}` | `Project` | |
| `project_delete_preview` | `{id}` | `{sessions: SessionRef[], tasks: TaskRef[]}` đang chạy | |
| `project_delete` | `{id, confirm: true}` | – (dừng tiến trình rồi xoá, FR-002a) | `confirm_required` |

### Workspace (F11)
| Command | Args | Trả về | Lỗi |
|---|---|---|---|
| `workspace_list` | `{project_id, include_archived?}` | `Workspace[]` | |
| `workspace_create` | `{project_id, name?, dir: {kind:"project"} \| {kind:"worktree", base_branch, branch?}, engine}` | `{workspace, session}` (session trống) | `branch_exists`, `base_not_found`, `worktree_failed` |
| `workspace_rename` | `{id, name}` | `Workspace` | |
| `workspace_dirty_check` | `{id}` | `{dirty: bool, files: string[]}` | |
| `workspace_archive` | `{id, remove_worktree: bool, confirm_dirty?: bool}` | `Workspace` | `dirty_confirm_required` |
| `workspace_unarchive` | `{id}` | `Workspace` | `worktree_removed` |
| `workspace_delete` | `{id, remove_worktree: bool, confirm_dirty?: bool}` | – | `dirty_confirm_required` |
| `git_branches` | `{project_id}` | `string[]` | |

### Session (F2, F4, F6, F10)
| Command | Args | Trả về |
|---|---|---|
| `session_create` | `{workspace_id, engine, account_id?, permission_mode?}` | `Session` |
| `session_open` | `{id}` | bắt đầu stream `session://events` từ `last_seen_seq` |
| `session_close_view` | `{id}` | ngắt socket, giải phóng bộ nhớ (session vẫn chạy) |
| `session_prompt` | `{id, text, images?}` | – |
| `session_interrupt` | `{id}` | – |
| `session_permission` | `{id, request_id, decision, updated_input?}` | – |
| `session_set_permission_mode` | `{id, mode, confirm_bypass?}` | – (`bypass` không có `confirm_bypass` → lỗi `confirm_required`) |
| `session_list_models` | `{id}` | `{models, current}`; lỗi `unsupported` khi engine/agent cũ không đổi được model (specs/005) |
| `session_set_model` | `{id, model}` | – ; ghi `sessions.model` sau khi agent ack; lỗi `bad_model`, `engine` (specs/005) |
| `session_resume` | `{id}` | `Session` |
| `session_kill` | `{id}` | – |
| `session_history` | `{workspace_id}` | `Session[]` mới nhất trước |
| `search` | `{query, scope: {workspace_id} \| "all"}` | `{session_id, workspace, project, snippet, seq}[]` |

### Log, tasks, agents (F7, F8, F9)
| Command | Args | Trả về |
|---|---|---|
| `terminal_attach` | `{terminal}` | stream `terminal://output` cho xterm.js |
| `task_run` | `{project_id, command}` | `TaskRef` |
| `task_list` | `{project_id}` | `TaskRef[]` |
| `task_kill` / `task_remove` | `{terminal}` | – |
| `agent_tree` | `{session_id}` | `AgentNode` (cây) |

### Khác
`hc_status` → `{connected, version, error?}` · `settings_get` / `settings_set` (theme: `system\|light\|dark`, …)

## Events (Rust → UI)

| Event | Payload | Ghi chú |
|---|---|---|
| `session://events` | `{session_id, events: AgentEvent[]}` | batch 16–50 ms |
| `status://changed` | `{session_id?, terminal, state, kind?}` | từ `hc` events, kể cả session không mở |
| `hc://connection` | `{connected}` | sidebar hiện trạng thái `hc` |
| `terminal://output` | `{terminal, data}` | Log view |
| `notification://clicked` | `{session_id}` | mở đúng session |
