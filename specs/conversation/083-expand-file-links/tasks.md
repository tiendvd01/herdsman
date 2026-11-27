# Tasks: Mở thêm tệp từ Rich Conversation

## User Story 1

- [x] T001 [US1] Mở MultiEdit và từng đích diff trong src/components/conversation/ToolCard.tsx và lineDiff.ts.

## User Story 2

- [x] T002 [US2] Nhận diện tham chiếu trong src/components/conversation/fileLinks.tsx và kết quả công cụ trong ToolCard.tsx.
- [x] T003 [US2] Điều hướng đến vị trí qua src/stores/useFileStore.ts và src/components/files/FileEditor.tsx.

## Validation

- [x] T004 Kiểm thử tại tests/unit/conversationFileLinks.test.tsx và tests/unit/toolCard.test.tsx, rồi chạy typecheck và Vitest.

Rà soát bao phủ FR-001–FR-004 và SC-001–SC-002. Kiểm thử xác nhận từng đích trong diff, tham chiếu của kết quả công cụ, giữ bản nháp và vị trí trong CodeMirror. Typecheck và 349 bài Vitest đạt. Nghiệm thu desktop theo quickstart.
