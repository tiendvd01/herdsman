# Tasks: Làm mờ mục bị Git bỏ qua

## Format

`[ID] [P?] [Story] Description`. Đường dẫn tính từ gốc repository.

## Phase 1: Setup

- [X] T001 Kiểm tra phụ thuộc và quy tắc loại trừ hiện có trong `package.json`, `src-tauri/Cargo.toml` và `.gitignore`.

## Phase 2: Foundational

- [X] T002 Khai báo metadata `ignored` kiểu boolean tùy chọn, có giá trị `true` khi Git xác định mục thuộc diện bỏ qua, trong `src/lib/api.ts`.

## Phase 3: User Story 1 - Nhận biết mục bị Git bỏ qua (P1)

Kiểm tra độc lập bằng repository mẫu trong `specs/files-git/054-dim-gitignored-files/quickstart.md`.

- [X] T003 [P] [US1] Kiểm tra và triển khai phân loại mỗi thư mục bằng Git, với fallback khi Git không trả được trạng thái, trong `src-tauri/src/project_files.rs`.
- [X] T004 [P] [US1] Dùng màu chữ phụ cho tên mục bị bỏ qua và tải lại trạng thái khi mở lại cây trong `src/components/files/FileTree.tsx`. Kiểm tra hành vi qua `tests/unit/fileTreeSearch.test.tsx`.

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T005 Kiểm chứng yêu cầu và ghi kết quả kiểm tra trong `specs/files-git/054-dim-gitignored-files/quickstart.md`.

## Dependencies & Execution Order

T001 rồi T002. T003 và T004 có thể thực hiện song song dựa trên hợp đồng metadata. T005 chạy sau khi cả hai hoàn tất.

## Implementation Strategy

US1 là bản khả dụng tối thiểu và là phạm vi tính năng.
