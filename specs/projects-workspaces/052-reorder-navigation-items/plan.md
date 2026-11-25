# Implementation Plan — Sắp xếp tab, workspace và project

**Branch** `master` | **Date** 2026-11-25 | **Spec** [spec.md](spec.md)

## Summary

Dùng chung thao tác sắp xếp trong React. Lưu thứ tự hiển thị riêng cho danh sách project, workspace của từng project và thanh tab của từng workspace.

## Technical Context

TypeScript, React 18, Tauri 2 WebView, Tailwind và các nút shadcn/ui hiện có. Dùng Pointer Events và phím bổ trợ trên nút hiện tại, ghi thứ tự vào localStorage. Vitest và Testing Library kiểm tra thứ tự, thao tác và khôi phục dữ liệu.

## Constitution Check

I–III. Việc sắp xếp chỉ cập nhật tùy chọn hiển thị. Không gọi lệnh runtime, ghi transcript hoặc thay đổi quyền. Nếu thoát lúc lưu, mỗi danh sách đọc lại một giá trị hoàn chỉnh. IV. Chỉ thay vị trí phần tử theo khóa ổn định, giữ nội dung đang mở. V. Không thay đổi tích hợp agent. VI. Phạm vi sắp xếp giữ cấu trúc project và workspace. Nhãn tiếng Anh, chỉ báo dùng token theme cho sáng và tối. Kiểm tra lại sau thiết kế đạt cả sáu nguyên tắc.

## Project Structure

- `src/lib/useNavigationOrder.ts` lưu thứ tự và xử lý tương tác.
- `src/components/layout/Sidebar.tsx` kết nối project và workspace.
- `src/components/layout/WorkspaceView.tsx` kết nối thanh tab và thứ tự điều hướng khi đóng.
- `tests/unit/navigationOrder.test.tsx` kiểm tra sắp xếp và khôi phục.

## Complexity Tracking

Một hook dùng chung cho ba điểm sử dụng. Không thêm dependency, migration hay trạng thái backend.
