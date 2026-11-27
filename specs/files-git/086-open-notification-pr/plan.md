# Implementation Plan — Mở chi tiết PR từ thông báo

## Summary

Dùng màn chi tiết hiện có cho mọi thông báo PR. Với PR ngoài danh sách, dùng tiêu đề thông báo trong lúc tải thông tin hiện hành qua lệnh chi tiết.

## Technical Context

React, TypeScript và TanStack Query ở frontend. Tauri và Rust lấy dữ liệu qua GitHub CLI đã xác thực. Vitest kiểm tra luồng UI và Cargo kiểm tra phản hồi lệnh. Phạm vi gồm module Pull Requests trên desktop.

## Constitution Check

- I. Đóng app giữa lúc tải chỉ kết thúc lượt xem. Agent và terminal tiếp tục chạy.
- II. Luồng này không chạm transcript hay event log.
- III. Lệnh chi tiết chỉ đọc với xác minh tài khoản hiện hành. Quyền agent độc lập với luồng này.
- IV. Dùng trạng thái tải và lỗi hiện có trong màn chi tiết. Dữ liệu mô tả đi qua renderer hiện có.
- V. Tích hợp engine và giao thức terminal nằm ngoài phạm vi.
- VI. Dùng project đích và quy tắc chọn project hiện có.
- Giao diện dùng nút và token theme hiện có ở cả hai theme. Trạng thái PR có nhãn rõ ràng bên cạnh điểm nhấn màu. UI copy bằng tiếng Anh.
- Kiểm tra sau thiết kế đạt cả sáu nguyên tắc.

## Project Structure

- `src/components/layout/PullRequests.tsx` quản lý đích mở và trạng thái đã đọc.
- `src/components/layout/PullRequestDetails.tsx` và `PullRequestActivity.tsx` cung cấp màn chi tiết và truy vấn.
- `src-tauri/src/pull_requests/detail.rs` lấy metadata.
- `tests/unit/pullRequests.test.tsx` kiểm tra điều hướng và lệnh Tauri.

## Complexity Tracking

Dùng truy vấn chi tiết hiện tại và lấy metadata từ phản hồi GitHub mà truy vấn này đã tải.
