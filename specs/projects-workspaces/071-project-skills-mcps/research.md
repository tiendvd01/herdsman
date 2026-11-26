# Research: Sửa cấp skill và quản lý MCP theo project

## R1. Vì sao skill đã bật không slash được

Kiểm chứng ngày 2026-11-26 trên máy dev, Claude Agent SDK `0.3.329`:

- Session mới nhất của project có skill bật (`01m8bajsr2…`) có thư mục `project-skills/` đúng 26 skill. Phần staging ở `src-tauri/src/project_skills.rs::stage` chạy đúng.
- Gọi `query({ options: { plugins: [{ type: 'local', path }] } }).supportedCommands()` với plugin đó trả về 85 lệnh (59 khi không có plugin). Toàn bộ skill đều có mặt, nhưng tên có tiền tố plugin: `herdsman-project:delivery`, `herdsman-project:devflow`, …
- `src/components/composer/Composer.tsx:139` lọc bằng `s.cmd.startsWith(text)`. Gõ `/deliv` không khớp `/herdsman-project:delivery`, nên skill không bao giờ hiện khi lọc. Chỉ thấy khi mở menu mà không gõ gì, và nằm lẫn trong danh sách.

**Decision**: Composer khớp tên đầy đủ hoặc phần sau dấu `:` cuối cùng. Menu hiện tên ngắn (`/delivery`) kèm nhãn nguồn `Herdsman` cho lệnh thuộc plugin `herdsman-project`. Khi chọn, chèn tên đầy đủ `/herdsman-project:delivery` để Claude chạy đúng skill. Sidecar trả thêm trường `plugin` (namespace) để UI không phải đoán từ tên.

**Rationale**: Sửa đúng chỗ hỏng, không đổi cơ chế plugin đã có contract test. Chèn tên đầy đủ tránh nhầm với skill Claude tự nạp cùng tên ngắn.

**Alternatives considered**:
- Bỏ plugin, chép skill vào `.claude/skills` của thư mục làm việc: sửa file trong repo người dùng, vi phạm FR-011 và spec 062 FR-008.
- Đổi tên plugin thành chuỗi ngắn: vẫn có tiền tố, không giải quyết việc lọc.

## R2. Đường tạo và chạy lại session

- `session_create` (`commands/sessions.rs:66`) và tạo workspace (`commands/workspaces.rs:180`) gọi `spawn_new_sidecar` → có `prepare`. Workspace trống, phím tắt và Command Palette đều đi qua `session_create`.
- `session_resume` (`sessions.rs:264`) và mở transcript từ History (`commands/history.rs:359`) gọi `spawn_sidecar`, không `prepare`. Resume vẫn dùng plugin vì thư mục `project-skills/` nằm lâu dài trong dữ liệu session; chỉ bị xoá khi tạo session thất bại. Nếu thư mục mất (dọn dữ liệu, bản cũ), resume chạy không có skill.

**Decision**: `spawn_sidecar` cho Claude gọi `prepare` khi thư mục plugin chưa có. Session mở từ History là session mới của Herdsman nên luôn `prepare`. Resume giữ plugin đã có (đúng FR-003 "giữ skill đã cấp khi tạo").

**Alternatives considered**: Luôn stage lại khi resume: đổi bộ skill của session đang dở, trái với spec 062 (lựa chọn chỉ áp dụng cho session mới).

## R3. Cấp MCP server cho session

- SDK nhận `options.mcpServers: Record<string, McpServerConfig>` với `{ type?: 'stdio', command, args, env }`, `{ type: 'http' | 'sse', url, headers }`. Các server này cộng thêm vào server Claude nạp từ `settingSources`.
- Server Claude tự nạp: `.mcp.json` ở gốc repo của thư mục làm việc (project scope), `~/.claude.json` → `mcpServers` (user scope) và `projects[<path>].mcpServers` (local scope).

**Decision**: Rust tính danh sách server bật cho project, bỏ server trùng tên với server Claude tự nạp (kèm cảnh báo), ghi file `mcp-servers.json` quyền `0600` vào thư mục session ngay trước mỗi lần spawn, truyền đường dẫn qua `--mcp-servers-file`. Sidecar đọc file rồi xoá ngay, đưa vào `options.mcpServers`. Resume dựng lại file từ danh sách server đã chốt lúc tạo session (lưu id server, không lưu giá trị bí mật, trong `mcp-selection.json` của session).

**Rationale**: `hc run` không có cờ env; argv hiện trong `hc ls`/`ps` nên không được chứa bí mật. File tạm 0600 sống vài trăm ms là phương án đơn giản nhất.

**Alternatives considered**: Truyền JSON qua argv (lộ bí mật); để sidecar tự đọc Keychain (sidecar Node cần native module, thêm dependency lớn hơn).

## R4. Lưu giá trị bí mật

Constitution: credential MUST nằm trong Keychain. Giá trị env và header của MCP thường là token.

**Decision**: Mọi giá trị env và header coi là bí mật. SQLite chỉ lưu khóa (tên biến/header). Giá trị lưu trong Keychain qua crate `keyring` (feature `apple-native`), service `app.herdsman.mcp`, account `<server_id>/<env|header>/<key>`. UI chỉ nhận cờ "đã đặt", không bao giờ nhận lại giá trị; sửa server để trống ô giá trị nghĩa là giữ nguyên.

**Alternatives considered**: Gọi CLI `security` (giá trị lộ trong argv); lưu SQLite (vi phạm constitution).

## R5. Trùng tên và ưu tiên

Giống spec 062: bản Claude tự nạp thắng. Tên server do Herdsman quản lý là duy nhất toàn cục (khóa trong `mcpServers`), chỉ gồm `[A-Za-z0-9_-]`, tối đa 64 ký tự.

## R6. Giao diện

Thêm `Screen = 'mcp'` và mục **MCP** (icon `Plug` của lucide) ngay dưới **Skills** trên `NavigationRail`. Dùng lại bộ chọn project bên trái mà Skills và Pull Requests đang dùng trong `AppShell`. Màn MCP gồm: danh sách server Herdsman (switch bật theo project, Edit, Remove), nhóm chỉ xem "Loaded by Claude", nút **Add server** mở dialog.
