# Implementation Plan: Mở đường dẫn thư mục ẩn

## Summary

Chuẩn hóa đường dẫn bắt đầu bằng `~/` trong FileTree và bật hành động mở tệp cho Edit.

## Technical Context

React và TypeScript dùng HomeDirectory từ app info và luồng tìm đường dẫn tuyệt đối hiện có. Rust tiếp tục đọc thư mục project bằng luồng chung.

## Constitution Check

Đạt trước và sau thiết kế. Đây là thao tác giao diện chủ động, dùng cơ chế đọc tệp hiện có. Agent tiếp tục chạy khi giao diện đóng.

## Project Structure

- `src/components/files/FileTree.tsx`
- `src/components/conversation/ToolCard.tsx`
- `tests/unit/fileTreeSearch.test.tsx` và `tests/unit/toolCard.test.tsx`
- `src-tauri/src/project_files.rs` cho kiểm thử thư mục ẩn.

## Complexity Tracking

Tái sử dụng hành động mở tệp và đường dẫn tuyệt đối.
