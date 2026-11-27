# Tasks — Khởi tạo CodeGraph theo project

## Phase 1 — Setup

- [x] T001 Đối chiếu cấu hình Herdr App cục bộ và CLI trong research.md.

## Phase 2 — User Stories 1 & 2

- [x] T002 [US2] Tạo và kiểm thử Git exclude trong `src-tauri/src/project_codegraph.rs`.
- [x] T003 [US1] Thêm status và khởi chạy init/refresh qua hc, đồng bộ Tauri và `src/lib/api.ts`.
- [x] T004 [US1] Thêm hộp thoại từ Sidebar và kiểm thử đường chọn hành động, cập nhật trạng thái và sửa exclude.

## Phase 3 — Verification

- [x] T005 Chạy kiểm tra frontend, Rust và smoke CLI, đối chiếu spec, plan và tasks.

## Verification

- Checklist đạt 16/16. Spec, plan và tasks bao phủ FR-001 đến FR-005.
- `pnpm typecheck` và `git diff --check` đạt.
- `pnpm test` đạt 355 test trên 54 tệp.
- `cargo test --manifest-path src-tauri/Cargo.toml project_codegraph` đạt 2 test, gồm Git exclude dùng chung và tìm lượt chạy theo thư mục.
- Smoke với CodeGraph thật qua herdr-core cô lập tạo index, đọc lại kết quả terminal và xác nhận Git status giữ nguyên trên checkout thử.
- Chưa mở hộp thoại bằng GUI desktop để kiểm tra trực quan.
