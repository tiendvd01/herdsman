# Research: Tinh chỉnh giao diện Pull Requests

## Hiển thị chế độ xem

- **Decision** — Dùng Tabs của shadcn/ui cho bốn chế độ, với thanh tab ngoài vùng cuộn.
- **Rationale** — Tabs hiện có thứ tự focus và điều hướng bằng phím mũi tên. Thanh hiện rõ phạm vi đọc.
- **Alternatives considered** — Dropdown cần thêm thao tác. Bộ nút riêng cần tự xử lý điều hướng bàn phím.

## Dữ liệu chi tiết và quay lại

- **Decision** — Chi tiết dùng snapshot theo dõi hiện có. Thêm hai trường tùy chọn qua truy vấn đang chạy và giữ vị trí đọc khi mở từng PR.
- **Rationale** — Người dùng đọc được chi tiết ngay khi hàng xuất hiện. Cùng snapshot giữ trạng thái nhất quán giữa hàng và chi tiết.
- **Alternatives considered** — Một lệnh riêng để tải chi tiết thêm thời gian chờ và cần xử lý vòng đời tải riêng.

## Phạm vi lỗi

- **Decision** — Giữ snapshot hiện tại khi gặp lỗi có mã `offline`. Ẩn snapshot khi truy cập bị từ chối hoặc chuyển tài khoản. Dùng lỗi theo repository từ backend khi có.
- **Rationale** — Lỗi đường truyền tạm thời và lỗi quyền có hành vi hiển thị khác nhau. Tauri đã gửi mã lỗi.
- **Alternatives considered** — Hiển thị mọi snapshot sau lỗi có thể làm lộ dữ liệu của tài khoản cũ.
