# Tasks: Cài đặt thông báo hoàn thành

## Phase 1: Setup

- [X] T001 Đối chiếu các thành phần Settings, nguồn thông báo và checklist trong `src/components/settings/SettingsDialog.tsx`, `src/lib/events.ts` và `specs/agent-sessions/041-notification-settings/checklists/requirements.md`.

## Phase 2: Foundational

- [X] T002 Thêm mặc định và lưu trữ tùy chọn cho FR-004 trong `src/stores/useUiStore.ts`.

## Phase 3: User Story 1 (P1)

- [X] T003 [US1] Thêm mục Notifications và hai điều khiển cho FR-001 đến FR-003 trong `src/components/settings/SettingsDialog.tsx`.
- [X] T004 [US1] Áp dụng hai tùy chọn khi nhận lượt mới và giữ luồng trạng thái cho FR-002 đến FR-005 trong `src/lib/events.ts`.
- [X] T005 [US1] Xác minh giao diện, lưu tùy chọn và luồng thông báo trong `tests/unit/settingsDialog.test.tsx` và `tests/unit/completionNotification.test.tsx`.

## Final Phase: Validation

- [X] T006 Chạy bộ test và build, cập nhật tài liệu nguồn `specs/technical.md` và ghi kết quả trong `specs/agent-sessions/041-notification-settings/quickstart.md`.
- [ ] T007 Nghiệm thu desktop và theme cho SC-001 đến SC-003 theo `specs/agent-sessions/041-notification-settings/quickstart.md`.

## Dependencies & Implementation Strategy

T001 → T002 → T003/T004 → T005 → T006/T007. T003 và T004 có thể thực hiện độc lập sau khi có tùy chọn. US1 là toàn bộ MVP.
