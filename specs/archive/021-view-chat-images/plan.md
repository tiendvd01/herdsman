# Implementation Plan: Bấm để xem ảnh đính kèm trong chat

**Branch**: `master` | **Date**: 2026-11-23 | **Spec**: [spec.md](spec.md)

## Summary

Lưu ảnh đã gửi cùng dữ liệu session và dùng chung khung xem ảnh cho lịch sử và ô soạn.

## Technical Context

- **Languages and dependencies**: TypeScript, React, Radix Dialog, Node.js, Rust và Tauri hiện có.
- **Storage**: Tệp ảnh theo session. Event log giữ loại ảnh và mã tham chiếu.
- **Testing**: Vitest, Node socket contract và Cargo.
- **Target**: Ứng dụng desktop, ưu tiên macOS. Chỉ đọc ảnh khi hàng chứa ảnh được hiển thị.

## Constitution Check

- I. Agent vẫn chạy độc lập trong terminal hiện có. Kiểm thử ngắt kết nối và kết nối lại khi một lượt đang chạy.
- II. Log tiếp tục append-only và đọc được event cũ. Tệp ảnh được ghi trước khi phát event.
- III. Không thay đổi luồng duyệt quyền hoặc trạng thái agent.
- IV. Lịch sử tiếp tục dùng danh sách ảo. Ảnh được hiển thị bằng phần tử ảnh, không chèn HTML.
- V. Dùng AgentEvent chuẩn hóa và giữ nguyên đầu vào engine.
- VI. Tái sử dụng session và ứng dụng desktop hiện có. Không thêm dependency hoặc tầng tổ chức.

Kiểm tra sau thiết kế đạt sáu nguyên tắc.

## Project Structure

- `sidecar/src/index.mjs` ghi ảnh và phát tham chiếu.
- `src-tauri/src/commands.rs` và `src-tauri/src/lib.rs` cung cấp lệnh đọc theo session. `src-tauri/src/agent.rs` đọc log khi socket đã đóng.
- `src/lib/` và `src/stores/useSessionStore.ts` giữ tham chiếu trong lịch sử.
- `src/components/conversation/` và `src/components/composer/Composer.tsx` hiển thị ảnh.
- `sidecar/test/` và `tests/unit/` kiểm thử replay và thao tác xem.

## Complexity Tracking

Không có ngoại lệ.
