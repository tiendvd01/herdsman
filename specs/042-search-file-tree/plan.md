# Implementation Plan: Tìm file trong cây thư mục

**Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

## Summary

Thêm ô tìm kiếm vào bảng Files. Một lệnh đọc duyệt project theo quy tắc cây hiện tại. Giao diện dùng lại các hàng và cơ chế mở tab file hiện có.

Đường dẫn tuyệt đối mở theo yêu cầu xác nhận của người dùng. Lệnh riêng đọc file ngoài project với giới hạn định dạng và kích thước của trình xem hiện có. Luồng lưu vẫn giới hạn trong project.

## Technical Context

- Rust và Tauri cho truy cập hệ thống file. React, TypeScript, TanStack Query và danh sách ảo hiện có cho UI.
- macOS là nền tảng nghiệm thu. Không cần dependency hoặc migration mới.
- Mục tiêu p95 không quá 1 giây với 5.000 file. Xác thực bằng [quickstart](quickstart.md).

## Constitution Check

| Nguyên tắc | Thiết kế và kiểm tra sau thiết kế |
| --- | --- |
| I. Agent độc lập | Tìm kiếm chỉ đọc hệ thống file. Đóng ứng dụng kết thúc giao diện tìm kiếm và agent tiếp tục chạy. |
| II. Hội thoại | Không có thay đổi vào log hoặc transcript. |
| III. Quyền kiểm soát | Không gửi lệnh hay thay đổi quyền agent. |
| IV. Hiệu năng | Duyệt ngoài luồng giao diện, giảm tần suất gọi và giữ danh sách ảo. |
| V. Tương thích engine | Không thêm tích hợp engine hoặc Herdr. |
| VI. Tổ chức | Giữ root project mà Files đang dùng và trạng thái tìm kiếm cục bộ. |

Dùng Input, Button, Alert, Empty và Spinner hiện có, cùng token màu của ứng dụng cho theme sáng và tối. Nhãn UI dùng tiếng Anh.

## Project Structure

- `src-tauri/src/project_files.rs`, `commands.rs`, `lib.rs` triển khai và đăng ký lệnh đọc.
- `src/lib/api.ts` và `devMock.ts` cung cấp đường gọi thực và dữ liệu phát triển.
- `src/components/files/FileTree.tsx` quản lý truy vấn, trạng thái và hàng kết quả.

## Complexity Tracking

Lệnh tìm kiếm tránh phải gửi một yêu cầu qua Tauri cho từng thư mục. Dùng lại quy tắc duyệt và cơ chế mở file hiện hành.
