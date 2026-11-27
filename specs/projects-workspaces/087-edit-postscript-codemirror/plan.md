# Implementation Plan — Chỉnh Worktree Postscript bằng CodeMirror

## Summary

Thay trường nhập script trong hộp thoại project bằng CodeMirror với hỗ trợ cú pháp shell, số dòng và undo/redo. Giữ nút Save và Cancel cùng các phản hồi tải và lưu hiện có.

## Technical Context

React, TypeScript, TanStack Query và các gói CodeMirror đã có trong Herdsman. Nạp cú pháp shell bằng `languageForFile` và dùng bảng màu cú pháp của Files. Kiểm tra với Vitest và TypeScript.

## Constitution Check

- I. Đóng app khi sửa chỉ bỏ bản đang sửa. Lượt postscript và agent đang chạy độc lập với editor.
- II. Không đọc hoặc ghi transcript hay event log.
- III. Editor xử lý script dưới dạng văn bản. Chỉ hành động Save ghi cấu hình, còn điều kiện chạy script tuân theo spec 084.
- IV. Giới hạn chiều cao editor để cuộn nội dung. Dùng theme và cỡ chữ code của ứng dụng.
- V. Không đổi engine, giao thức terminal hoặc lệnh backend.
- VI. Cấu hình và bản đang sửa gắn với đúng project.
- Dùng token theme trong cả chế độ sáng/tối, viền focus và tên trường để nhận biết editor bằng bàn phím. Nhãn UI dùng tiếng Anh.
- Đối chiếu sau thiết kế đạt sáu nguyên tắc.

## Project Structure

- `src/components/project/WorktreePostscriptDialog.tsx` chứa editor và quy trình lưu.
- `src/lib/highlightCode.ts` cung cấp cú pháp và token dùng chung.
- `tests/unit/worktreePostscript.test.tsx` kiểm tra nội dung editor, undo/redo và luồng lưu.

## Complexity Tracking

Dùng các gói hiện có. Editor giữ lịch sử sửa trong lúc hộp thoại mở.
