# Kế hoạch triển khai ghi nhớ model Claude

**Nhánh Git** — `master`  
**Ngày** — 2026-11-23  
**Đặc tả** — [spec.md](spec.md)

## Summary

Lưu lựa chọn Claude khi agent xác nhận thao tác đổi model. Chụp lựa chọn vào session bắt đầu hội thoại mới, truyền tới Claude trước prompt đầu tiên và giữ lịch sử riêng của từng session. Khi Claude báo lỗi model không tồn tại ở lượt đầu do model kế thừa, thử mặc định một lần nếu lượt đó chưa bắt đầu sinh nội dung hoặc gọi công cụ.

## Technical Context

- **Ứng dụng** — Rust/Tauri, SQLite và React/TypeScript hiện có. Sidecar Node chạy Claude Agent SDK qua `hc`.
- **Dữ liệu** — Bảng settings chứa lựa chọn Claude toàn app. Mỗi session lưu model của riêng nó. Metadata sidecar giữ lựa chọn trước khi agent bắt đầu lượt đầu.
- **Kiểm thử** — Cargo cho đường lưu và chọn snapshot, Node cho hợp đồng sidecar và khôi phục, Vitest cho hiển thị thông báo và model đang dùng.
- **Phạm vi** — Session Claude mới từ workspace mới, New Session hoặc `/clear`. Mở hội thoại cũ và Codex/Echo dùng hành vi hiện có.

## Constitution Check

| Nguyên tắc | Trước và sau thiết kế |
| --- | --- |
| I. Agent độc lập | Sidecar tiếp tục chạy qua `hc`. Khi app đóng, metadata, log và lựa chọn đã lưu vẫn truy cập được khi mở lại. |
| II. Lịch sử | Log vẫn append-only. Một lần gửi chỉ ghi một sự kiện người dùng. Các sự kiện mới bổ sung tương thích. |
| III. Quyền | Luồng duyệt quyền giữ nguyên. Chỉ thử lại lượt chưa có nội dung hay công cụ chạy. |
| IV. Giao diện | Dùng nhãn model và thông báo hội thoại hiện có. |
| V. Engine | Dùng Claude Agent SDK và socket hiện có. Kiểm thử hợp đồng bảo vệ các engine khác. |
| VI. Workspace | Lựa chọn dùng chung không thay đổi cấu trúc project, workspace hay session. |

## Project Structure

- `src-tauri/src/commands.rs`, `store.rs`, `agent.rs` xử lý xác nhận, tạo session, khởi động agent và lưu sự kiện.
- `sidecar/src/index.mjs` và `sidecar/src/engines/claude.mjs` giữ model ban đầu, nhận lỗi và thử model mặc định.
- `src/lib/types.ts`, `src/stores/useSessionStore.ts` hiển thị thông báo và model thật.
- [Nghiên cứu](research.md), [dữ liệu](data-model.md), [hợp đồng](contracts/model-preference.md), [nghiệm thu](quickstart.md).

## Complexity Tracking

Không có ngoại lệ constitution. Trạng thái thử lại chỉ tồn tại trong lượt đầu dùng model kế thừa để ngăn gửi trùng lượt hoặc chạy lại công cụ.
