# Implementation Plan: Làm mờ mục bị Git bỏ qua

**Branch** — `master` | **Date** — 2026-11-25 | **Spec** — [spec.md](spec.md)

## Summary

Phân loại các mục ngay khi tải từng thư mục của cây Files và dùng màu chữ phụ của theme cho mục bị Git bỏ qua.

## Technical Context

Herdsman dùng Rust và Tauri để đọc thư mục, React và TanStack Query để dựng cây desktop. Dùng Git sẵn có để kiểm tra toàn bộ mục của một thư mục trong một lần gọi. Kiểm chứng bằng Cargo, Vitest và hướng dẫn kiểm tra giao diện. Không cần lưu trạng thái lâu dài.

## Constitution Check

Đạt trước nghiên cứu và sau thiết kế. Các nguyên tắc I–III và V được giữ qua việc giới hạn thay đổi ở dữ liệu đọc của cây Files. Đóng ứng dụng giữa lúc tải cây chỉ kết thúc lần đọc và cây sẽ lấy dữ liệu lại khi mở. Nguyên tắc IV dùng cây ảo hóa hiện có, component chung và token giao diện sáng/tối. Nguyên tắc VI dùng thư mục của dự án hiện tại và không thêm store hoặc dependency.

## Project Structure

- `src-tauri/src/project_files.rs` đọc thư mục và gắn trạng thái bỏ qua.
- `src/lib/api.ts` mô tả metadata tùy chọn cho kết quả danh sách.
- `src/components/files/FileTree.tsx` hiển thị và làm mới trạng thái của cây.
- `tests/unit/fileTreeSearch.test.tsx` kiểm tra cây và kết quả tìm kiếm.
- [research.md](research.md), [data-model.md](data-model.md), [hợp đồng Files](contracts/files-tree.md) và [quickstart.md](quickstart.md) ghi lại thiết kế và cách kiểm chứng.
