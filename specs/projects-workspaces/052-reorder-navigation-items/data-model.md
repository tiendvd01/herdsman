# Data Model — Navigation Order

Mỗi bản ghi là một mảng ID duy nhất theo thứ tự hiển thị, lưu theo phạm vi `projects`, `workspaces:<project ID>` hoặc `tabs:<workspace ID>`. Thanh tab cấp project dùng phạm vi riêng. Khóa tab mang tiền tố loại để phân biệt session, terminal, file và diff.

Khi chưa có thứ tự thủ công, dùng thứ tự nguồn. Khi đã sắp xếp, hiển thị các ID hiện diện theo thứ tự đã lưu rồi thêm các mục mới ở cuối. Bỏ vị trí cũ của mục đã hiển thị khi mục đó rời danh sách. Các ID đang chờ dữ liệu tải được giữ khi khôi phục. Ghi thành công trước khi áp dụng thay đổi lên giao diện.
