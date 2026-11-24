# Implementation Plan — Chọn branch có sẵn cho workspace worktree

**Spec** — [spec.md](spec.md)

## Summary

Mở rộng New workspace để dùng một ô Branch để checkout branch local đã có hoặc tạo branch mới từ nhánh mặc định.

## Technical Context

React/TypeScript và các component hiện có. Tauri/Rust gọi Git qua helper hiện có. Dùng cột branch và base_branch hiện có, với base_branch rỗng cho checkout branch có sẵn. Kiểm thử bằng Vitest và Cargo.

## Constitution Check

- I — Tái sử dụng đường khởi tạo session hiện có. Việc tắt giao diện sau khi workspace được tạo vẫn để session chạy độc lập.
- II — Giữ nguyên cơ chế event log và transcript.
- III — Giữ nguyên luồng quyền của session.
- IV — Dùng truy vấn branch theo project và các điều khiển hiện có.
- V — Giữ nguyên engine và giao thức session.
- VI — Giữ một thư mục riêng cho mỗi workspace. Cập nhật giới hạn “branch mới” trong nguyên tắc VI và BR F11 theo yêu cầu tính năng.
- UI — Dùng điều khiển form chung với token semantic cho theme sáng và tối, nhãn tiếng Anh.

## Project Structure

- `src/components/workspace/CreateWorkspaceDialog.tsx` — nhập và gợi ý branch.
- `src/lib/api.ts`, `src/lib/devMock.ts` — hợp đồng và dữ liệu preview.
- `src-tauri/src/commands.rs`, `src-tauri/src/git.rs` — kiểm tra và tạo worktree.
- `tests/unit/` và test Rust trong `git.rs` — kiểm tra form và repository thật.

## Complexity Tracking

Tận dụng dữ liệu hiện có. Request thêm một biến thể để giữ tương thích với client gửi worktree dùng base branch.
