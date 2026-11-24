# Implementation Plan: Mở tệp từ Rich Conversation

**Branch**: `master` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

## Summary

Nhận diện tham chiếu tệp trong Rich Conversation, đọc theo thư mục làm việc của session bằng lệnh Tauri và chỉ cập nhật tab sau khi đọc thành công.

## Technical Context

React/TypeScript, react-markdown, Zustand và Rust/Tauri. Dùng lại bộ đọc tệp UTF-8 tối đa 2 MiB, tab tệp và thông báo lỗi hiện có. Xử lý đường dẫn trong từng khối nội dung để phù hợp danh sách ảo và tin nhắn streaming. Mục tiêu là hiển thị tệp nhỏ trong 2 giây ở ít nhất 19/20 lần thử.

## Constitution Check

1. Agent chạy độc lập. Đóng app trong khi đọc tệp không ảnh hưởng tới agent, và session dùng luồng kết nối lại hiện có.
2. Chỉ diễn giải tham chiếu lúc hiển thị. Event log và transcript giữ nguyên, bao gồm lịch sử cũ.
3. Liên kết chỉ điều hướng sau thao tác người dùng và không gọi tool của agent.
4. Giữ sanitizer, danh sách ảo và hiển thị streaming. Kiểm tra phím Tab/Enter, theme sáng/tối và khối mã.
5. Không đổi adapter, giao thức hay engine.
6. Backend lấy thư mục làm việc từ Session → Workspace → Project, giữ đúng worktree.

Đối chiếu sau thiết kế đạt sáu nguyên tắc. Dùng thành phần và token theme hiện có, lỗi tiếng Anh. Không thêm store, dependency hoặc giao thức agent.

## Project Structure

- `src/components/conversation/` xử lý liên kết trong Markdown, văn bản và tin streaming.
- `src/stores/useFileStore.ts` dùng lại tab đang mở và giữ bản nháp.
- `src/lib/api.ts`, `src/lib/devMock.ts` và `src-tauri/src/` cung cấp thao tác đọc tệp theo session.
- `tests/unit/` và unit test Rust kiểm tra nhận diện, tab và phạm vi đường dẫn.

## Complexity Tracking

Dùng lệnh đọc riêng để đường dẫn từ hội thoại luôn được kiểm tra theo session. Luồng mở tệp tuyệt đối hiện có phục vụ thao tác trực tiếp của người dùng.
