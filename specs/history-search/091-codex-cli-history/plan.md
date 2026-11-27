# Implementation Plan — Phiên Codex CLI trong History

**Branch** — master (nhánh hiện tại)  
**Date** — 2026-11-27  
**Spec** — [spec.md](spec.md)

## Summary

Thêm danh sách và bản xem chỉ đọc cho phiên Codex CLI trong History. Sử dụng đường thăm dò Codex hiện có và gộp theo định danh engine. Truy vấn tên và phần xem trước trên danh sách đã tải.

## Technical Context

- TypeScript/React, Rust/Tauri và Node.js hiện có.
- Dùng Codex app-server qua cơ chế thăm dò metadata của hc, TanStack Query và Dialog của Herdsman.
- Đọc thông tin workspace và phiên liên kết từ SQLite. Dữ liệu lịch sử CLI do Codex cung cấp. Bản xem nằm trong bộ nhớ.
- macOS và Linux theo phạm vi hiện có của Herdsman. Giới hạn trang metadata theo giao thức Codex. Danh sách không gọi Codex cho mỗi phím. Bản xem dài render theo vùng cuộn.
- Kiểm thử với Vitest, Rust, hợp đồng sidecar và giao thức do Codex cài cục bộ sinh ra.

## Constitution Check

| Nguyên tắc | Thiết kế |
| --- | --- |
| I. Vòng đời | Thăm dò chỉ đọc qua hc. Đóng app giữa lúc xem kết thúc yêu cầu đọc và phiên CLI vẫn tiếp tục. |
| II. Dữ liệu hội thoại | Transcript nguồn và event log của các phiên Herdsman được bảo toàn. |
| III. Quyền | Bản xem dùng yêu cầu đọc, giữ hành vi xác nhận quyền của các phiên Herdsman hiện có. |
| IV. Hiển thị | Dùng bộ render Markdown an toàn và chỉ render lời nhắn gần vùng xem. Dialog dùng token hiện có, nhãn tiếng Anh, nút Close và trạng thái bằng văn bản trong cả hai theme. |
| V. Tương thích engine | Tái sử dụng đường kết nối Codex app-server, xác nhận phiên từ danh sách của tài khoản trước khi đọc. |
| VI. Tổ chức | Phạm vi lấy từ workspace, vị trí đã liên kết và đường dẫn phiên CLI. Việc xem không tạo project hay workspace. |

Kiểm tra lại sau thiết kế. Tất cả cổng đạt và không có ngoại lệ.

## Project Structure

| Khu vực | Tệp |
| --- | --- |
| Codex metadata | `sidecar/src/engines/codex.mjs`, `sidecar/test/codex.contract.test.mjs` |
| Tauri | `src-tauri/src/commands/history.rs`, `src-tauri/src/lib.rs` |
| Giao diện | `src/components/history/HistoryPanel.tsx`, `src/components/history/CodexHistoryDialog.tsx`, `src/lib/api.ts`, `src/lib/types.ts`, `src/lib/devMock.ts` |
| Nghiệm thu | `tests/unit/historyPanel.test.tsx`, [quickstart](quickstart.md) |

Tài liệu kèm theo gồm [research](research.md), [data model](data-model.md) và [hợp đồng History](contracts/history.md).
