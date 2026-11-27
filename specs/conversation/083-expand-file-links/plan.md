# Implementation Plan: Mở thêm tệp từ Rich Conversation

## Summary

Dùng lại luồng mở tệp theo session. Truyền vị trí đến tab Files và đọc từng đích từ phần đầu diff.

## Technical Context

React, TypeScript, CodeMirror và bộ đọc tệp Tauri hiện có. Kiểm thử bằng Vitest.

## Constitution Check

Đạt trước và sau thiết kế. Điều hướng thuộc giao diện, dùng dữ liệu hội thoại hiện có và giữ bản nháp. Agent tiếp tục chạy khi app đóng.

## Project Structure

- src/components/conversation xử lý tham chiếu và thẻ công cụ.
- src/stores/useFileStore.ts và src/components/files/FileEditor.tsx xử lý vị trí.
- tests/unit kiểm tra các luồng tương ứng.

## Complexity Tracking

Tái sử dụng kiểm tra phạm vi workspace và tab hiện có.
