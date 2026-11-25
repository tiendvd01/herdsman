# Data Model — Project Skills

| Entity | Fields | Lifecycle |
|---|---|---|
| Project | Existing ID, display name, root path | Owns local configuration. Workspaces resolve it through their existing project ID. Removing a project removes its configuration. |
| Project skill source | Source ID, project ID, canonical directory, insertion order | Canonical path is unique per project. The shared app library has an implicit ID and fixed first position. Explicit sources remain registered when temporarily unavailable. |
| Skill descriptor | Source ID, relative skill directory, display name, effective name and aliases, description, availability, optional conflict reason | Derived from files on demand. Native project and user entries are read-only. Canonical destination validation prevents aliasing and traversal. |
| Project skill selection | Project ID, source ID, relative skill directory | Unique on project, source and relative directory. The source must be the shared library or belong to the project. Removing a source and clearing its selections is one transaction. |
| Session skill plugin | Existing session ID and a plugin directory in the existing session data directory | Published after staging on fresh Claude launch. Fixed for the life of that session, survives app restart and follows existing session data cleanup. Older sessions can lack a plugin. |

Nguồn bổ sung và lựa chọn nằm cùng một bản ghi JSON trong SQLite cho mỗi project. Mỗi thao tác lưu so sánh bản ghi trước khi cập nhật để phát hiện thay đổi từ cửa sổ khác.

## State transitions

- Available → enabled after a committed write. Enabled → available after disabling. Unavailable or conflicted entries present a reason.
- An enabled selection stays persisted while its file or source is temporarily inaccessible. If the same entry becomes valid again, it can be applied to subsequent new sessions. Another source with the same name cannot inherit that selection.
- Removing an explicit source deletes its selections on commit. Re-adding it creates an empty selection for that source.
- Mutations address the original project and update only their intended records. A stale request against a removed or no-longer-eligible entry fails and the UI reloads the project. A launch concurrent with a mutation reads either complete committed configuration.
- Native collisions are evaluated against the actual session cwd, including engine-supported worktree fallback. Such a collision skips the managed selection for that session while preserving the saved choice.
