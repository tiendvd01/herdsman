---
description: "Triển khai tooltip cho chữ bị cắt"
---

# Tasks: Tooltip cho chữ bị cắt

**Input** — [Đặc tả](spec.md) và [thiết kế](plan.md).

## Phase 1: Setup

- [x] T001 Rà soát provider, nhãn bị cắt và tooltip hiện có trong `src/App.tsx` và `src/components/`.

## Phase 2: Foundational

- [x] T002 Thêm điều khiển mở và định dạng tooltip theo phạm vi trong `src/components/ui/tooltip.tsx`.

## Phase 3: User Story 1 - Đọc đầy đủ tên và nhãn bị cắt (P1)

**Independent Test** — Hover tên ở sidebar và tab sau khi thu hẹp bố cục, rồi rời chuột hoặc nhấn Escape.

- [x] T003 [US1] Tạo nhãn đo tràn ngang và dọc trong `src/components/ui/truncated-text.tsx` (FR-001 đến FR-004).
- [x] T004 [P] [US1] Gắn vào điều hướng, tìm kiếm và lịch sử trong `src/components/layout/Sidebar.tsx`, `src/components/layout/WorkspaceView.tsx`, `src/components/command/CommandDialog.tsx` và `src/components/history/HistoryPopover.tsx` (FR-001).
- [x] T005 [P] [US1] Gắn vào các nhãn bị rút gọn còn lại trong `src/components/panels/RightPanel.tsx`, `src/components/project/DeleteProjectDialog.tsx`, `src/components/conversation/{Diff,ToolCard,ImagePreview}.tsx`, `src/components/permission/PermissionCard.tsx`, `src/components/composer/{Composer,ModelSwitcher}.tsx` và `src/components/settings/SettingsDialog.tsx` (FR-001).

## Final Phase: Validation

- [x] T006 Chạy typecheck và test frontend, xác minh hover bằng trình duyệt theo `specs/025-truncated-text-tooltip/quickstart.md`.

## Dependencies & Execution Order

T001 → T002 → T003 → T004 và T005 → T006. Có thể làm điều hướng và panel độc lập sau T003.

## Implementation Strategy

Hoàn thiện nhãn dùng chung và tên workspace, session trước. Sau đó tích hợp các nhãn còn lại và kiểm tra hồi quy.
