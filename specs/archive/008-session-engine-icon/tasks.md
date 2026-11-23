# Tasks: Icon engine thay chữ ở tab session

**Input**: [spec.md](spec.md), [plan.md](plan.md)

## Phase 1: Setup

- [x] T001 Chép `claude.svg`, `codex.svg` từ herdr-app `icons/` vào `src/assets/engines/`

## Phase 2: User Story 1 - Nhận ra engine qua icon (P1)

- [x] T002 [US1] Tạo `src/components/ui/engine-icon.tsx` (img cho claude/codex, `Bot` cho engine khác, tooltip + aria-label)
- [x] T003 [US1] Thay chữ engine ở hàng tab trong `src/components/layout/WorkspaceView.tsx` bằng `EngineIcon`
- [x] T004 [P] [US1] Test `EngineIcon` (đúng icon và nhãn cho claude / codex / echo)

## Phase 3: Polish

- [x] T005 Chạy typecheck + test; kiểm UI bằng `?mock` (sáng/tối, tên dài)
