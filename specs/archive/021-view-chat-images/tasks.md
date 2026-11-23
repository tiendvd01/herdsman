# Tasks: Bấm để xem ảnh đính kèm trong chat

## Phase 1: Setup

- [X] T001 Kiểm tra cấu hình hiện có trong `.gitignore`, `package.json` và `sidecar/package.json`.

## Phase 2: Foundational

- [X] T002 Tạo khung xem dùng chung trong `src/components/conversation/ImagePreview.tsx` (FR-002).

## Phase 3: User Story 1 — Xem ảnh đã gửi (P1)

**Independent test** — Gửi hai ảnh, mở từng ảnh và kết nối lại để xem ảnh cũ.

- [X] T003 [US1] Kiểm thử tham chiếu ảnh qua ngắt kết nối và replay trong `sidecar/test/socket.contract.test.mjs` (FR-001, FR-003).
- [X] T004 [US1] Lưu tệp trước khi emit và cung cấp lệnh đọc trong `sidecar/src/index.mjs`, `src-tauri/src/commands.rs` và `src-tauri/src/lib.rs`. Kiểm tra mở lại và đọc log khi socket đã đóng trong `src-tauri/src/agent.rs` và `src-tauri/tests/flow.rs` (FR-003, FR-004).
- [X] T005 [US1] Dựng ảnh và fallback trong `src/lib/api.ts`, `src/lib/types.ts`, `src/stores/useSessionStore.ts` và `src/components/conversation/MessageList.tsx` (FR-001, FR-002, FR-004).

## Phase 4: User Story 2 — Kiểm tra ảnh trước khi gửi (P2)

**Independent test** — Đính kèm, mở, đóng và gỡ một ảnh trong bản nháp.

- [X] T006 [US2] Kiểm thử và tích hợp khung xem vào `tests/unit/composerExpand.test.tsx` và `src/components/composer/Composer.tsx` (FR-005).

## Phase 5: Validation

- [X] T007 Kiểm tra hồi quy ảnh thiếu/hỏng và chọn đúng ảnh trong `tests/unit/chatImages.test.tsx`. Chạy bộ kiểm thử và cập nhật `specs/technical.md`.

## Dependencies and execution

T001 trước T002. T003 có thể chuẩn bị cùng T002 vì sửa các tệp khác nhau. T004 theo T003, T005 theo T002 và T004. T006 dùng T002 và có thể thực hiện song song với T004. T007 chạy cuối.

## Implementation strategy

Hoàn thành US1 để xem ảnh từ lịch sử, sau đó dùng cùng khung xem trong US2.


## Validation results

- Frontend: 192 kiểm thử đạt, TypeScript và bản build đạt.
- Sidecar: 20 kiểm thử hợp đồng đạt. Smoke test dùng Claude thật gặp giới hạn 5 giờ của tài khoản.
- Rust: 19 kiểm thử đạt, gồm đọc ảnh sau khi mở lại phiên và đọc lịch sử khi sidecar đã dừng.
