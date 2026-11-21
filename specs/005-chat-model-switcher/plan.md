# Implementation Plan: Đổi model ngay trong khung chat

**Branch**: `005-chat-model-switcher` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-chat-model-switcher/spec.md`

## Summary

Thêm nút chọn model vào thanh công cụ của composer, đặt cạnh menu chế độ quyền. Danh sách model lấy từ engine qua lệnh socket mới `list_models` (Claude: `Query.supportedModels()` của Agent SDK; Echo: danh sách giả). Đổi model qua lệnh `set_model` đã có, được làm chặt hơn: ghi event `model_changed` vào log, lưu `meta.model` và `sessions.model`. UI chỉ hiện model mới sau khi agent ack. Header và composer dùng chung hàm `modelLabel`. Agent chạy từ bản app cũ trả `unknown_command`, nên nút bị vô hiệu kèm hướng dẫn khởi động lại session.

## Technical Context

**Language/Version**: TypeScript 5 (React 19 frontend), Rust 2021 (Tauri 2), Node ≥ 20 (sidecar ESM)

**Primary Dependencies**: `@anthropic-ai/claude-agent-sdk` 0.3.329 (`supportedModels`, `setModel`), Radix DropdownMenu (đã dùng trong ModeSwitcher), TanStack Query, Zustand

**Storage**: SQLite `sessions.model` (đã có), sidecar `meta.json` (đã có), event log NDJSON (+ event `model_changed`)

**Testing**: `node --test` (contract test sidecar), Vitest + Testing Library (UI), `cargo test`

**Target Platform**: macOS desktop (Tauri 2)

**Project Type**: desktop-app (frontend React + backend Rust + sidecar Node)

**Performance Goals**: nhãn model cập nhật ≤ 1 s sau khi chọn (SC-002); mở menu lần đầu ≤ 2 s với Claude (chờ bước initialize của query)

**Constraints**: không tăng PROTO; không ngắt lượt đang chạy; không cập nhật lạc quan

**Scale/Scope**: 1 lệnh socket mới, 2 lệnh Tauri mới, 1 event mới, 1 component mới, 1 helper

## Constitution Check

| Nguyên tắc | Đánh giá |
|---|---|
| I. Agent sống độc lập với app | ✅ Sidecar đổi model và ghi meta + log *trước* khi ack. App tắt giữa chừng thì agent vẫn dùng model mới, app mở lại khôi phục từ log (research R3). Agent cũ không bị ép khởi động lại (R4). |
| II. Không mất dữ liệu hội thoại | ✅ Event `model_changed` append-only, seq tiếp nối. Thêm trường tuỳ chọn `turn_end.model` là thay đổi tương thích ngược. Không đụng transcript gốc. |
| III. Developer nắm quyền kiểm soát | ✅ Đổi model không nới quyền; yêu cầu quyền đang chờ giữ nguyên (FR-005); không có đường tự cho phép nào mới. |
| IV. Hiển thị giàu thông tin nhưng không chậm | ✅ Chỉ thêm một notice item; tên/mô tả model từ engine render dạng text thuần (không HTML). |
| V. Tương thích hệ sinh thái | ✅ Danh sách và việc đổi model đi qua Agent SDK, không gọi model API. UI chỉ phụ thuộc `AgentEvent` + `ModelOption` chuẩn hoá. Session vẫn `claude --resume` được. |
| VI. Giữ đơn giản | ✅ Không thêm store, bảng hay tầng trừu tượng mới; tái dùng DropdownMenu và cách làm của ModeSwitcher. |

**Gate**: PASS (trước Phase 0 và sau Phase 1).

## Project Structure

### Documentation (this feature)

```text
specs/005-chat-model-switcher/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/model-switch.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
sidecar/
├── src/index.mjs                 # lệnh list_models, set_model chặt hơn, event model_changed
├── src/engines/claude.mjs        # listModels() qua supportedModels, turn_end.model
├── src/engines/echo.mjs          # model giả, listModels(), ghi model vào reply/turn_end
└── test/model.contract.test.mjs  # mới

src-tauri/src/
├── commands.rs                   # session_list_models, session_set_model
├── agent.rs                      # run_view: xử lý model_changed
└── lib.rs                        # đăng ký lệnh

src/
├── lib/model.ts                  # mới: modelLabel(), formatModel() chuyển từ WorkspaceView
├── lib/types.ts                  # ModelOption, ModelList, event model_changed, turn_end.model
├── lib/api.ts                    # sessionListModels, sessionSetModel
├── lib/devMock.ts                # mock 2 lệnh mới
├── stores/useSessionStore.ts     # applyEvent model_changed → model + notice
├── components/composer/ModelSwitcher.tsx  # mới
├── components/composer/Composer.tsx       # gắn ModelSwitcher
└── components/layout/WorkspaceView.tsx    # header dùng modelLabel

tests/unit/
├── model.test.ts                 # mới
├── modelSwitcher.test.tsx        # mới
└── sessionStore.test.ts          # thêm case model_changed

specs/001-herdsman-use-cases/contracts/sidecar-socket.md, tauri-commands.md  # cập nhật cho khớp
```

**Structure Decision**: Giữ cấu trúc ba phần hiện có (sidecar / src-tauri / src). Component mới nằm cạnh `ModeSwitcher` trong `src/components/composer/`.

## Complexity Tracking

Không có vi phạm.
