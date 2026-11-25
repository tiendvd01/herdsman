# Quickstart

1. Chạy `pnpm typecheck` và `pnpm test`.
2. Mở desktop bằng `pnpm tauri dev`. Mở các loại tab khác nhau và kéo đổi thứ tự. Bấm Cmd+1 đến Cmd+9 để kiểm tra vị trí, kể cả vị trí trống.
3. Bấm Cmd+W với tab thường, file chưa lưu và session đang chạy. Kiểm tra luồng xác nhận, sau đó đóng hết và thử lại với hàng tab trống.
4. Vào Settings → Keyboard Shortcuts, tìm Close Tab. Thử gán trùng, rồi lưu tổ hợp khác. Mở lại app và kiểm tra tổ hợp mới.
5. Đổi tổ hợp Zoom In, kiểm tra menu View và Command Palette, sau đó khôi phục toàn bộ. Kiểm tra theme sáng và tối.

## Kết quả xác minh

- Frontend build và 262 bài kiểm thử frontend đạt. Kiểm thử tích hợp bao phủ cả bốn loại tab và các luồng xác nhận đóng.
- Rust kiểm tra biên dịch đạt. Bộ kiểm thử Rust có 35 ca đạt và hai ca đo hiệu năng được đánh dấu bỏ qua mặc định.
- Chromium với dữ liệu mô phỏng xác nhận chọn tab theo vị trí sau khi sắp xếp, xử lý vị trí trống, ưu tiên hộp thoại, từ chối gán trùng, lưu qua tải lại, đóng tab và khôi phục mặc định.
- Các thao tác với menu native trên macOS và Linux vẫn cần kiểm tra trực tiếp bằng bản desktop.
