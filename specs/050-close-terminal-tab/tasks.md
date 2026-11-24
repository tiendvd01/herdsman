# Tasks — Đóng tab terminal bằng một thao tác

## Phase 1 — Setup

Dùng hạ tầng kiểm thử hiện có.

## Phase 2 — Foundational

Dùng thao tác dừng terminal và điều hướng focus hiện có.

## Phase 3 — User Story 1 (P1)

Kiểm thử độc lập bằng cách đóng một terminal đang chạy trong workspace và quan sát tab biến mất sau đúng một thao tác.

- [X] T001 [US1] Cập nhật ca đóng terminal đang chạy và kiểm tra lỗi rồi thử lại trong tests/unit/workspaceTerminal.test.tsx.
- [X] T002 [US1] Gọi thao tác dừng trực tiếp từ nút đóng trong src/components/layout/WorkspaceView.tsx.

## Final Phase — Polish

- [X] T003 [P] Đồng bộ specs/business-requirement/BR-001.md và specs/046-workspace-terminal/ với hành vi mới.
- [X] T004 Chạy kiểm thử hồi quy và typecheck theo specs/050-close-terminal-tab/quickstart.md.

## Dependencies & Execution Order

T001 đi trước T002. T003 có thể chạy cùng T002 vì sửa tài liệu riêng. T004 kiểm tra sau các thay đổi.

## Parallel Example

Đồng bộ yêu cầu F12 và đặc tả workspace terminal trong khi cập nhật nút đóng.

## Implementation Strategy

US1 là toàn bộ MVP. Giao luồng đóng trực tiếp cùng kiểm thử lỗi và thử lại.
