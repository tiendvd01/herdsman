# Quickstart

Chạy `pnpm test tests/unit/pullRequests.test.tsx`, `pnpm typecheck` và `cargo test --manifest-path src-tauri/Cargo.toml --lib pull_requests::`.

Trong app desktop, kiểm tra thông báo mẫu thuộc bốn loại ở Overview, Notifications và toast. Đọc nhãn bằng trình đọc màn hình, thử theme sáng, tối và thang xám, mở PR bằng View, rồi đánh dấu hàng loạt hai chiều để xác nhận nhãn không đổi.

Kết quả tự động: 316 bài Vitest, 63 bài Rust và typecheck đạt. Bốn bài Rust được cấu hình bỏ qua. Kiểm tra trực tiếp theme và trình đọc màn hình trong app desktop còn mở.
