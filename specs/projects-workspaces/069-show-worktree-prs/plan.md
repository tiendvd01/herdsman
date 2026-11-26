# Implementation Plan: Hiện pull request dưới worktree

**Branch**: `master` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Summary

Mở rộng lần đồng bộ PR hiện có để cấp dữ liệu gọn cho Projects sidebar. Hàng worktree kết xuất liên kết theo nhánh và dùng lệnh mở GitHub hiện có.

## Technical Context

Rust/Tauri lấy dữ liệu qua GitHub CLI. React/TypeScript dùng snapshot TanStack Query hiện có. SQLite giữ snapshot theo tài khoản/repository với trường mới có giá trị mặc định để đọc dữ liệu cũ. Kiểm thử bằng Cargo và Vitest. Tái sử dụng lần gọi danh sách PR theo repo, tránh truy vấn theo từng worktree.

## Constitution Check

| Nguyên tắc | Trước và sau thiết kế |
| --- | --- |
| I | Đồng bộ PR chỉ phục vụ giao diện. Đóng app giữa chừng không ảnh hưởng agent. |
| II | Luồng ghi và phát lại hội thoại giữ nguyên. |
| III | Mở PR cần người dùng kích hoạt. Quyền của agent giữ nguyên. |
| IV | Metadata gọn dùng chung chu kỳ đồng bộ. Sidebar vẫn hoạt động khi dữ liệu thiếu. |
| V | Dùng GitHub CLI và lệnh Tauri hiện có. |
| VI | Giữ cấu trúc Project → Workspace → Session và gắn link vào worktree của workspace. |

Nút dùng token theme hiện có. Màu xanh lá, tím và đỏ thể hiện Open, Merged và Closed, cùng biểu tượng khác nhau để nhận biết ở thang xám. Draft dùng màu muted và biểu tượng riêng. Kiểm tra focus, độ tương phản và hàng đang chọn ở theme sáng/tối.

## Project Structure

- `src-tauri/src/pull_requests.rs` lấy và trả metadata theo repo.
- `src/components/layout/PullRequests.tsx` chia sẻ snapshot và lệnh mở.
- `src/components/layout/AppShell.tsx` truyền dữ liệu tới `Sidebar.tsx`.
- `tests/unit/commandDialog.test.tsx` kiểm tra liên kết trên sidebar.

## Complexity Tracking

Không có dependency, store hoặc lệnh Tauri mới.
