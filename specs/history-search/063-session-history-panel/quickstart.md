# Kiểm tra History

- Chạy `pnpm test`, `pnpm typecheck` và `cargo test --manifest-path src-tauri/Cargo.toml`.
- Chạy `pnpm tauri dev` với một workspace có phiên đang chạy, đã kết thúc, chưa đặt tên và một workspace archive. Dùng bàn phím mở History và chọn các dòng. Xác nhận tab tạm và panel History vẫn hiện.
- Chuẩn bị transcript CLI trong thư mục workspace và một thư mục chưa có trong app. Duyệt cả hai phạm vi, tìm theo một đoạn tin nhắn và mở phiên. Thoát/mở lại app, kiểm tra transcript gốc và agent đang chạy.
- Kiểm tra một phiên Claude có ở hai nguồn, lỗi đọc một transcript, truy vấn không khớp, chế độ sáng/tối và trường hợp chưa có workspace.
- Đo 20 truy vấn nội dung với 1.000 phiên ở hai nguồn trên dữ liệu local. Đối chiếu SC-003 trong [spec.md](spec.md).

## Kết quả kiểm tra

- Browser preview với dữ liệu mẫu qua Chromium ở theme sáng và tối đã xác nhận mở tab bằng bàn phím, tìm theo nội dung, đổi phạm vi, mở hội thoại và giữ panel hiển thị ở chiều rộng tối thiểu.
- Rust kiểm tra transcript lỗi, phiên thiếu thư mục, dữ liệu gốc và việc đọc lại sau khi mở lại cơ sở dữ liệu. Vitest kiểm tra cách panel gộp phiên trùng và mở hội thoại khi chưa chọn workspace.
- Chạy phép đo backend bằng `cargo test --manifest-path src-tauri/Cargo.toml history_search_latency_on_two_sources -- --ignored --nocapture`. Trên bộ dữ liệu tổng hợp có 500 phiên mỗi nguồn, p95 của 20 lượt đo là 231 ms trước debounce và render.
- SC-001 và SC-002 cần phiên nghiệm thu với người dùng. Browser preview dùng fixture, còn kiểm thử Rust đọc transcript CLI từ thư mục tạm.
