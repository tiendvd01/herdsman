# Implementation Plan: Mở tệp từ thẻ Read và Write

## Summary

Nối đường dẫn trên thẻ Read và Write với luồng mở tệp của Rich Conversation. Hiển thị liên kết và nút thu gọn thành hai điều khiển riêng.

## Technical Context

- **Language and stack** — TypeScript, React, Tauri.
- **Integration** — `MessageList` truyền callback mở tệp của session xuống `SessionToolCard` và `ToolCard`. `ToolCard` dùng giá trị gốc của `input.file_path` để mở tệp và dùng nhãn đã định dạng để hiển thị.
- **Validation** — Dùng `openSessionFile` để xác thực và đọc theo phạm vi session. Kiểm tra luồng chuyển sang Files và tái sử dụng tab ở tầng tích hợp.
- **Testing** — Vitest và React Testing Library, cùng kiểm tra giao diện desktop trong worktree.

## Constitution Check

Đạt trước và sau thiết kế. Thao tác mở tệp bắt đầu từ người dùng và chỉ tác động đến giao diện. Khi app đóng giữa thao tác, agent tiếp tục chạy và session được khôi phục qua luồng hiện có. Hội thoại tải lại từ event log. Dữ liệu tool chuẩn hóa và bộ kiểm tra đường dẫn theo session tiếp tục được dùng. Mỗi lượt bấm dùng một luồng đọc tệp hiện có.

## Project Structure

### Documentation (this feature)

- [Research](research.md)
- [Data model](data-model.md)
- [UI contract](contracts/tool-file-navigation.md)
- [Quickstart](quickstart.md)

### Source Code (repository root)

- `src/components/conversation/MessageList.tsx` — nối công cụ với hành động mở tệp của session.
- `src/components/conversation/ToolCard.tsx` — bố trí đường dẫn và điều khiển mở rộng.
- `tests/unit/` — kiểm thử thẻ và tích hợp điều hướng.

## Complexity Tracking

Tái sử dụng luồng mở tệp và xử lý lỗi của hội thoại.
