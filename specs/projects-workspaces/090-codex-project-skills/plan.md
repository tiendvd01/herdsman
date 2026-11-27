# Implementation Plan: Dùng skill trong project với Codex

**Branch**: `master` | **Date**: 2026-11-27 | **Spec**: [spec.md](spec.md)

## Summary

Dùng luồng gợi ý lệnh hiện có để liệt kê skill của workspace. Adapter Codex đăng ký từng thư mục skill hợp lệ trong `.claude/skills` trên App Server riêng của session. Lời gọi trực tiếp hoặc từ menu gửi tham chiếu đến định nghĩa gốc.

## Technical Context

- **Runtime** — Node.js 20+ sidecar, Codex App Server 0.172.0, Tauri, React và TypeScript.
- **Storage** — Các tệp skill trong workspace. Session giữ tên đã gợi ý trong bộ nhớ để báo khi tệp biến mất.
- **Testing** — Contract test qua socket sidecar, test Composer và smoke test App Server.
- **Platform** — Desktop macOS. Dùng API filesystem của Node hỗ trợ cả đường dẫn worktree và symlink.
- **Scope** — Khám phá và gọi skill local, giữ đường gửi prompt, đính kèm và duyệt quyền hiện có. Danh sách cập nhật từ đĩa khi yêu cầu.

## Constitution Check

Kiểm tra trước nghiên cứu và sau thiết kế đều đạt.

1. Agent tiếp tục chạy dưới Herdr Core khi Herdsman đóng. Reconnect dùng cùng adapter và cùng workspace.
2. Event log vẫn ghi lời nhắn gốc theo cơ chế hiện tại. Lịch sử Codex được đọc theo luồng hiện có.
3. Lượt gọi skill đi qua chính sách quyền của session và cùng đường yêu cầu duyệt.
4. Gợi ý dùng Composer hiện tại và các token hiện có trong cả theme sáng và tối. Lỗi báo bằng tiếng Anh.
5. Codex App Server vẫn điều phối lượt. Adapter tái sử dụng bảng lệnh và định dạng sự kiện của engine.
6. Phạm vi skill theo thư mục làm việc của session trong workspace. Dùng metadata từ Codex và đường dẫn workspace đã kiểm tra.

## Project Structure

- `sidecar/src/engines/codex.mjs` — Tích hợp khám phá, liệt kê và gọi skill.
- `sidecar/src/engines/codex-skills.mjs` — Đọc và kiểm tra skill trong workspace.
- `sidecar/test/codex.contract.test.mjs` — Kiểm thử qua socket và App Server fixture.
- `src/components/composer/Composer.tsx` — Menu chọn và gửi skill qua đường hiện tại.
- `tests/unit/composerExpand.test.tsx` — Kiểm tra thao tác chọn và gõ lời gọi.

## Design Artifacts

[Research](research.md), [data model](data-model.md), [contract](contracts/codex-skills.md) và [quickstart](quickstart.md).
