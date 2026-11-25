---
description: "Danh sách việc triển khai icon Material và màu trạng thái Git"
---

# Tasks: Icon Material và màu trạng thái Git

**Input** — `specs/files-git/035-file-icons-git-colors/`

**Prerequisites** — [Spec](spec.md), [plan](plan.md), [research](research.md), [data model](data-model.md), [contracts](contracts/file-status.md) và [quickstart](quickstart.md).

## Format

Mỗi mục có checkbox, ID tăng dần và đường dẫn cụ thể. `[P]` đánh dấu việc có thể chạy cùng việc khác sau khi đủ điều kiện phụ thuộc. `[USn]` xác định user story.

## Phase 1 — Setup

- [X] T001 Ghim một tag hoặc commit của Material Icon Theme, nhập tập SVG cho thư mục, file mặc định và các loại file phổ biến gồm TypeScript, Markdown và JSON vào `src/assets/material-icons/`. Ghi nguồn và giữ nguyên thông báo MIT tại `src/assets/material-icons/LICENSE`.

## Phase 2 — Foundational

- [X] T002 [P] Trong `src/components/files/fileRows.ts`, thêm bộ phân loại trạng thái dùng chung theo `specs/files-git/035-file-icons-git-colors/contracts/file-status.md`. Xét mã xung đột trước, sau đó xóa, đổi tên hoặc sao chép, thêm và sửa. Hiển thị `??` bằng `U` với nhãn “Untracked”, giữ mã ghép và dùng trung tính cho mã chưa phân loại. Cung cấp nhãn truy cập tiếng Anh.
- [X] T003 [P] Cung cấp vai trò màu chữ trong `src/theme/roles.ts` cho nhóm trạng thái chưa có token phù hợp và tái tạo `src/styles/theme-roles.css` bằng `scripts/gen-theme-css.mjs`. Kiểm tra token trong theme sáng, tối và trên nền dòng đang chọn.

## Phase 3 — User Story 1 · Nhận biết loại file qua icon (P1, MVP)

**Mục tiêu** — Nhận diện file và thư mục bằng icon Material.

**Kiểm tra độc lập** — Mở cây có TypeScript, Markdown, JSON, một đuôi lạ và một thư mục. Đối chiếu cả năm icon, thử mở file và bung thư mục.

- [X] T004 [US1] Thêm bộ chọn icon bằng URL asset tĩnh trong `src/components/files/materialFileIcons.ts`. Ưu tiên tên file chính xác, hậu tố dài nhất có hỗ trợ, rồi icon file chung. Thư mục dùng icon thư mục riêng. Chỉ truy cập asset trong tập đóng gói.
- [X] T005 [US1] Gắn icon Material dạng ảnh trang trí với `alt=""` vào các dòng trong `src/components/files/FileTree.tsx`. Giữ nhãn file, thao tác bằng bàn phím, mở file và đóng/mở thư mục.

## Phase 4 — User Story 2 · Phân biệt thay đổi trong Git Changes (P2)

**Mục tiêu** — Quét danh sách thay đổi theo màu và đọc trạng thái từ ký hiệu.

**Kiểm tra độc lập** — Mở Git Changes có file thêm, sửa và xóa. Đối chiếu màu và ký hiệu, chọn một dòng và mở diff trong cả theme sáng lẫn tối.

- [X] T006 [US2] Tích hợp bộ phân loại và token vào dòng Git Changes trong `src/components/panels/RightPanel.tsx`. Tô tên file, hiển thị ký hiệu chữ ở mép phải, dùng tên truy cập gồm đường dẫn và ý nghĩa trạng thái, giữ focus, hover, selection và thao tác mở diff.

## Phase 5 — User Story 3 · Nhận ra file thay đổi trong File Tree (P3)

**Mục tiêu** — Tô đúng file thuộc checkout của project và cập nhật sau khi trạng thái Git thay đổi.

