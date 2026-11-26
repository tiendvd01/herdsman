# Quickstart: kiểm chứng 071

## Chuẩn bị

- Một project A có ít nhất 2 skill bật trong **Skills** (một từ thư viện, một từ thư mục bổ sung), project B không bật skill.
- Một MCP server stdio đơn giản, ví dụ `npx -y @modelcontextprotocol/server-everything`.

## Test tự động

Chạy qua `hc` (không chạy hai lượt song song):

- `pnpm vitest run tests/unit/composerSlash.test.tsx tests/unit/mcpView.test.tsx` — lọc theo tên ngắn, nhãn Herdsman, chèn tên đầy đủ.
- `cd sidecar && node --test test/commands.contract.test.mjs test/project-skills.test.mjs test/mcp.contract.test.mjs`
- `cd src-tauri && cargo test project_skills mcp`

## Kịch bản tay

1. A → tạo session Claude mới (nút tạo session, workspace mới, workspace trống, ⌘K). Gõ `/deliv` → thấy `/delivery` nhãn `Herdsman`. Chọn, gửi → skill chạy.
2. Đóng app, mở lại, resume session ở bước 1 → `/deliv` vẫn ra.
3. B → session mới → `/deliv` không ra skill của A.
4. Sidebar → **MCP** → chọn A → **Add server** (stdio, có 1 biến env) → bật cho A. Danh sách hiện giá trị env là `••••`.
5. Session mới ở A → hỏi agent liệt kê tool MCP → có tool của server. Session mới ở B → không có.
6. Kiểm tra `~/Library/Application Support/app.herdsman/sessions/<id>/` không còn `mcp-servers.json`; `rg <giá trị env>` trên thư mục dữ liệu và log không có kết quả.
7. Sửa lệnh server thành lệnh không tồn tại → session mới vẫn mở, có cảnh báo server lỗi.
8. Remove server → dialog liệt kê A → xác nhận → session mới ở A không còn tool.
9. Kiểm tra giao diện MCP ở theme sáng và tối bằng Playwright (`?mock`).
