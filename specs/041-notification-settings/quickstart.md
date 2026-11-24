# Quickstart

Chạy `pnpm test` và `pnpm build`. Hai bộ test `settingsDialog` và `completionNotification` xác minh tùy chọn, mặc định, lưu trữ, chống phát lại và ba chế độ gửi.

Trên desktop macOS, mở **Settings → Notifications** bằng chuột rồi bằng bàn phím. Kiểm tra bố cục trong cả theme sáng và tối. Chạy 5 lượt thành công cho mỗi cấu hình có tiếng, im lặng và tắt khi cửa sổ ở nền. Sau đó mở lại app 3 lần và đối chiếu lựa chọn, đèn tab và kết quả theo đặc tả.

## Kết quả xác minh

- 221 kiểm thử đạt. Typecheck và build thành công.
- Kiểm thử xác nhận cấu hình cũ mặc định bật, lưu và khôi phục cả hai giá trị, áp dụng ba chế độ, chống phát lại sau khi bật lại, và giữ thông báo cần duyệt.
- Đã mở giao diện thật với dữ liệu mẫu trong Chrome và kiểm tra ảnh cả hai theme. Các điều khiển nhận focus, đổi trạng thái và vô hiệu hóa đúng khi tắt thông báo.
- Chưa chạy chuỗi 15 lượt và 3 lần khởi động lại trên desktop macOS để nghiệm thu tiếng và banner thực tế.
