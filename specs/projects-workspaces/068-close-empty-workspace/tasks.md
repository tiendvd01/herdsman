# Tasks — Đóng workspace khi đóng session cuối

## Phase 1 — Setup

- [X] T001 Xác minh luồng đóng chung cho nút và phím tắt trong `src/components/layout/WorkspaceView.tsx`.

## Phase 2 — Foundational

- [X] T002 Xác định tab còn lại dựa trên hàng tab hiện tại và trạng thái chọn workspace trong `src/components/layout/WorkspaceView.tsx`.

## Phase 3 — User Story 1 (P1)

**Independent test** Đóng tab session duy nhất bằng nút hoặc phím tắt và xác nhận một lần để về project.

- [X] T003 [US1] Cập nhật kịch bản hồi quy cho nút đóng, phím tắt, lỗi, tab còn mở và chuyển workspace trong `tests/unit/lastSessionClose.test.tsx`.
- [X] T004 [US1] Bỏ ô chọn phụ, cập nhật nội dung xác nhận và tự về project khi hàng tab trống sau khi đóng thành công trong `src/components/layout/WorkspaceView.tsx`.

## Phase 4 — Validation

- [X] T005 Chạy Vitest và TypeScript theo `specs/projects-workspaces/068-close-empty-workspace/quickstart.md`.

## Dependencies & Implementation Strategy

T001 → T002 → T003 → T004 → T005. Một user story hoàn thành toàn bộ phạm vi. Dùng luồng đóng sẵn có để kiểm tra hồi quy trước khi sửa.
