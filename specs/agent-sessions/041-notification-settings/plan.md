# Implementation Plan: Cài đặt thông báo hoàn thành

**Branch** — `master` · **Date** — 2026-11-24 · **Spec** — [spec.md](spec.md)

## Summary

Mở rộng Settings bằng mục Notifications và lưu hai lựa chọn dùng chung trong bộ lưu cài đặt giao diện hiện có. Lấy lựa chọn ngay khi nhận kết quả lượt để quyết định gửi thông báo hệ điều hành và gắn âm báo.

## Technical Context

- React, TypeScript, Zustand persist và thành phần shadcn có sẵn.
- Native notification giữ quyền và cách hiển thị của hệ điều hành. Mục tiêu nghiệm thu desktop là macOS.
- Vitest kiểm tra giao diện, khôi phục từ cấu hình đã lưu và luồng thông báo. Thử trực quan trên theme sáng, tối và kiểm tra tiếng trên desktop.

## Constitution Check

1. Thoát và mở lại app khôi phục tùy chọn. Agent chạy độc lập trong runtime.
2. Cấu hình thuộc giao diện và dùng mặc định khi bản lưu cũ thiếu khóa. Event log và lịch sử không đổi.
3. Chỉ kiểm soát thông báo hoàn thành. Đèn tab, thông báo cần duyệt và lỗi dùng luồng hiện có.
4. Dùng dialog, Button và token theme chung, nhãn tiếng Anh và thao tác bàn phím native. Soát theme sáng và tối.
5. Không đổi adapter, giao thức sidecar hoặc runtime.
6. Hai tùy chọn áp dụng cấp ứng dụng cho Project, Workspace và Session theo mô hình hiện có.

## Project Structure

- `src/stores/useUiStore.ts` giữ tùy chọn.
- `src/components/settings/SettingsDialog.tsx` hiển thị mục Notifications.
- `src/lib/events.ts` áp dụng tùy chọn cho lượt hoàn thành.
- [Research](research.md), [Data model](data-model.md), [UI contract](contracts/notifications.md), [Quickstart](quickstart.md).
