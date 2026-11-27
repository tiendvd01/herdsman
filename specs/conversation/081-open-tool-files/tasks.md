# Tasks: Mở tệp từ thẻ Read và Write

## Setup and foundation

- [x] T001 Đối chiếu luồng mở tệp và tái sử dụng tab trong `src/stores/useFileStore.ts`.

## User Story 1 - Mở tệp từ thẻ Read hoặc Write (P1)

- [x] T002 [US1] Truyền hành động mở tệp của session vào thẻ trong `src/components/conversation/MessageList.tsx` (FR-002, FR-004).
- [x] T003 [US1] Thêm liên kết nhận chuột và bàn phím cho Read và Write có đường dẫn kiểu chuỗi, khác rỗng, độc lập với nút thu gọn trong `src/components/conversation/ToolCard.tsx` (FR-001–FR-003).
- [x] T004 [US1] Kiểm tra hai loại thẻ và đường dẫn gốc trong `tests/unit/toolCard.test.tsx`, cùng luồng mở và lỗi trong `tests/unit/conversationFileLinks.test.tsx` (FR-001–FR-004, SC-001–SC-002).

## Validation

- [x] T005 Chạy typecheck và unit tests theo `specs/conversation/081-open-tool-files/quickstart.md`.

T002 và T003 phải hoàn tất trước khi xác nhận T004. T005 kiểm tra kết quả sau triển khai.

Kiểm tra tự động đạt với `pnpm typecheck` và `pnpm test` (340 bài kiểm thử). Các bước chạy desktop trong quickstart dành cho nghiệm thu giao diện.
