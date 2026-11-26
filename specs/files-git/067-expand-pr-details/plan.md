# Implementation Plan: Mở rộng trang chi tiết Pull Request

**Branch**: `master` | **Date**: 2026-11-26 | **Spec**: [067](spec.md)

## Summary

Mở rộng màn chi tiết PR hiện có bằng timeline, CI có thể mở rộng, review threads và mô tả Markdown. Tải dữ liệu chi tiết khi một PR được chọn. Giữ vòng cập nhật danh sách hiện tại và điều hướng của spec 066.

## Technical Context

- TypeScript, React, shadcn/ui, TanStack Query, Rust, Tauri và GitHub CLI hiện có.
- Chi tiết dùng cache trong phiên cho đúng repository, số PR và tài khoản. Không thêm lưu trữ.
- Mục tiêu desktop macOS và Linux. Kiểm thử Vitest, Rust và trình duyệt với dữ liệu mô phỏng.
- Chi tiết đã tải được giữ trong bộ nhớ 5 phút sau khi đóng. Khi đang mở, chi tiết tự cập nhật mỗi 5 giây. Dữ liệu ngoài quyền truy cập bị ẩn.

## Constitution Check

- **I–III** — Đóng app bỏ trạng thái đọc PR. Agent, log hội thoại và luồng quyền agent tiếp tục tuân thủ vòng đời hiện tại.
- **IV** — Tải theo nhu cầu, lỗi từng phần có thể đọc riêng, nội dung Markdown được lọc.
- **V–VI** — Tái sử dụng CLI, tài khoản, project và thư viện giao diện hiện có.
- **Giao diện** — Dùng chip theo vai trò màu và kiểm tra nhãn trong cả hai theme và ở thang xám. Dùng disclosure có bàn phím và nhãn tiếng Anh.

Thiết kế dưới đây đáp ứng các gate trên.

## Project Structure

- `src-tauri/src/pull_requests/detail.rs` — Đọc nội dung, review và tiến độ từng bước.
- `src/components/layout/PullRequestDetails.tsx` và `src/components/layout/PullRequestActivity.tsx` — Timeline và các phần chi tiết.
- `tests/unit/pullRequests.test.tsx` — Hành vi qua AppShell.
- `research.md`, `data-model.md`, `contracts/detail.md`, `quickstart.md` và `tasks.md` cùng thư mục.

## Complexity Tracking

Các nguồn dữ liệu được tách theo phần hiển thị để lỗi quyền Actions vẫn cho phép xem nội dung PR đã xác thực.
