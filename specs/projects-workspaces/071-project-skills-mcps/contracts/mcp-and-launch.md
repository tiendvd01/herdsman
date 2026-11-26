# Contracts: Slash skill và MCP

## Tauri commands

| Command | Input | Output | Lỗi |
|---|---|---|---|
| `mcp_catalog` | `{ projectId }` | `{ servers: McpServerView[], native: NativeMcpServer[] }` | `not_found` |
| `mcp_server_save` | `{ server: McpServerInput }` (có `id` = sửa) | `string` (id server) | `mcp_invalid` (kèm `field`), `mcp_duplicate`, `keychain` |
| `mcp_server_remove` | `{ id, dryRun }` | `{ affected_projects: string[] }` (cả khi xoá thật) | `not_found` |
| `mcp_project_toggle` | `{ projectId, serverId, enabled }` | `()` | `not_found` |

`McpServerView`: `{ id, name, transport, command?, args, url?, env: {key, set}[], headers: {key, set}[], enabled, conflict?: string }` — không bao giờ có giá trị bí mật. Khóa mới bắt buộc có giá trị, nên `set` luôn `true` và catalog không phải đọc Keychain.

`McpServerInput`: như trên, nhưng `env`/`headers` là `{ key, value? }[]`; `value` vắng hoặc rỗng = giữ giá trị cũ.

`session_list_commands`: mỗi lệnh thêm `plugin?: string`.

## Sidecar CLI

| Cờ | Ý nghĩa |
|---|---|
| `--project-skills-plugin <dir>` | như cũ |
| `--project-skills-warning <text>` | như cũ; thêm cảnh báo MCP (chỉ tên server và lý do) |
| `--mcp-servers-file <path>` | JSON `Record<name, McpServerConfig>`; sidecar đọc, `unlink`, đưa vào `options.mcpServers`. File thiếu/hỏng → emit `project_skills_warning` và chạy tiếp không có MCP. |

## Event

Giữ `project_skills_warning { message }`. Server MCP lỗi khi kết nối: sidecar đọc `mcp_servers` trong message `system/init` của SDK, server có `status` khác `connected` → emit `project_skills_warning` với `"<name>: MCP server failed to connect"`.

## Composer

- Lọc: `cmd.startsWith(text)` hoặc `'/' + short` bắt đầu bằng `text`.
- Hiển thị `/short`, nhãn `Herdsman` khi `plugin === 'herdsman-project'`.
- Chọn: chèn `/<name đầy đủ> `.
