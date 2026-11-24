# Tasks: Tìm file trong cây thư mục

## Phase 1 — Setup

- [x] T001 Kiểm tra phạm vi cây và điểm mở tab trong src/components/files/FileTree.tsx và src-tauri/src/project_files.rs.

## Phase 2 — Foundational

- [x] T002 Nối hợp đồng tìm file vào src-tauri/src/commands.rs, src-tauri/src/lib.rs, src/lib/api.ts và src/lib/devMock.ts.

## Phase 3 — US1 Tìm file trong project

Kiểm thử độc lập với file trùng tên và thư mục thu gọn.

- [x] T003 [US1] Duyệt file theo quy tắc cây, lọc đường dẫn không phân biệt hoa thường và kiểm thử trong src-tauri/src/project_files.rs.
- [x] T004 [US1] Hiển thị ô nhập, đường dẫn, trạng thái chờ, rỗng, thử lại và kết quả thuộc đúng project/truy vấn trong src/components/files/FileTree.tsx.

## Phase 4 — US2 Mở file và quay lại cây

Kiểm thử độc lập với một thư mục đã mở trước khi tìm.

- [x] T005 [US2] Mở kết quả bằng chuột hoặc bàn phím, giữ tab và thư mục đã mở khi xóa truy vấn trong src/components/files/FileTree.tsx.
- [x] T008 [US2] Cho mở file theo đường dẫn tuyệt đối qua Enter hoặc chọn hàng file trong kết quả trong src/components/files/FileTree.tsx, đọc file ngoài project qua src-tauri/src/project_files.rs và kiểm tra bằng tests/unit/fileTreeSearch.test.tsx.

## Phase 5 — Polish

- [x] T006 Cập nhật mô tả sidebar Files trong specs/technical.md và kiểm thử tự động theo specs/042-search-file-tree/quickstart.md và tests/unit/fileTreeSearch.test.tsx.
- [ ] T007 Đo độ trễ từ ký tự cuối tới kết quả trên bản desktop và nghiệm thu với 10 người dùng theo specs/042-search-file-tree/quickstart.md.

## Dependencies & Execution Order

T002 và T003 có thể thực hiện song song ở các file khác nhau sau khi thống nhất contract. T004 tích hợp hai phần này. T005 dùng hàng kết quả của T004. T006 và T007 xác thực sau khi hoàn thành hai câu chuyện.

## Implementation Strategy

US1 cung cấp khả năng tìm file độc lập. US2 hoàn thành thao tác mở file và trở lại chế độ duyệt cây.
