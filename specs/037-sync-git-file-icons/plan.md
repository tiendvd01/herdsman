# Implementation Plan: Đồng bộ icon file trong Git Changes

**Nhánh Git** — `master` · **Feature** — `037-sync-git-file-icons` · **Ngày** — 2026-11-24

## Summary

Git Changes dùng bộ chọn icon Material của File Tree với tên cuối đường dẫn. Dòng thay đổi tiếp tục dùng đường dẫn đầy đủ để mở diff và giữ ký hiệu trạng thái.

## Technical Context

React 18, TypeScript và Vite trong ứng dụng Tauri. Dùng SVG Material đóng gói sẵn cùng hàm nhận diện tên file hiện có. Kiểm tra bằng typecheck và Vitest. Phạm vi là một icon trang trí cho mỗi dòng Git Changes.

## Constitution Check

Đạt trước và sau thiết kế. I–III và V giữ nguyên luồng agent, dữ liệu hội thoại, quyền và tích hợp engine. IV dùng lookup và asset cục bộ hiện có. VI giữ phạm vi workspace của Git Changes. Giao diện tái sử dụng Button, token và kích thước icon hiện có. Không cần ngoại lệ.

## Project Structure

- `src/components/panels/RightPanel.tsx` áp dụng icon Material cho dòng Git Changes.
- `src/components/files/materialFileIcons.ts` cung cấp lookup hiện có. `src/components/files/fileRows.ts` bỏ bộ chọn icon cũ khi hết caller.
- `tests/unit/gitFiles.test.tsx` xác nhận icon và thao tác mở diff.
- Thiết kế chi tiết nằm trong [research](research.md), [data model](data-model.md), [UI contract](contracts/git-file-icons.md) và [quickstart](quickstart.md).
