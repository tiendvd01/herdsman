# Implementation Plan — Đóng workspace khi đóng session cuối

**Branch** `master` | **Date** 2026-11-26 | [Đặc tả](spec.md)

## Summary

Đóng màn hình workspace sau khi đóng session thành công và xác nhận hàng tab đã trống. Giữ luồng xác nhận, xử lý lỗi và điều hướng tab hiện có.

## Technical Context

Ứng dụng desktop Tauri với React, TypeScript, TanStack Query và Zustand. Kiểm thử qua Vitest và Testing Library. Phạm vi gồm hàng tab workspace và tác vụ đóng session. Quyết định điều hướng diễn ra ngay sau khi đóng thành công, dùng trạng thái hiện tại của hàng tab.

## Constitution Check

I–III. Tái sử dụng thao tác dừng session đã có, giữ cảnh báo với agent đang chạy hoặc chờ duyệt. Lịch sử, dữ liệu và vòng đời agent khi app thoát tiếp tục theo quy tắc hiện hành.

IV–V. Thay đổi chỉ chạm đến điều hướng và nội dung hộp thoại. Giao diện hội thoại và tích hợp engine dùng luồng hiện hành.

VI. Dùng lựa chọn workspace của project và thứ tự tab hiện hành. Hộp thoại giữ component, token và cách hiển thị theo theme sáng/tối hiện có. Nội dung giao diện dùng tiếng Anh.

Thiết kế sau Phase 1 đáp ứng các nguyên tắc trên.

## Project Structure

- `src/components/layout/WorkspaceView.tsx` xử lý xác nhận, đóng session và chọn màn hình sau khi đóng.
- `tests/unit/lastSessionClose.test.tsx` bao phủ nút đóng, phím tắt và các tình huống hồi quy.
- [Nghiên cứu](research.md), [mô hình trạng thái](data-model.md), [hành vi giao diện](contracts/close-session.md) và [xác minh](quickstart.md) mô tả thiết kế.
