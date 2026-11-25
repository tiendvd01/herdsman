# Data Model

- BranchInfo giữ danh sách branch local, branch hiện tại, nhánh mặc định và tên branch đang checkout.
- Worktree mới dùng branch đã chọn, base_branch rỗng và thư mục riêng. Workspace mới và session dùng mô hình hiện có, không migration.
- Branch mất hoặc bị checkout khiến yêu cầu thất bại trước khi ghi workspace. Việc dọn worktree không xoá branch.
