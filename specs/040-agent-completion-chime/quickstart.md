# Quickstart

Chạy `pnpm test`, `pnpm typecheck` và `cargo test --manifest-path src-tauri/Cargo.toml`.

Trên macOS, cho phép thông báo có âm thanh. Giao 10 lượt thành công khi Herdsman có focus và 10 lượt khi ở nền. Mỗi lượt cần đúng một tiếng Tink trong hai giây. Trong các lượt nền, đối chiếu tên Session. Thử ngắt lượt, đóng Session đang chạy, gặp lỗi, mở lại app và bật Do Not Disturb theo đặc tả.

## Kết quả xác minh

- 219 kiểm thử frontend, typecheck và build đạt. Kiểm thử thông báo xác minh cấu hình âm Tink, focus, chạy nền, chống trùng, lịch sử, đóng Session và quyền bị từ chối.
- 20 kiểm thử Rust và 4 kiểm thử tích hợp đạt. Một kiểm thử Rust có đánh dấu bỏ qua. Kiểm thử tích hợp xác minh payload hoàn thành qua runtime cùng số thứ tự và thời điểm từ log.
- Đã xác minh độ dài tệp âm hệ thống Tink. Chưa nghiệm thu âm nghe được, banner và Do Not Disturb trên ứng dụng macOS đang chạy.
