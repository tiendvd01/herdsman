# Implementation Plan: Chuyển vòng quay lên đầu hàng workspace

**Feature**: 022-move-workspace-spinner  
**Date**: 2026-11-23  
**Spec**: [spec.md](spec.md)

## Summary

Dùng vòng quay sẵn có tại vị trí icon loại workspace. Đặt nút menu trong bố cục hàng để độ rộng dành cho tên ổn định khi rê chuột và mở menu.

## Technical Context

- TypeScript 5.8, React 18, Tailwind CSS 4, Radix Dropdown Menu.
- Ứng dụng desktop Tauri trên macOS. Kiểm tra bằng Vitest, TypeScript và kiểm tra bố cục trên trình duyệt.
- Dùng trạng thái phiên đã có. Phạm vi gồm hai loại hàng workspace trong thanh bên. Mục tiêu là 0 pixel dịch chuyển ở cùng độ rộng và trạng thái phiên.

## Constitution Check

Trước và sau thiết kế, cả sáu nguyên tắc đều đạt. I. Agent tiếp tục chạy nếu đóng app. II. Đặc tả chỉ tác động lớp hiển thị. III. Vòng quay tiếp tục phản ánh trạng thái làm việc và giữ dấu hiệu cần chú ý. IV. Việc đổi icon giữ kích thước hàng. V. Dùng trạng thái phiên chuẩn hóa của ứng dụng. VI. Giữ cấu trúc Project → Workspace → Session.

## Project Structure

- `src/components/layout/Sidebar.tsx` hiển thị icon, tên, số đếm và menu.
- `src/components/workspace/WorkspaceMenu.tsx` quản lý nút kích hoạt và các thao tác menu.
- `tests/unit/runningSpinner.test.tsx` và `tests/unit/workspaceMenu.test.tsx` kiểm tra hành vi hiện có.
- Thiết kế chi tiết nằm trong [research.md](research.md), [data-model.md](data-model.md), [hợp đồng hiển thị](contracts/workspace-row.md) và [quickstart.md](quickstart.md).
