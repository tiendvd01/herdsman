# Implementation Plan: Đồng bộ bố cục Pull Requests

## Summary

Dùng chung tiêu đề module cho Pull Requests, Skills và MCP. Căn lề phần cuộn và dùng kiểu tab, hàng danh sách trung tính.

## Technical Context

React và giao diện Tailwind hiện có. Kiểm thử luồng Pull Requests, MCP và Skills với Vitest.

## Constitution Check

Đạt trước và sau thiết kế. Thay đổi thuộc lớp hiển thị và giữ cơ chế quản lý project, dữ liệu và vận hành agent hiện có.

## Project Structure

- src/components/layout/AppShell.tsx và ModuleHeader.tsx
- src/components/layout/PullRequests.tsx và PullRequestDetails.tsx
- tests/unit/pullRequests.test.tsx

## Complexity Tracking

Dùng tiêu đề chung và các thành phần giao diện hiện có.
