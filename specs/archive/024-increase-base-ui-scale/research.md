# Research

## Tỷ lệ hiển thị

- **Quyết định** — Nhân mức zoom chuẩn hóa với 1,1 tại `applyZoom`.
- **Lý do** — Hàm này phục vụ cả khởi động, đổi zoom và đặt lại. Zoom WebView hoặc CSS áp dụng đồng nhất lên chữ, icon và bố cục.
- **Phương án đã cân nhắc** — Sửa từng token kích thước cần rà lại mọi phần tử dùng kích thước cố định. Đặt mặc định thành 110% sẽ thay đổi nhãn và hành vi đặt lại.

## Tùy chọn và bố cục

- **Quyết định** — Giữ bậc zoom và cỡ chữ đã lưu, dùng lại cách tính viewport và kéo giãn panel.
- **Lý do** — CSS fallback đọc trực tiếp tỷ lệ từ phần tử gốc. WebView native dùng kích thước viewport sau zoom. Không cần thay đổi định dạng lưu.
- **Phương án đã cân nhắc** — Chuyển lựa chọn cũ thành bậc gần nhất sẽ tự đổi giá trị người dùng đã chọn.
