# Kiểm thử History của Codex CLI

1. Chạy `pnpm test`, `pnpm --dir sidecar test` và `cargo test --manifest-path src-tauri/Cargo.toml`.
2. Chuẩn bị phiên Codex CLI trong thư mục workspace, một worktree và một thư mục chưa thêm vào Herdsman. Dùng tài khoản đang hoạt động trong Codex của Herdsman.
3. Mở **History** trong Herdsman. So sánh **This workspace** và **All projects**, thử tìm bằng tiêu đề và phần xem trước. Nếu một phiên đã liên kết, xác nhận chỉ có một dòng và dòng đó mở phiên Herdsman.
4. Mở bản xem của phiên chưa liên kết bằng Enter. Đọc lời nhắn theo thứ tự. Đóng bằng Escape và kiểm tra focus, phạm vi và truy vấn. Làm lại trong theme sáng và tối.
5. Lặp lại khi một phiên Codex CLI đang chạy. Đóng rồi mở Herdsman để kiểm tra phiên tiếp tục và lịch sử vẫn đọc được. Dùng nguồn Codex không khả dụng để kiểm tra History vẫn hiện các phiên còn đọc được.

## Kết quả xác minh

- TypeScript và build production đạt. `pnpm test --maxWorkers=2` chạy thành công 362 test.
- Rust đạt 78 test, 4 test tùy chọn được bỏ qua theo cấu hình sẵn.
- Kiểm tra thật qua đường metadata của hc với Codex CLI cài cục bộ. Liệt kê và đọc thành công một hội thoại của workspace Herdsman. Đầu ra kiểm tra chỉ ghi trạng thái.
- Playwright với dữ liệu mô phỏng xác nhận tìm theo phần xem trước, Enter mở bản xem, Escape trả focus và giữ truy vấn ở cả theme sáng và tối.
- Lần chạy cuối của bộ sidecar đạt 43/43, gồm kiểm thử lịch sử mới.
