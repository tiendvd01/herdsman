# Implementation Plan: Đánh dấu tất cả thông báo PR là chưa đọc

**Branch**: `master` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Summary

Thêm nút vào khu vực thông báo dùng chung của Overview và Notifications. Gửi tập sự kiện đang thuộc phạm vi được chọn, lưu nguyên tử rồi cập nhật bản hiển thị để cả hai bộ đếm đồng bộ.

## Technical Context

React/TypeScript, Button hiện có, TanStack Query, Tauri/Rust và SQLite. Các snapshot hiện có lưu theo tài khoản và repository. Vitest kiểm tra giao diện và Rust kiểm tra ghi, cách ly và rollback.

## Constitution Check

Đạt sau thiết kế. Thao tác chỉ thay đổi trạng thái đọc của PR. Agent tiếp tục chạy khi đóng app. Không thay đổi hội thoại, quyền, engine hay phân cấp project. Giao dịch SQLite giữ trạng thái nhất quán nếu app ngắt giữa các lần ghi. Kiểm tra giao diện dùng nhãn tiếng Anh, Button với token theme và chỉ báo focus.

## Project Structure

- `src/components/layout/PullRequests.tsx` sở hữu phạm vi, nút và bộ đếm.
- `src-tauri/src/pull_requests.rs` lưu trạng thái. `src-tauri/src/lib.rs` đăng ký lệnh.
- `tests/unit/pullRequests.test.tsx` kiểm tra luồng giao diện.
