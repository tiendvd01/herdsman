# Quickstart

1. Cài dependencies với `pnpm install`, sau đó chạy `pnpm tauri dev`.
2. Mở một session trong worktree. Dùng agent đọc một tệp code và tạo một tệp thử có đường dẫn dài để thấy cả thẻ Read và Write.
3. Kích hoạt mỗi đường dẫn ở trạng thái thu gọn và mở rộng. Thử cả chuột lẫn bàn phím. Kiểm tra [kết quả trên Files](contracts/tool-file-navigation.md).
4. Mở lại tệp đã có thay đổi chưa lưu, sau đó thử mở một tệp thử đã xóa. Kiểm tra tab và thông báo lỗi theo hợp đồng giao diện.
5. Chạy `pnpm typecheck` và `pnpm test` sau khi triển khai.
