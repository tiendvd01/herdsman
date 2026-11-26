# Research: Bật tắt mọi MCP server theo project

## R1. Cách cho một session không nạp server Claude tự nạp

**Decision**: Truyền `settings: { deniedMcpServers: [{ serverName }] }` vào `query()` của Agent SDK cho từng session.

**Rationale**: Thử trên SDK 0.3.329 với thư mục có `.mcp.json` chứa `probe-a` và `probe-b`, cùng server user scope `sora-pms`:

- Không truyền gì: `sora-pms` (user), `probe-a`, `probe-b` (project) đều có trong `mcpServerStatus()`.
- Chặn `probe-b` và `sora-pms`: chỉ còn `probe-a`. Trong `~/.claude.json` không có `disabledMcpServers` hay `disabledMcpjsonServers` nào bị ghi.
- CLI ghi rõ: "deniedMcpServers still merges from all sources, so users can deny servers for themselves". Vì vậy flag settings được tính.

**Alternatives considered**:

- `toggleMcpServer()` hoặc `/mcp disable`: ghi `disabledMcpServers` vào entry project trong `~/.claude.json`. Vi phạm FR-006, đồng thời ảnh hưởng cả `claude` chạy ngoài Herdsman.
- `disabledMcpjsonServers` qua flag settings: chỉ áp dụng cho `.mcp.json`, không tắt được server user scope.
- `strictMcpConfig` kèm việc tự cấp lại mọi server đã bật: Herdsman sẽ phải đọc và chuyển cả env/header bí mật của cấu hình ngoài, tự xử lý `${VAR}`, và còn vô tình tắt cả server của plugin và connector (nằm ngoài phạm vi).

## R2. Bật tắt theo tên hay theo tên + nguồn

**Decision**: Theo tên server.

**Rationale**: `deniedMcpServers` khớp theo `serverName` ở mọi scope, và Claude chỉ nạp một server cho mỗi tên. Bật tắt theo nguồn không thực hiện được mà không dùng `serverCommand`/`serverUrl`. Hai cách này dễ sai khi cấu hình có `${VAR}`.

**Hệ quả**: Probe cho thấy tên bị chặn cũng chặn luôn server cùng tên truyền qua `mcpServers` (server Herdsman). Vì vậy giữ quy tắc của spec 071: server Herdsman trùng tên với server Claude tự nạp luôn bị bỏ qua và có cảnh báo, dù server tự nạp đang bật hay tắt.

## R3. Giữ lựa chọn khi resume

**Decision**: Khi tạo session (`fresh`), ghi `mcp-denied.json` (mảng tên) vào thư mục session. Lúc resume thì đọc lại file này, không tính lại từ DB. File không chứa bí mật nên không bị xoá sau khi đọc, khác với `mcp-servers.json`.

**Rationale**: Giống cách `mcp-selection.json` giữ server Herdsman của spec 071 (FR-004). Session tạo trước bản này không có file nên không chặn gì.

## R4. Truyền danh sách cho sidecar

**Decision**: Thêm cờ `--mcp-denied-file <path>`, chỉ truyền khi file tồn tại. Sidecar đọc file nhưng không xoá. File lỗi thì sidecar bỏ qua và phát `project_skills_warning`.

**Alternatives considered**: Truyền JSON thẳng qua argv thì làm dòng lệnh trong `hc ls` dài theo số server. Gộp vào `mcp-servers.json` thì không được, vì file đó bị xoá ngay sau khi đọc.

## R5. Lưu trữ

**Decision**: Bảng `project_mcp_disabled(project_id, server_name)`, xoá theo project bằng `ON DELETE CASCADE`. Không lưu dòng nào cho trạng thái bật (mặc định). Tên server đã tắt mà không còn trong file cấu hình vẫn được giữ (spec US2-3).
