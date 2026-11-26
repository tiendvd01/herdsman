# Data Model — Trạng thái đóng session

- **Workspace đang xem** gồm project và workspace đang được chọn. Bỏ chọn workspace để hiển thị project.
- **Hàng tab** gồm session đang hiển thị, terminal, file và diff. Loại session đang đóng trước khi quyết định có tab kế tiếp.
- **Thao tác đóng** chuyển từ xác nhận sang đang xử lý, rồi hoàn tất hoặc báo lỗi. Điều hướng chỉ diễn ra sau kết quả thành công và khi workspace đang xem vẫn là workspace ban đầu.
