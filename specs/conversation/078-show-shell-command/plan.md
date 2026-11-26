# Implementation Plan: Hiện toàn bộ lệnh shell

**Branch**: `master` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Summary

Dùng nội dung lệnh Bash có sẵn trong thẻ cho phần chi tiết khi mở. Giữ khung monospace, cuộn và xuống dòng.

## Technical Context

React và TypeScript trên Tauri, kiểm thử bằng Vitest và Testing Library. Phạm vi là một đường render trong hội thoại. Lệnh lấy từ dữ liệu đã nhận, không phát sinh yêu cầu mạng hay thao tác lưu trữ.

## Constitution Check

1. Công việc nền diễn ra độc lập với giao diện thẻ.
2. Event đã lưu dùng chung đường render với event mới, không đổi định dạng lưu.
3. Cơ chế cấp quyền và thực thi dùng đường hiện có.
4. Lệnh là văn bản thuần, chỉ render phần chi tiết khi mở. Dùng `bg-code`, `text-foreground` và cỡ chữ code sẵn có để đọc được ở theme sáng và tối. Trạng thái giữ nhãn chữ, không phụ thuộc riêng vào màu.
5. UI đọc dữ liệu tool đã chuẩn hóa và không phân nhánh theo engine.
6. Không đổi mô hình project, workspace và session.

Kiểm tra sau thiết kế: hợp đồng chỉ thay đổi cách trình bày đầu vào thẻ Bash, đáp ứng cả sáu nguyên tắc.

## Project Structure

- `src/components/conversation/ToolCard.tsx` quyết định nội dung hiển thị trong thẻ.
- `tests/unit/toolCard.test.tsx` kiểm tra lệnh và output qua tương tác mở thẻ.
- Tài liệu thiết kế cùng thư mục gồm research, data model, hợp đồng UI và quickstart.
