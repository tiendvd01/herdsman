# Implementation Plan: Chế độ cây cho Git Changes

**Branch** — `master` | **Date** — 2026-11-24 | **Spec** — [spec.md](spec.md)

## Summary

Thêm nút Tree view trong Git Changes. Hai chế độ dùng cùng danh sách thay đổi và cùng thao tác mở diff. Tree nhóm file theo các thành phần của đường dẫn.

## Technical Context

Ứng dụng desktop hiện dùng React, TypeScript, TanStack Query, Zustand và shadcn/ui. Gom nhóm trên dữ liệu đã tải với chi phí tuyến tính theo tổng số thành phần đường dẫn. Chế độ xem thuộc UI store hiện có và chỉ sống trong lần chạy. Dùng Vitest và Testing Library để kiểm tra luồng từ Git tab.

## Constitution Check

Đạt trước và sau thiết kế. I–III và V: thao tác chỉ tác động giao diện, nên agent tiếp tục chạy nếu ứng dụng đóng. Hội thoại, quyền và tích hợp engine nằm ngoài luồng. IV: dùng dữ liệu đã có, Button và token hiện có cho theme sáng và tối. VI: mọi file và diff vẫn thuộc workspace đang chọn.

## Project Structure

- `src/components/panels/RightPanel.tsx` chứa nút đổi chế độ, các dòng hiển thị và thao tác mở diff.
- `src/stores/useUiStore.ts` giữ lựa chọn trong lần chạy.
- `tests/unit/gitFiles.test.tsx` kiểm tra Git tab qua giao diện.
- [Nghiên cứu](research.md), [mô hình dữ liệu](data-model.md), [hợp đồng giao diện](contracts/git-changes-tree.md) và [quickstart](quickstart.md) mô tả thiết kế và nghiệm thu.
