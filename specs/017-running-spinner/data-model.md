# Data Model

Không có dữ liệu mới, không lưu trữ mới.

| Thực thể | Trường dùng | Ghi chú |
|---|---|---|
| Session (đã có) | `id`, `workspace_id`, trạng thái trực tiếp `state ∈ {idle, working, blocked, done, error}` | nguồn: `useUiStore.statuses`; dự phòng `session.status` |
| Workspace (đã có) | `id` | dẫn xuất `running(w) = ∃ s: s.workspace_id = w.id ∧ s.state = 'working'` |

## Quy tắc
- Tab: spinner ⇔ `state === 'working'` (các trạng thái khác giữ chấm).
- Workspace: đúng một spinner ⇔ `running(w)`; `blocked`/`error` không tính.
- Chuyển trạng thái: `working → blocked|done|error|idle` làm spinner biến mất ngay trong lần render kế tiếp.
