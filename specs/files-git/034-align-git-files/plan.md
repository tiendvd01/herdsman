# Implementation Plan: Đồng bộ giao diện Git với Files

**Branch** — `master` · **Date** — 2026-11-23 · **Spec** — [Đặc tả](spec.md)

## Summary

Đồng bộ cách trình bày Git và Files, đưa diff vào thanh tab chính.

## Technical Context

React, TypeScript, Zustand, TanStack Query và shadcn/ui hiện có. Tauri tiếp tục cung cấp dữ liệu Git theo workspace. Kiểm tra bằng Vitest, TypeScript và build.

## Constitution Check

Agent, phiên, transcript, quyền, runtime và cấu trúc Project → Workspace → Session không bị tác động. Diff chỉ đọc và trạng thái tab dùng bộ nhớ giao diện. Tắt app giải phóng các tab giống luồng Files hiện tại. Giao diện dùng tiếng Anh và token sáng/tối hiện có.

## Project Structure

### Documentation

[Khảo sát](research.md), [mô hình dữ liệu](data-model.md), [quy ước giao diện](contracts/git-files.md) và [cách kiểm tra](quickstart.md).

### Source Code

- `src/components/panels/RightPanel.tsx` hiển thị danh sách Git.
- `src/components/files/` chia sẻ cách hiển thị file và hiển thị diff.
- `src/components/layout/WorkspaceView.tsx` điều hướng các loại tab.
- `src/stores/useFileStore.ts` giữ định danh và trạng thái tab.
- `src-tauri/src/git.rs` trả diff cho đường dẫn Git chính xác.

Sau thiết kế, các điều kiện trên vẫn đạt. Không cần dependency hoặc lưu trữ mới.
