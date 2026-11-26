# Quickstart: kiểm chứng bật tắt MCP theo project

## Tự động

- `cargo test mcp` trong `src-tauri`: lưu và đọc lựa chọn, catalog trả `enabled`, `mcp-denied.json` được ghi khi tạo session và giữ khi resume.
- `node --test sidecar/test/mcp.contract.test.mjs`: `--mcp-denied-file` trở thành `options.settings.deniedMcpServers`, và file lỗi sinh cảnh báo.
- `pnpm vitest run tests/unit/mcpView.test.tsx`: công tắc ở mục "Loaded by Claude" gọi `mcp_native_toggle`.

## Thủ công

1. Khai báo một server ở `~/.claude.json` (`codegraph install -t claude -l global`).
2. Mở Herdsman → MCP → project A, tắt `codegraph`. Project B giữ nguyên.
3. Tạo session Claude mới ở A và hỏi agent liệt kê công cụ MCP: không có `codegraph`. Làm tương tự ở B: có `codegraph`.
4. Đóng và mở lại app, resume session ở A: vẫn không có `codegraph`.
5. Kiểm tra `~/.claude.json` và `.mcp.json` không đổi (`git diff`, hoặc so sánh mtime).

## UI

`pnpm dev` rồi mở `http://localhost:1420/?mock`. Vào MCP, xem mục "Loaded by Claude" có Switch, ở cả light và dark.
