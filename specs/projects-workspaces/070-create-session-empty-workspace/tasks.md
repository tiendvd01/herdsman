# Tasks — Tạo session từ workspace trống

## Phase 1 — Setup

- [x] T001 Rà vị trí launcher, trạng thái tab và quy ước phím tắt trong `src/components/layout/WorkspaceView.tsx`.

## Phase 2 — User Story 1 (P1)

- [x] T002 [US1] Thêm kiểm thử trạng thái trống, mở menu và chuyển launcher sau khi tạo tab trong `tests/unit/workspaceTerminal.test.tsx` (FR-001–FR-005).
- [x] T003 [US1] Hiển thị một launcher tại vị trí tương ứng và giữ fallback tạo workspace trong `src/components/layout/WorkspaceView.tsx` (FR-001–FR-005).

## Phase 3 — Verification

- [x] T004 Chạy typecheck và test suite. Kiểm tra token theme trong `src/components/ui/button.tsx` và thêm liên kết feature vào `specs/README.md`.

## Dependencies & Execution Order

T001 → T002 → T003 → T004. Kiểm thử độc lập theo `quickstart.md`.