**Kiểm tra độc lập** — Duyệt project có hai file trùng tên ở hai thư mục. Sửa một file, tạo file chưa track rồi kiểm tra màu. Hoàn tác và làm mới. Sửa đường dẫn tương ứng trong worktree riêng rồi xác nhận cây project vẫn phản ánh checkout của mình.

- [X] T007 [P] [US3] Thêm helper đọc trạng thái theo thư mục project trong `src-tauri/src/git.rs`. Tái sử dụng parser porcelain NUL, xác định Git top-level và chuẩn hóa đường dẫn project. Lọc theo thành phần đường dẫn và trả `path` tương đối với project, phân tách bằng slash. Dùng đích rename/copy, trả danh sách rỗng cho project ngoài Git và giữ lỗi đọc Git thực sự.
- [X] T008 [P] [US3] Thêm `api.projectFilesChanged(projectId)` trả `ChangedFile[]` trong `src/lib/api.ts` và mô phỏng IPC cùng shape trong `src/lib/devMock.ts`. Giữ hợp đồng `files_changed`, `file_diff` và `project_files_list`.
- [X] T009 [US3] Đăng ký `project_files_changed` trong `src-tauri/src/lib.rs` và triển khai trong `src-tauri/src/commands.rs` bằng project ID đã đăng ký và helper T007. Trả mỗi entry có `path: string` và `status: string`.
- [X] T010 [US3] Thêm khóa `['files', 'project', projectId]` trong `src/lib/queries.ts`. Cache theo phạm vi và ID. Gọi một truy vấn mỗi cây đang mở, cập nhật mỗi 5 giây và tạo một map theo snapshot trong `src/components/files/FileTree.tsx`. Nối refresh Git với khóa project và workspace liên quan trong `src/components/panels/RightPanel.tsx` và kiểm tra thao tác lưu tiếp tục invalidation prefix `['files']`.
- [X] T011 [US3] Tích hợp màu, ký hiệu và nhãn truy cập dùng chung vào từng dòng file trong `src/components/files/FileTree.tsx`. So khớp toàn bộ đường dẫn, phân biệt hoa thường theo kết quả Git. Chỉ file được đối chiếu trạng thái. Thay map khi nhận snapshot thành công, kể cả rỗng. Giữ thao tác cây khi đang tải hoặc truy vấn lỗi và dùng màu mặc định cho dòng chưa có trạng thái xác nhận.

## Phase 6 — Polish & Cross-Cutting Concerns

- [ ] T012 Chạy typecheck, các test đích và kịch bản Tauri trong `specs/files-git/035-file-icons-git-colors/quickstart.md`. Đối chiếu SC-001 đến SC-004, cả hai theme, trạng thái chọn, bàn phím, mở file và mở diff.

## Dependencies & Execution Order

- Setup và nền tảng hoàn tất trước các mốc giao tính năng. T002 và T003 có thể làm song song.
- US1 theo T004 → T005. US2 theo T006 và dùng nền tảng trạng thái chung.
- US3 dùng nền tảng trạng thái chung. T007 và T008 có thể chạy song song, sau đó T009 → T010 → T011. T010 nối vào luồng refresh đã chỉnh ở T006. Thực hiện T011 sau T005 để tránh sửa đồng thời `FileTree.tsx`.
- T012 chạy sau cả ba story.

## Parallel Examples

- **US1** — T004 có thể thực hiện cùng T006 vì bộ chọn icon và dòng Git Changes nằm ở hai file riêng.
- **US2** — T006 có thể thực hiện cùng T007. Hai việc sửa UI Git Changes và backend Git độc lập.
- **US3** — T007 và T008 có thể thực hiện đồng thời sau nền tảng. Tích hợp luồng IPC sau khi hai việc hoàn tất.

## Implementation Strategy

1. MVP gồm setup, nền tảng và US1. Xác nhận năm loại entry và thao tác cơ bản trên cây.
2. Thêm US2 và kiểm tra màu, ký hiệu và mở diff từ Git Changes.
3. Thêm US3 rồi kiểm tra trạng thái sạch, refresh và cách ly giữa project với worktree.
4. Chạy toàn bộ quickstart trên ứng dụng desktop.
