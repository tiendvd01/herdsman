# Data Model: Xoá / archive workspace từ sidebar

Không có entity hay thuộc tính mới. Dùng nguyên **Workspace** và **Session** của [spec 001 data-model](../001-herdsman-use-cases/data-model.md).

## Trạng thái liên quan

| Thao tác | Workspace sau đó | Session của nó | Worktree |
|---|---|---|---|
| Rename | `name` đổi | không đổi | không đổi |
| Archive | `archived_at` được đặt → ẩn khỏi sidebar | đang chạy thì bị dừng; lịch sử giữ, vẫn tìm thấy | xoá nếu người dùng chọn (cần xác nhận nếu bẩn) |
| Delete | bị bỏ khỏi app | bị bỏ khỏi app (event log xoá); transcript gốc engine giữ | xoá nếu người dùng chọn (cần xác nhận nếu bẩn) |

## Trạng thái UI (không lưu)

- Workspace đang mở (`useUiStore.workspaceId`): chỉ về `null` khi chính nó bị archive/xoá (FR-004, FR-005).
