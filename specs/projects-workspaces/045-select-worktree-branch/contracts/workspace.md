# Workspace Creation

- Tên branch mới gửi `{ kind: "worktree", branch }`. Backend tự chọn base mặc định nếu request bỏ qua `base_branch`.
- Existing branch gửi `{ kind: "existing_worktree", branch }`.
- Project folder gửi `{ kind: "project" }`.
- Truy vấn branch trả thêm `default_branch` và `checked_out` cho ô Branch.
- Chỉ khi thành công mới trả workspace và session để giao diện chọn.
