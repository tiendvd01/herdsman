# Hợp đồng History của Codex

- `history_codex(workspaceId?)` trả danh sách `{ id, cwd, name, preview, updated_at }`. Bỏ workspace để duyệt mọi thư mục. Giới hạn dữ liệu Codex theo tài khoản hiện tại và nguồn CLI hoặc exec.
- `history_codex_read(threadId, cwd)` xác nhận mục còn trong lịch sử Codex của tài khoản rồi trả mảng `{ role, text }`. Chỉ đọc transcript và trả lỗi nếu không thể truy cập.
- History trộn danh sách theo lần cập nhật, ưu tiên phiên đã liên kết khi mở và giữ các nguồn khả dụng khi Codex báo lỗi. Bản xem độc lập hỗ trợ Escape và đưa focus về mục vừa chọn.
