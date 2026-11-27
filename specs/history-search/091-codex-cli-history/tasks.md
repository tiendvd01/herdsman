# Tasks — Phiên Codex CLI trong History

## Phase 1 — Setup

- [x] T001 Xác nhận giao thức Codex local, các quy tắc theme và điều kiện nghiệm thu trong `specs/history-search/091-codex-cli-history/research.md` và `quickstart.md`.

## Phase 2 — Foundational

- [x] T002 Đăng ký command và kiểu dữ liệu trong `src-tauri/src/lib.rs`, `src/lib/api.ts`, `src/lib/types.ts` và `src/lib/devMock.ts`.

## Phase 3 — User Story 1 (P1)

**Independent test** — Duyệt hai phạm vi, tìm theo tên hoặc phần xem trước và kiểm tra chỉ có một mục cho phiên liên kết.

- [x] T003 [US1] Lấy danh sách CLI phân trang, lọc phạm vi theo liên kết hoặc thư mục trong `sidecar/src/engines/codex.mjs` và `src-tauri/src/commands/history.rs` (FR-001).
- [x] T004 [US1] Gộp, sắp xếp, tìm và xử lý lỗi riêng theo nguồn trong `src/components/history/HistoryPanel.tsx` (FR-002–FR-004, FR-006).
- [x] T005 [P] [US1] Kiểm tra phân trang, phạm vi, gộp và lỗi nguồn trong `sidecar/test/codex.contract.test.mjs`, `src-tauri/src/commands/history.rs` và `tests/unit/historyPanel.test.tsx` (SC-001, SC-003).

## Phase 4 — User Story 2 (P2)

**Independent test** — Chọn phiên ngoài app rồi kiểm tra lời nhắn, trường hợp lỗi và việc quay về History bằng bàn phím.

- [x] T006 [US2] Kiểm tra quyền xem và đọc lời nhắn qua metadata trong `sidecar/src/engines/codex.mjs` và `src-tauri/src/commands/history.rs` (FR-005).
- [x] T007 [US2] Nối bản xem chỉ đọc và trạng thái trong `src/components/history/CodexHistoryDialog.tsx` và `src/components/history/HistoryPanel.tsx` (FR-005, FR-006).
- [x] T008 [P] [US2] Kiểm tra chỉ đọc, thứ tự lời nhắn, trạng thái và giữ bộ lọc trong `sidecar/test/codex.contract.test.mjs` và `tests/unit/historyPanel.test.tsx` (SC-002–SC-004).

## Phase 5 — Validation

- [x] T009 Chạy các bộ kiểm thử và ghi kết quả xác minh trong `specs/history-search/091-codex-cli-history/quickstart.md`.

## Dependencies & Execution Order

T001 → T002 → US1 → US2 → T009. Kiểm thử sidecar và giao diện của mỗi story có thể chuẩn bị độc lập sau T002.

## Parallel Example

Sidecar kiểm tra các trang Codex giả lập trong khi Vitest kiểm tra thao tác History bằng dữ liệu mô phỏng cùng hợp đồng.

## Implementation Strategy

Hoàn tất US1 để duyệt và tìm. Thêm US2 để đọc lời nhắn rồi chạy hồi quy ba lớp.
