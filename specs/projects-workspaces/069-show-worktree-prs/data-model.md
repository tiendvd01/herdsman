# Data Model

- Workspace dùng `dir_kind`, `branch` và `worktree_removed` hiện có.
- Metadata PR gồm số PR dương, nhánh nguồn, trạng thái Open/Draft/Merged/Closed. Dữ liệu nằm trong phạm vi repository và tài khoản của snapshot.
- Snapshot cũ thiếu danh sách liên kết dùng danh sách rỗng. Snapshot tiếp theo thay thế danh sách để phản ánh PR vừa thay đổi trạng thái. Cùng repository lấy mỗi số PR một lần.
