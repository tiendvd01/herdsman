# Tasks — Chỉnh Worktree Postscript bằng CodeMirror

## Phase 1 — Setup

- [x] T001 Xác nhận hỗ trợ ngôn ngữ shell và quy trình lưu hiện có trong `research.md`.

## Phase 2 — User Story 1

- [x] T002 [US1] Cập nhật `tests/unit/worktreePostscript.test.tsx` để kiểm tra editor thật, nội dung nhiều dòng, undo/redo, dữ liệu theo project và lưu lại sau lỗi.
- [x] T003 [US1] Tích hợp CodeMirror trong `src/components/project/WorktreePostscriptDialog.tsx` và dùng nội dung đang sửa khi Save (FR-001 đến FR-005).

## Phase 3 — Verification

- [x] T004 Chạy TypeScript, test frontend và test Rust liên quan rồi ghi kết quả đối chiếu `quickstart.md`.

T002 tái hiện khác biệt trước khi tích hợp. T004 chạy sau T003.

## Verification

- Spec, plan và tasks bao phủ FR-001 đến FR-005. Checklist đặc tả đạt 16/16.
- Test hồi quy xác nhận editor cũ thiếu CodeMirror trước khi sửa.
- `pnpm test` đạt 353 test. Chạy lại riêng Worktree Postscript sau lần chỉnh cuối đạt 4 test.
- `pnpm typecheck` và `git diff --check` đạt.
- `cargo test --manifest-path src-tauri/Cargo.toml worktree_postscript` đạt 2 test.
- Chưa kiểm tra trực quan trên desktop ở hai theme.
