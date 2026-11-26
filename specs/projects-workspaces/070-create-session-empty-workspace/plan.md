# Implementation Plan — Tạo session từ workspace trống

## Summary

Đưa menu tạo session hiện có xuống giữa vùng nội dung khi workspace đang hoạt động đã tải và không có tab. Khi có tab, hiển thị menu trên thanh tab như hiện tại.

## Technical Context

React, TypeScript, bộ thành phần giao diện hiện có và Vitest trong ứng dụng Tauri. Tái sử dụng danh sách tab, truy vấn tải session và terminal, menu tạo session và phím tắt hiện tại.

## Constitution Check

I và II đạt vì vòng đời agent và dữ liệu giữ nguyên. III đạt vì người dùng chủ động chọn agent. IV đạt vì trạng thái trống dựa trên dữ liệu đang dùng để vẽ tab. V đạt vì giữ lựa chọn Claude Code, Codex và Terminal. VI đạt vì session mới thuộc workspace đang xem.

Nút giữa dùng biến thể chính và nhãn tiếng Anh. Token của nút dùng màu nền và chữ theo cặp theme sáng và tối. Nhãn chữ và biểu tượng cộng truyền đạt hành động cả khi xem ở thang xám. Dùng lại menu để giữ tương tác bàn phím. Thiết kế không thêm đường chạy tool, dữ liệu ghi log hay luồng cấp quyền. Kiểm tra sau thiết kế cho kết quả tương tự.

## Project Structure

### Documentation (this feature)

`spec.md`, `research.md`, `data-model.md`, `contracts/workspace-session-launcher.md`, `quickstart.md` và `tasks.md`.

### Source Code (repository root)

- `src/components/layout/WorkspaceView.tsx` hiển thị một launcher tại vị trí phù hợp.
- `tests/unit/workspaceTerminal.test.tsx` kiểm thử mở launcher giữa màn hình, tạo session và đưa launcher về thanh tab.

## Complexity Tracking

Dùng dữ liệu, thành phần và luồng tạo session hiện có.
