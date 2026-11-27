# Implementation Plan — Khởi tạo CodeGraph theo project

## Summary

Thêm hộp thoại CodeGraph Index từ Project options. Đọc trạng thái CLI, chuẩn bị Git exclude và khởi chạy lệnh indexing trong terminal nền của herdr-core.

## Technical Context

React, TanStack Query và dialog sẵn có. Tauri định danh project qua kho project hiện có. Dùng CodeGraph CLI đã cài và Git CLI trong checkout; không thêm dependency hoặc migration.

## Constitution Check

- I. Lượt indexing chạy trong terminal hc độc lập. Mở lại đọc terminal hiện hành và index trên đĩa.
- II–III. Không đụng transcript, event log hay quyền agent. Chỉ action người dùng mới kích hoạt ghi và lập chỉ mục.
- IV. Truy vấn bất đồng bộ và polling khi đang chạy. Hộp thoại dùng theme token, trạng thái có nhãn tiếng Anh.
- V–VI. Dùng tích hợp hc và project hiện tại. Không thêm engine hay tầng tổ chức.
- Sau thiết kế, sáu nguyên tắc đều đạt.

## Project Structure

- `src-tauri/src/project_codegraph.rs` kiểm tra checkout, cập nhật exclude và quản lý lệnh.
- `src/lib/api.ts` và `src-tauri/src/lib.rs` đăng ký giao diện.
- `src/components/project/ProjectCodegraphDialog.tsx` và Sidebar cung cấp điểm vào và trạng thái.
- `tests/unit/projectCodegraph.test.tsx` kiểm tra luồng UI, cùng test Rust tích hợp Git.

## Complexity Tracking

Dùng nhãn terminal theo thư mục chuẩn hóa để tránh lưu trạng thái chạy riêng. Mutex chỉ bảo vệ bước kiểm tra và khởi chạy, không chờ indexing kết thúc.
