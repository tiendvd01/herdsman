# Dữ liệu History

- **Phiên Herdsman** — Session và Workspace hiện có, tên project và đoạn trích tùy truy vấn. Bao gồm workspace đã archive và phiên được giữ sau khi xóa workspace.
- **Phiên CLI** — Định danh transcript, tiêu đề tùy chọn, thời điểm cập nhật, cwd tùy chọn, đoạn trích, liên kết project/workspace nếu xác định được và phiên Herdsman trùng nếu có.
- **Phạm vi** — Workspace đang chọn hoặc toàn app. Khi chưa có workspace, chỉ toàn app khả dụng.
- **Danh sách** — Gom theo định danh phiên Claude khi có liên kết, giữ action mở phiên Herdsman, sắp giảm dần theo lần hoạt động gần nhất. Một nguồn có báo lỗi vẫn trả được kết quả đọc thành công.
