# Tasks: Chế độ cây cho Git Changes

## Phase 1 — Setup

- [x] T001 Xác nhận truy vấn Git theo workspace và cách mở diff trong `src/components/panels/RightPanel.tsx`.

## Phase 2 — Foundation

- [x] T002 Giữ lựa chọn Tree trong lần chạy với mặc định List trong `src/stores/useUiStore.ts`.

## Phase 3 — User Story 1 (P1)

- [x] T003 [US1] Thêm nút đổi chế độ và nhóm các file thay đổi theo thư mục trong `src/components/panels/RightPanel.tsx`.
- [x] T004 [US1] Dùng chung dòng file, mở diff, xử lý làm mới và hỗ trợ bàn phím trong `src/components/panels/RightPanel.tsx`.
- [x] T005 [US1] Kiểm tra chế độ, cây, file trùng tên, làm mới và đổi workspace trong `tests/unit/gitFiles.test.tsx`.

## Phase 4 — Verification

- [x] T006 Chạy typecheck và kiểm thử theo `specs/038-git-changes-tree/quickstart.md`.

T001 → T002 → T003 → T004 → T005 → T006. US1 là phạm vi MVP và có thể nghiệm thu theo quickstart.
