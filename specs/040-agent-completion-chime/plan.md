# Implementation Plan: Tiếng báo khi agent hoàn thành

**Branch** — `master` · **Date** — 2026-11-24 · **Spec** — [spec.md](spec.md)

## Summary

Dùng sự kiện hoàn thành lượt đã được sidecar ghi nhận để gửi thông báo hệ điều hành kèm tiếng báo. Giữ trạng thái terminal riêng để thao tác đóng Session không phát âm hoàn thành.

## Technical Context

- Rust đọc bản ghi `turn_end` mới nhất từ event log trong luồng `hc` hiện có.
- TypeScript kiểm tra thời điểm và số thứ tự của lượt trước khi dùng plugin thông báo desktop sẵn có. Trên macOS dùng âm hệ thống **Tink** dài khoảng 0,56 giây.
- Vitest kiểm tra quyền, chống trùng và focus. Rust kiểm tra nhận diện lượt thành công từ log và chuyển tiếp qua `hc`. Desktop macOS là nền tảng nghiệm thu âm thanh.

## Constitution Check

1. Agent tiếp tục làm việc khi app thoát. App khôi phục trạng thái khi mở lại và bỏ qua tiếng báo từ lượt cũ.
2. Event log chỉ được đọc. Số thứ tự hiện có tiếp tục là định danh lượt trong Session.
3. Yêu cầu duyệt, thao tác ngắt và báo lỗi giữ luồng trạng thái hiện hành. Không lấy terminal thoát làm tín hiệu thành công.
4. Dùng thông báo hệ điều hành và nhãn tiếng Anh hiện có. Không thêm widget phải kiểm tra theme.
5. Cả hai adapter dùng cùng kết quả lượt chuẩn hóa. Không đổi giao thức socket, phiên bản SDK hoặc lệnh `hc`.
6. Dùng ID Session và trạng thái hiện có. Không thêm khái niệm tổ chức.

## Project Structure

- `src-tauri/src/agent.rs` chuyển tiếp định danh, thời điểm và tên Session của lượt thành công.
- `src/lib/events.ts` lọc thông báo cũ hoặc trùng và gửi thông báo có âm thanh.
- `src-tauri/tests/flow.rs` và `tests/unit/completionNotification.test.tsx` xác minh hợp đồng.
- [Research](research.md), [Data model](data-model.md), [Contract](contracts/completion-notification.md), [Quickstart](quickstart.md).
