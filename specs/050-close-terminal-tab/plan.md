# Implementation Plan — Đóng tab terminal bằng một thao tác

**Branch** — `master`  
**Date** — 2026-11-24  
**Spec** — [Đặc tả](spec.md)

## Summary

Nối nút đóng terminal trực tiếp với thao tác dừng terminal hiện có. Bỏ hộp thoại và trạng thái phục vụ riêng cho bước xác nhận.

## Technical Context

- TypeScript, React và TanStack Query trên Tauri desktop.
- Dùng thao tác dừng terminal hiện có, bao gồm thông báo lỗi và cập nhật danh sách sau thành công.
- Kiểm chứng bằng Vitest, Testing Library và typecheck.

## Constitution Check

Trước và sau thiết kế, sáu nguyên tắc đều đạt. Vòng đời agent, lịch sử hội thoại, phê duyệt công cụ, hiển thị hội thoại và tích hợp engine tiếp tục đi theo các luồng hiện có. Thoát app vẫn cho phép nối lại terminal. Thao tác chỉ ảnh hưởng tab terminal của workspace và tiếp tục dùng nút shadcn/ui với token hiện có cho cả hai theme.

## Project Structure

- `src/components/layout/WorkspaceView.tsx` xử lý nút đóng và điều hướng focus.
- `tests/unit/workspaceTerminal.test.tsx` kiểm tra thao tác đóng và thử lại.
- `specs/business-requirement/BR-001.md` và `specs/046-workspace-terminal/` ghi nhận hành vi đóng terminal.
