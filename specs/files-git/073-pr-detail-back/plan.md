# Implementation Plan: Quay lại danh sách từ chi tiết PR

**Branch**: `master` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Summary

Đưa nút `Back to list` vào thanh cố định trên vùng cuộn. Dùng lại thao tác đóng chi tiết và cơ chế khôi phục ngữ cảnh hiện có.

## Technical Context

- React, TypeScript, Tabs và Button hiện có trong app desktop Tauri trên macOS.
- Dùng cùng trạng thái điều hướng trong bộ nhớ. Chuyển màn ngay khi kích hoạt nút, độc lập với truy vấn chi tiết.
- Vitest và Testing Library kiểm tra vị trí của nút ngoài vùng cuộn, điều hướng, cuộn và focus.

## Constitution Check

Đạt trước và sau khi thiết kế. Thay đổi giới hạn trong giao diện PR, độc lập với vòng đời agent, hội thoại, quyền, engine và cấu trúc project → workspace → session. Đóng app giữa chừng không ảnh hưởng agent. Dùng Button có nhãn tiếng Anh, chỉ báo focus và token theme hiện có. Nền và đường viền dùng cùng token với vùng tab. Quickstart kiểm tra khả năng nhận diện và focus trong theme sáng và tối.

## Project Structure

- `src/components/layout/PullRequests.tsx` sở hữu vùng cuộn và điều hướng.
- `src/components/layout/PullRequestDetails.tsx` trình bày nội dung và hành động mở GitHub.
- `tests/unit/pullRequests.test.tsx` kiểm tra luồng người dùng.
- [Research](research.md), [data model](data-model.md), [UI contract](contracts/pr-back.md) và [quickstart](quickstart.md) ghi lại thiết kế và cách xác minh.
