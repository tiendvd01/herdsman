# Tasks — Panel History cho phiên agent

## Phase 1 — Setup

- [x] T001 Kiểm tra cổng đặc tả, repo và fixture trong `.gitignore` và `specs/history-search/063-session-history-panel/checklists/requirements.md`.

## Phase 2 — Foundational

- [x] T002 Kết nối hợp đồng đọc hai nguồn trong `src/lib/types.ts`, `src/lib/api.ts` và `src-tauri/src/lib.rs`.

## Phase 3 — US1 Xem lại phiên Herdsman

**Independent test** — Mở phiên đang chạy và đã kết thúc từ History, kiểm tra panel vẫn hiện.

- [x] T003 [US1] Liệt kê phiên Herdsman và vị trí của phiên trong `src-tauri/src/commands/history.rs`.
- [x] T004 [US1] Thay popover bằng tab History trong `src/components/panels/RightPanel.tsx`, `src/components/layout/WorkspaceView.tsx`, `src/stores/useUiStore.ts` và `src/components/history/HistoryPanel.tsx`.

## Phase 4 — US2 Xem lại phiên Claude Code CLI

**Independent test** — Duyệt và mở transcript từ ngoài Herdsman, kiểm tra phạm vi và kết quả trùng.

- [x] T005 [US2] Đọc transcript, báo lỗi từng nguồn, liên kết workspace và nhập phiên qua `src-tauri/src/claude_history.rs` và `src-tauri/src/commands/history.rs`.
- [x] T006 [US2] Gom dòng tương ứng cùng phiên, hiển thị nguồn và mở hội thoại CLI trong `src/components/history/HistoryPanel.tsx`.

## Phase 5 — US3 Tìm phiên trong History

**Independent test** — Tìm một từ khóa ở hai phạm vi, kiểm tra đoạn trích và mở bằng bàn phím.

- [x] T007 [US3] Kết nối tìm kiếm theo tiêu đề và nội dung, xử lý trạng thái tải, trống và lỗi trong `src/components/history/HistoryPanel.tsx`, `src-tauri/src/commands/history.rs` và `src-tauri/src/store.rs`.

## Final Phase — Validation

- [x] T008 [P] Cập nhật browser preview trong `src/lib/devMock.ts`.
- [x] T009 Kiểm tra Rust, frontend và ghi kết quả theo `specs/history-search/063-session-history-panel/quickstart.md`.
- [x] T010 Đồng bộ điểm truy cập History trong `specs/business-requirement/BR-001.md`, `specs/README.md` và `specs/history-search/031-session-history-search/spec.md`.

## Dependencies & Execution Order

T001 → T002 → US1 → US2 → US3 → validation. Sau T002, phần liên kết CLI ở Rust có thể thực hiện độc lập với việc nối tab ở US1. Browser preview chỉ phụ thuộc hợp đồng T002.

## Implementation Strategy

MVP duyệt và mở phiên Herdsman. Sau đó thêm nguồn CLI, tìm kiếm hai nguồn và kiểm tra luồng end-to-end.
