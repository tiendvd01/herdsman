# Quickstart

Chạy `pnpm test tests/unit/pullRequests.test.tsx`, `pnpm typecheck` và `cargo test --manifest-path src-tauri/Cargo.toml --lib set_notifications_read`.

Trong app desktop, mở Pull Requests với hai project có thông báo đã đọc. Trong từng theme, dùng Tab và Enter để kích hoạt nút trong một project, đối chiếu số trên tab và chấm trên thanh điều hướng rồi chọn All projects và thử lại. Làm mới, mở lại app, đổi rồi quay lại tài khoản để kiểm tra trạng thái đã lưu. Mở một thông báo để xác nhận luồng đánh dấu đã đọc.

Kết quả kiểm tra tự động: 315 bài Vitest, 63 bài Rust và typecheck đạt. Bốn bài Rust được cấu hình bỏ qua. Kiểm tra hiển thị trực tiếp trong app desktop còn mở.

Dùng `Mark all as read` trong một project rồi trong `All projects`. Xác nhận chấm biến mất sau khi đọc hết thông báo.
