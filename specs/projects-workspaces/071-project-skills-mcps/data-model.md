# Data Model: Sửa cấp skill và quản lý MCP theo project

## SlashCommandInfo (sidecar → UI, mở rộng)

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `name` | string | Tên đầy đủ engine báo, ví dụ `herdsman-project:delivery` |
| `description`, `argument_hint`, `builtin` | như cũ | |
| `plugin` | string? | Namespace trước dấu `:` cuối; có khi lệnh thuộc plugin |

UI suy ra `short = name.split(':').at(-1)`. Lệnh có `plugin === 'herdsman-project'` hiện nhãn `Herdsman`.

## McpServer (SQLite bảng `mcp_servers`)

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | TEXT PK | ULID |
| `name` | TEXT UNIQUE | `^[A-Za-z0-9_-]{1,64}$` |
| `transport` | TEXT | `stdio` \| `http` \| `sse` |
| `command` | TEXT? | bắt buộc khi `stdio` |
| `args` | TEXT (JSON array) | chỉ `stdio` |
| `url` | TEXT? | bắt buộc khi `http`/`sse`, scheme `http`/`https` |
| `env_keys` | TEXT (JSON array) | tên biến; giá trị trong Keychain |
| `header_keys` | TEXT (JSON array) | tên header; giá trị trong Keychain |
| `created_at`, `updated_at` | INTEGER | ms |

## ProjectMcp (SQLite bảng `project_mcp_servers`)

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `project_id` | TEXT | FK projects, xoá theo project |
| `server_id` | TEXT | FK `mcp_servers`, `ON DELETE CASCADE` |
| PK | (`project_id`, `server_id`) | |

## Secret (Keychain)

Service `app.herdsman.mcp`, account `<server_id>/env/<KEY>` hoặc `<server_id>/header/<Name>`. Xoá server → xoá mọi account của server. Sửa server: khóa bị bỏ → xoá; ô giá trị trống → giữ.

## NativeMcpServer (chỉ đọc, không lưu)

`name`, `transport`, `scope` (`project` | `local` | `user`), `source` (đường dẫn file). Không đọc hay trả giá trị env/header.

## Session launch (dữ liệu session)

- `sessions/<id>/project-skills/` — plugin skill (spec 062), dùng lại khi resume.
- `sessions/<id>/mcp-selection.json` — `string[]` id server đã chốt lúc tạo session (do Rust ghi; `meta.json` thuộc sidecar).
- `sessions/<id>/mcp-servers.json` — file tạm 0600, ghi trước mỗi spawn, sidecar xoá ngay sau khi đọc.

## Trạng thái

Tạo session: đọc lựa chọn → lọc trùng tên native → ghi `mcp-selection.json` → ghi file tạm → spawn. Resume/khởi động lại: đọc `mcp-selection.json` → bỏ id không còn tồn tại (cảnh báo) → ghi file tạm → spawn.
