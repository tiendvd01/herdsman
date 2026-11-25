# Implementation Plan — Quản lý phím tắt

## Summary

Dùng danh mục chung cho phím cấp ứng dụng, cài đặt và nhãn UI. Chuyển tab theo thứ tự hiển thị. Đóng tab qua nút đóng tương ứng.

## Technical Context

React và TypeScript ở frontend, Tauri và Rust cho menu desktop. Dùng localStorage cho tùy chỉnh trên máy, QueryClient hiện có cho lệnh session và các component shadcn hiện có. Kiểm tra bằng Vitest, TypeScript và Cargo.

## Constitution Check

- I–III — Tùy chỉnh phím độc lập với tiến trình agent, dữ liệu hội thoại và quyền. Đóng session đi qua xác nhận hiện có.
- IV — Đọc cấu hình tại thời điểm bấm phím. Danh mục không ảnh hưởng vòng render hội thoại.
- V–VI — Giữ nguyên engine, quy trình Herdr và cấu trúc project, workspace, session. Không thêm dependency.
- Settings dùng nhãn tiếng Anh và token theme hiện có. Kiểm tra khôi phục cấu hình sau khi mở lại.

## Project Structure

- `src/lib/keyboardShortcuts.ts` chứa danh mục, nhận phím, lưu và kiểm tra xung đột.
- `CommandDialog.tsx` xử lý lệnh cấp ứng dụng và hiển thị nhãn hiện hành.
- `WorkspaceView.tsx` nối thao tác tab với nút hiện có.
- `KeyboardShortcutsSection.tsx` cung cấp giao diện trong Settings.
- `src-tauri/src/lib.rs` đồng bộ accelerator Zoom và nhãn Close Tab trên menu desktop.

## Complexity Tracking

Một danh mục và bộ điều phối dùng chung cần thiết để kiểm tra xung đột và đồng bộ nhãn. Tận dụng trạng thái giao diện hiện có cho mọi hành động.
