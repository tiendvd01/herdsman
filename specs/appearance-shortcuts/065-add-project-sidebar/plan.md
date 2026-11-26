# Implementation Plan: Sidebar danh sách project cho Pull Requests và Skills

**Branch**: `master` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Summary

Đặt một sidebar chọn project giữa thanh điều hướng dọc và vùng nội dung trong AppShell. Hai màn dùng cùng component hiển thị, mỗi màn giữ lựa chọn riêng.

## Technical Context

- **Language / dependencies**: TypeScript 5.8, React 18, TanStack Query và shadcn/ui hiện có.
- **Storage**: Lựa chọn trong bộ nhớ UI. Đọc thứ tự project hiện có để hiển thị.
- **Testing**: Vitest, React Testing Library, kiểm tra trình duyệt theo quickstart.
- **Target / scope**: Ứng dụng desktop Tauri trên macOS và Linux. Hai màn dùng dữ liệu project đã tải, thao tác chọn trực tiếp và danh sách cuộn.

## Constitution Check

- I–III: Thay đổi chỉ chọn phạm vi hiển thị trong UI. Đóng app hủy lựa chọn UI tạm thời. Tiến trình agent chạy độc lập, luồng sự kiện và quyền agent tiếp tục theo cơ chế hiện có.
- IV: Sidebar cuộn riêng, lựa chọn có focus và trạng thái hiện tại. Kiểm tra token màu trong theme sáng và tối.
- V: Gọi lại luồng dữ liệu Pull Requests và Skills hiện có.
- VI: Dùng project đã đăng ký và thứ tự Projects. Workspace đang làm việc độc lập với lựa chọn trong sidebar.
- Dùng Button chung, token theme và nhãn tiếng Anh. Gate đạt sau khi đối chiếu thiết kế.

## Project Structure

- `src/components/layout/AppShell.tsx` đặt sidebar cạnh NavigationRail và giữ lựa chọn Skills.
- `src/components/layout/ProjectPickerSidebar.tsx` hiển thị các mục và trạng thái project.
- `src/components/layout/PullRequests.tsx` và `src/components/settings/ProjectSkillsSection.tsx` hiển thị nội dung đã chọn.
- `src/lib/useNavigationOrder.ts` cung cấp cách đọc thứ tự đã lưu.
- `tests/unit/pullRequests.test.tsx` và `tests/unit/settingsView.test.tsx` kiểm tra điều hướng và phạm vi dữ liệu.

## Design Artifacts

[Research](research.md) · [Data model](data-model.md) · [UI contract](contracts/project-sidebar.md) · [Quickstart](quickstart.md)
