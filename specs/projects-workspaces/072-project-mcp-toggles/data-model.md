# Data Model: Bật tắt mọi MCP server theo project

## project_mcp_disabled (SQLite, migration 0009)

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| project_id | TEXT | FK `projects(id)` ON DELETE CASCADE |
| server_name | TEXT | Tên server Claude tự nạp đã tắt ở project |

- PK `(project_id, server_name)`.
- Có dòng nghĩa là tắt, không có dòng nghĩa là bật (mặc định, FR-002).
- Tên phải hợp lệ theo cùng quy tắc tên của spec 071 (1-64 ký tự chữ, số, `-`, `_`). Tên khác bị từ chối với `mcp_invalid`.

## NativeServer (catalog, mở rộng)

Thêm `enabled: boolean`, có giá trị false khi `(project_id, name)` nằm trong `project_mcp_disabled`. Mọi dòng cùng tên có chung giá trị (FR-008).

## Gói cấp cho session

| File trong thư mục session | Nội dung | Vòng đời |
|----------------------------|----------|----------|
| `mcp-selection.json` (071) | id server Herdsman | giữ lại để resume |
| `mcp-servers.json` (071) | cấu hình kèm bí mật, 0600 | xoá ngay khi sidecar đọc |
| `mcp-denied.json` (mới) | `string[]` tên server bị chặn | ghi khi tạo session, giữ lại để resume, chỉ ghi khi mảng khác rỗng |

## Chuyển trạng thái

Bật ⇄ Tắt bằng `mcp_native_toggle`. Thay đổi chỉ có hiệu lực ở session tạo sau đó (FR-009).
