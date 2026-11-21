# Research: Xoá / archive workspace từ sidebar

## R1. Backend đã đủ chưa?

- **Decision**: Không thêm lệnh backend. Dùng `workspace_rename`, `workspace_archive`, `workspace_delete`, `workspace_dirty_check`.
- **Rationale**: `workspace_archive` và `workspace_delete` (src-tauri/src/commands.rs) đã gọi `stop_workspace_sessions` (kill terminal trong `hc`) rồi mới đổi DB, đã kiểm worktree bẩn qua `confirm_dirty`, và phát `workspace:changed` để UI tự làm mới. Đủ cho FR-003, FR-007, FR-008.
- **Alternatives considered**: Thêm lệnh "preview" liệt kê session đang chạy như `project_delete_preview` — bỏ, vì hộp xác nhận chỉ cần nói "session đang chạy sẽ dừng"; spec không đòi liệt kê từng cái.

## R2. Dùng chung menu giữa header và sidebar

- **Decision**: Giữ `WorkspaceMenu` làm chủ logic (dialog đổi tên, xác nhận, dirty check), thêm prop chọn kiểu nút trigger (`variant: 'header' | 'sidebar'`).
- **Rationale**: Một nguồn logic → header và sidebar luôn cùng quy tắc (FR-003). Chỉ khác nút bấm và nhãn a11y.
- **Alternatives considered**: Viết menu riêng cho sidebar — trùng logic dirty-check/xác nhận, dễ lệch.

## R3. Bỏ chọn sau khi archive/xoá

- **Decision**: Chỉ gọi `selectWorkspace(project_id, null)` khi workspace bị thao tác là workspace đang mở; đồng thời dọn `sessionByWorkspace`/`tempTabs` không cần (giữ nguyên, vô hại).
- **Rationale**: Code hiện tại luôn bỏ chọn → từ sidebar xoá B sẽ đá người dùng khỏi A, trái FR-004/SC-003.

## R4. Nút menu trong dòng workspace

- **Decision**: Dòng workspace đổi thành `div.group` chứa nút chọn workspace và nút menu anh em (không lồng button trong button). Nút menu `opacity-0`, hiện khi `group-hover`, `focus-visible`, hoặc `data-[state=open]` — giống dòng project.
- **Rationale**: Đáp ứng FR-001, FR-006 (bấm menu không chọn workspace) và HTML hợp lệ.
- **Alternatives considered**: Menu chuột phải (context menu) — khó thấy, không có bàn phím tốt; để sau nếu cần.

## R5. Thử trên ?mock

- **Decision**: Bổ sung devMock cho `workspace_archive`, `workspace_delete`, `workspace_rename`, `workspace_dirty_check` (sửa mảng WS trong bộ nhớ, phát `workspace:changed`).
- **Rationale**: Quy ước dự án: kiểm giao diện bằng Playwright trên `?mock`.
