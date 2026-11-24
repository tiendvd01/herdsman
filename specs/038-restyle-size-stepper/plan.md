# Implementation Plan — Đổi giao diện nút chỉnh cỡ chữ code

**Branch** `master` | **Date** 2026-11-24 | **Spec** [spec.md](spec.md)

## Summary

Đặt hai nút và giá trị hiện tại trong một khung chung, dùng lưới ba cột để số luôn nằm giữa.

## Technical Context

- React, TypeScript và Tailwind CSS trong ứng dụng desktop Tauri.
- Dùng Button và token màu shadcn/ui New York có sẵn. Giá trị và lưu trữ tiếp tục do UI store quản lý.
- Phạm vi gồm một điều khiển trong Settings. Phản hồi ngay sau mỗi lần kích hoạt nút.
- Kiểm tra bằng Vitest, TypeScript và các bước trong quickstart.

## Constitution Check

Đạt trước và sau thiết kế. I–III giữ nguyên tiến trình agent khi đóng app, lịch sử và quyền điều khiển. IV thay đổi bố cục của một hàng Settings, giữ nguyên đường hiển thị hội thoại. V giữ nguyên tích hợp engine và Herdr. VI giữ nguyên cấu trúc Project → Workspace → Session và dùng store có sẵn. Giao diện dùng Button chung, token theme sáng/tối và tên điều khiển bằng tiếng Anh.

## Project Structure

- [Research](research.md)
- [Data model](data-model.md)
- [UI contract](contracts/settings-stepper.md)
- [Quickstart](quickstart.md)
- [Tasks](tasks.md)

Mã thay đổi tại `src/components/settings/SettingsDialog.tsx`. Kiểm thử hồi quy tại `tests/unit/settingsDialog.test.tsx`.
