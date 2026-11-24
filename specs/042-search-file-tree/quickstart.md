# Quickstart

1. Chạy `pnpm install` nếu chưa có dependencies, sau đó chạy `pnpm tauri dev` và mở một project thử nghiệm có hai file cùng tên trong các thư mục khác nhau.
2. Mở một thư mục. Tìm file trong thư mục khác đang thu gọn theo tên và theo đường dẫn, rồi dùng Tab, mũi tên và Enter để mở đúng file. Xóa truy vấn và kiểm tra thư mục đã mở cùng tab file.
3. Kiểm tra trạng thái rỗng, đổi project và kiểm tra cả theme sáng lẫn tối.
4. Chạy `pnpm test`, `pnpm typecheck` và `cargo test --manifest-path src-tauri/Cargo.toml`.
5. Đo 30 lượt tìm trên macOS với project thử nghiệm 5.000 file. Nghiệm thu thao tác người dùng theo SC-002 và lặp quy trình khôi phục cây 10 lần theo SC-003.

## Kết quả đã xác minh

- Chromium với dữ liệu mock mở file bằng bàn phím, phân biệt kết quả rỗng và xóa truy vấn khi đổi project. Kiểm tra khôi phục thư mục và tab đạt 10/10 lần, chia đều giữa theme sáng và tối (SC-003).
- Phần duyệt filesystem trên macOS đạt p95 khoảng 51 ms qua 30 lần tìm trên 5.000 file. Tái lập bằng `cargo test --manifest-path src-tauri/Cargo.toml search_latency_on_5000_files -- --ignored --nocapture`.
- Cần đo thêm độ trễ từ ký tự cuối đến kết quả trong ứng dụng desktop (SC-001) và thử với 10 người dùng (SC-002).
