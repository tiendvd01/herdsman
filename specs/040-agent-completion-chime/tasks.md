# Tasks: Tiếng báo khi agent hoàn thành

## Phase 1: Setup

- [X] T001 Đối chiếu hook thông báo, nguồn kết quả lượt và checklist trong `src/lib/events.ts`, `src-tauri/src/agent.rs` và `specs/040-agent-completion-chime/checklists/requirements.md`.

## Phase 2: Foundational

Dùng plugin thông báo, event log và hạ tầng kiểm thử hiện có.

## Phase 3: User Story 1 (P1)

- [X] T002 [US1] Chuyển tiếp định danh, thời điểm và tên Session của lượt thành công trong `src-tauri/src/agent.rs` và xác minh bằng `src-tauri/tests/flow.rs`.
- [X] T003 [US1] Gửi một thông báo kèm âm cho lượt mới, tôn trọng quyền hệ điều hành và bỏ qua sự kiện cũ hoặc trùng trong `src/lib/events.ts`.
- [X] T004 [US1] Kiểm thử focus, chạy nền, quyền bị từ chối, phát lại và chống trùng trong `tests/unit/completionNotification.test.tsx`.

## Final Phase: Validation

- [X] T005 Chạy kiểm thử và typecheck theo `specs/040-agent-completion-chime/quickstart.md`.
- [ ] T006 Nghiệm thu âm thanh và quyền hệ điều hành theo SC-001 đến SC-003 trong `specs/040-agent-completion-chime/quickstart.md`.

## Dependencies & Implementation Strategy

T001 → T002 → T003. T004 có thể chuẩn bị cùng T002. T005 và T006 xác minh US1 sau khi mã đã triển khai.
