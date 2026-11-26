# Implementation Plan: Phân biệt loại thông báo PR

**Branch**: `master` | **Spec**: [spec.md](spec.md)

## Summary

Dùng cùng nhãn phân loại trong danh sách và toast. Ghi nhận review yêu cầu thay đổi bằng mô tả sự kiện cụ thể để phân biệt với review thông thường.

## Technical Context

Rust nhận diện sự kiện GitHub. React/TypeScript hiển thị badge và toast hiện có. Vitest và Rust xác nhận phân loại và tương thích dữ liệu.

## Constitution Check

Đạt trước và sau thiết kế. Thay đổi chỉ ảnh hưởng thông báo PR, độc lập với vòng đời agent, hội thoại, quyền, engine và tổ chức project. Đóng app giữa chừng không ảnh hưởng agent. Nhãn tiếng Anh, biểu tượng và token theme giúp nhận diện cả khi không thấy màu. Dữ liệu đã lưu vẫn đọc được.

## Project Structure

- `src-tauri/src/pull_requests.rs` ghi loại sự kiện nhận biết từ review.
- `src/components/layout/PullRequests.tsx` phân loại và hiển thị.
- `src/components/ui/toast.tsx` hỗ trợ badge tùy chọn trong toast.
- `tests/unit/pullRequests.test.tsx` kiểm tra phân loại và điều hướng.
