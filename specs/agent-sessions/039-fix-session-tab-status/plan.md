# Implementation Plan: Sửa đèn báo khi đóng tab Session

**Branch** — `master`  
**Date** — 2026-11-24  
**Spec** — [spec.md](spec.md)

**Propagated**: 2026-11-24 — Đồng bộ tín hiệu hoàn thành lượt và các bước nghiệm thu.

## Summary

Hiển thị trạng thái tạm thời khi tab Session đang đóng để sự kiện terminal kết thúc không làm đèn nháy xanh. Với lượt thành công, sidecar gửi trạng thái `idle` kèm `turn_complete` qua OSC 7501. Rust chuyển tiếp tín hiệu từ `hc`, kể cả khi trạng thái lưu vẫn là `idle`. Nếu `hc` bỏ qua `kind`, backend đọc các sự kiện mới nhất từ event log để xác định lượt cuối có thành công hay không. Tab dùng tín hiệu này để hiện `Done` cho một lượt, còn Session vẫn nhận được prompt mới.

## Technical Context

- TypeScript, React 18, TanStack Query, Zustand và các thành phần giao diện sẵn có của app desktop Herdsman.
- Vitest, Testing Library và jsdom cho kiểm thử luồng giao diện bằng phản hồi bất đồng bộ có kiểm soát.
- Sidecar Node.js, backend Rust và kênh trạng thái `hc` hiện có. Kiểm thử hợp đồng sidecar, smoke test Claude và test tích hợp qua `hc` bao phủ tín hiệu hoàn thành.

## Constitution Check

- **I** — Agent tiếp tục chạy nếu app thoát. Khi kết nối lại, app kết hợp snapshot từ `hc` với event log để khôi phục tín hiệu hoàn thành hiện tại.
- **II** — Giữ event log append-only và schema hiện có. Dùng trường `kind` tùy chọn để bổ sung tín hiệu.
- **III** — Chỉ báo phân biệt lượt thành công, lỗi, bị ngắt và đang đóng. Thao tác duyệt quyền và điều khiển agent dùng luồng hiện có.
- **IV** — Dùng spinner và chấm trạng thái dùng chung, token theme và nhãn tiếng Anh. Nghiệm thu trực quan bao phủ cả theme sáng lẫn tối.
- **V** — Cả hai engine phát cùng tín hiệu chuẩn hóa qua `hc`. Tab dùng sự kiện trạng thái của ứng dụng.
- **VI** — Trạng thái tạm khi đóng gắn với ID Session trong WorkspacePane.

## Project Structure

- `src/components/layout/WorkspaceView.tsx` quản lý vòng đời hiển thị của tab đang đóng.
- `sidecar/src/index.mjs` và các adapter Claude/Echo phát tín hiệu hoàn thành. `src-tauri/src/agent.rs` chuyển tiếp từ `hc`.
- `tests/unit/lastSessionClose.test.tsx`, `sidecar/test/` và `src-tauri/tests/flow.rs` bao phủ giao diện, sidecar và tích hợp.
- [Research](research.md), [Data model](data-model.md), [UI contract](contracts/session-tab.md) và [Quickstart](quickstart.md).
