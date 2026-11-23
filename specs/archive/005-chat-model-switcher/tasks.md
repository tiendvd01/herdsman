---
description: "Task list: Đổi model ngay trong khung chat"
---

# Tasks: Đổi model ngay trong khung chat

**Input**: Design documents from `specs/005-chat-model-switcher/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/model-switch.md, quickstart.md

**Tests**: Có. Constitution bắt buộc contract test cho giao thức socket sidecar và test kịch bản app tắt giữa chừng khi chạm tới persistence/giao thức.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: chạy song song được (khác file, không phụ thuộc task chưa xong)
- **[Story]**: US1, US2, US3 theo spec.md

## Phase 1: Setup

- [X] T001 Tạo `src/lib/model.ts`: chuyển `formatModel` từ `src/components/layout/WorkspaceView.tsx` sang, export thêm `modelLabel(model: string | null | undefined, models?: ModelOption[]): string`. Hàm trả `displayName` khi `model` khớp `value` hoặc `resolved_model` của một mục; nếu không thì dùng `formatModel`; `null`/rỗng → "Default"; tên không nhận dạng được hiện nguyên văn (research R5).

## Phase 2: Foundational (chặn mọi user story)

- [X] T002 [P] Thêm kiểu vào `src/lib/types.ts`: `ModelOption = {value: string; display_name: string; description: string; resolved_model?: string}`, `ModelList = {models: ModelOption[]; current: string | null}`, nhánh `AgentEvent` `{type:'model_changed'; model: string; previous: string | null}`, và trường tuỳ chọn `model?: string` cho `turn_end`.
- [X] T003 [P] Contract test `sidecar/test/model.contract.test.mjs` cho 6 case trong `contracts/model-switch.md` (engine echo; dùng `startSidecar`/`Client` từ `sidecar/test/helpers.mjs`). Chạy lần đầu phải fail.
- [X] T004 [P] Engine echo `sidecar/src/engines/echo.mjs`: giữ biến `model` (khởi tạo `ctx.model || 'echo'`, báo qua `onEngineSession(sessionId, model)`), thêm `async listModels()` trả `[{value:'echo', display_name:'Echo', description:'Simulated replies'}, {value:'echo-fast', display_name:'Echo Fast', description:'Simulated replies, faster'}]`. `setModel(m)` gán `model = m`. Thêm dòng `| Model | ${model} |` vào bảng reply và trường `model` vào `turn_end`.
- [X] T005 [P] Engine Claude `sidecar/src/engines/claude.mjs`: thêm `async listModels()`. Nếu `!running` thì `start()` (query với input rỗng), cache kết quả `q.supportedModels()` rồi map sang `{value, display_name: displayName, description, resolved_model: resolvedModel}`. Ghi `msg.message.model` của assistant message cuối vào biến `lastTurnModel` và đưa vào `turn_end.model`.
- [X] T006 Sidecar `sidecar/src/index.mjs` (sau T004, T005): biến `currentModel` (khởi tạo từ `ctx.model`, cập nhật trong `onEngineSession`). Lệnh `list_models`: nếu engine không có `listModels` thì trả error `unsupported`; nếu có thì trả `{type:'models', models, current: currentModel ?? null}`. Lệnh `set_model`: `model` không phải string hoặc rỗng → error `bad_model`; trùng `currentModel` → ack và không ghi event; ngược lại `await engine.setModel` (lỗi → error code `engine`), `saveMeta({model})`, `emit('model_changed', {model, previous})`, cập nhật `currentModel`. Sau bước này T003 phải pass.
- [X] T007 Rust `src-tauri/src/commands.rs` + đăng ký trong `src-tauri/src/lib.rs`: `session_list_models(id) -> ModelList` (gọi `agent::command` với `{"cmd":"list_models"}`, đổi lỗi `unknown_command` thành `AppError::new("unsupported", "Restart this session to switch models")`); `session_set_model(id, model)` (string rỗng → `bad_model`; sau ack thì `store::session_set_field(.., "model", Some(&model))`).
- [X] T008 [P] `src-tauri/src/agent.rs` `run_view`: thêm nhánh `"model_changed"` (khi `fresh`) để `session_set_field(&db, sid, "model", Some(m))`.
- [X] T009 [P] `src/lib/api.ts`: `sessionListModels(id) => invoke<ModelList>('session_list_models', {id})`, `sessionSetModel(id, model) => invoke<void>('session_set_model', {id, model})`.

**Checkpoint**: `pnpm --dir sidecar test` và `cargo build` pass.

## Phase 3: User Story 1 - Đổi model cho session đang mở (P1) 🎯 MVP

**Goal**: Chọn model từ menu trong composer; nút và header đổi sau ack; lượt sau dùng model mới.

**Independent Test**: `?mock` hoặc session Echo: chọn model khác → nhãn đổi ≤ 1 s, gửi tin → reply ghi model mới.

- [X] T010 [P] [US1] Unit test `tests/unit/model.test.ts` cho `modelLabel`: id đầy đủ, khớp alias qua `resolved_model`, khớp `value`, null → "Default", chuỗi lạ → nguyên văn.
- [X] T011 [P] [US1] Unit test `tests/unit/sessionStore.test.ts`: `model_changed` đặt `v.model`, chèn notice "Switched model to …", phát lại cùng seq không chèn lần hai.
- [X] T012 [US1] `src/stores/useSessionStore.ts` `applyEvent`: nhánh `model_changed` → `v.model = ev.model` và đẩy `{kind:'notice', tone:'info', text:`Switched model to ${modelLabel(ev.model)}`}`.
- [X] T013 [US1] Component `src/components/composer/ModelSwitcher.tsx` (theo khuôn `ModeSwitcher.tsx`): props `{session, model, disabled}`. `useQuery(['models', session.id], api.sessionListModels, {enabled: open, staleTime: Infinity, retry: 1})`. Nút ghost size sm hiện `modelLabel(model, data?.models)` + ChevronDown, `aria-label="Model: …"`, rút gọn bằng `max-w-[160px] truncate`. Menu `side="top"` liệt kê `display_name` + `description` + Check ở mục khớp model hiện tại (nếu model hiện tại không có trong danh sách thì thêm một mục cho nó ở đầu). Có trạng thái loading, và trạng thái lỗi kèm nút Retry. Chọn trùng model thì không làm gì. Chọn model khác thì gọi `useMutation(api.sessionSetModel)`; trong lúc chờ hiện spinner và disable nút; xong thì invalidate `qk.sessions(session.workspace_id)`; lỗi thì `toast(errMsg(e), 'error')`, giữ model cũ. Lỗi `unsupported` → nút disable + Tooltip "Restart this session to switch models" (engine không hỗ trợ: "This engine can't switch models").
- [X] T014 [US1] `src/components/composer/Composer.tsx`: render `<ModelSwitcher>` ngay sau `<ModeSwitcher>`, truyền `model` từ `useSessionStore` view (`view?.model ?? session.model`) và `disabled` giống các điều khiển khác.
- [X] T015 [US1] `src/components/layout/WorkspaceView.tsx`: bỏ `formatModel` cục bộ, dùng `modelLabel(model, cachedModels)` với `cachedModels = qc.getQueryData(['models', active.id])?.models`.
- [X] T016 [P] [US1] `src/lib/devMock.ts`: mock `session_list_models` (Default/Opus 5.5/Sonnet 5.5/Haiku 5.5 với `value` `default`/`claude-opus-5-5`/`claude-sonnet-5-5`/`claude-haiku-5-5` kèm mô tả) và `session_set_model` (emit một event `model_changed` qua `session:events` với seq kế tiếp).
- [X] T017 [US1] Component test `tests/unit/modelSwitcher.test.tsx`: hiện tên model; mở menu thấy danh sách + dấu tích; chọn model khác thì gọi `sessionSetModel`; Esc đóng menu và không gọi; lỗi `unsupported` thì nút disabled.

**Checkpoint**: US1 dùng được độc lập (MVP).

## Phase 4: User Story 2 - Đổi model khi agent đang chạy (P2)

**Goal**: Đổi model lúc working/blocked mà không ngắt lượt hay mất yêu cầu quyền.

**Independent Test**: Echo `slow ...` → đổi model giữa chừng → lượt kết thúc `interrupted:false`, lượt sau ghi model mới.

- [X] T018 [US2] Trong `sidecar/test/model.contract.test.mjs`, thêm case: lượt `edit` của echo đang chờ quyền (blocked) thì `set_model` → ack; `permission_response allow` vẫn chạy tiếp và có `permission_resolved{decision:'allow'}`.
- [X] T019 [US2] `src/components/composer/ModelSwitcher.tsx`: đảm bảo nút không bị disable khi `status` là `working` hoặc `blocked` (chỉ disable khi session done/error/khởi động, đúng như `disabled` của composer); kiểm tra lại `Composer.tsx` không truyền `working` vào `disabled` của ModelSwitcher.

## Phase 5: User Story 3 - Model đã chọn được giữ lại (P3)

**Goal**: Model giữ nguyên qua chuyển session, tắt/mở app, resume.

**Independent Test**: Đổi model, kill sidecar, chạy lại → `session_started.model` là model đã chọn; DB `sessions.model` khớp sau khi phát lại log.

- [X] T020 [US3] `sidecar/src/index.mjs`: bảo đảm `ctx.model` ưu tiên `meta.model` khi resume (app không truyền `--model`); thêm comment giải thích. Case 5 của contract test phải pass.
- [X] T021 [P] [US3] Test Rust trong `src-tauri/tests/flow.rs` (hoặc unit test trong `agent.rs` nếu flow.rs không dựng được view): event `model_changed` có `seq > last_seen_seq` cập nhật `sessions.model`; event cũ (seq ≤ last_seen) thì không.
- [X] T022 [US3] `src/components/composer/ModelSwitcher.tsx`: query key theo `session.id` để chuyển session không lẫn danh sách; kiểm tra bằng tay trong `?mock` (2 session, đổi ở A, B giữ nguyên).

## Phase 6: Polish & Cross-Cutting

- [X] T023 [P] Cập nhật `specs/001-herdsman-use-cases/contracts/sidecar-socket.md` (lệnh `list_models`, `set_model` có event, event `model_changed`, `turn_end.model`) và `specs/001-herdsman-use-cases/contracts/tauri-commands.md` (2 lệnh mới).
- [X] T024 Chạy toàn bộ: `pnpm --dir sidecar test`, `pnpm test`, `pnpm typecheck`, `cargo test --manifest-path src-tauri/Cargo.toml`.
- [X] T025 Kiểm tra UI bằng Playwright theo `quickstart.md` mục `?mock` (screenshot menu mở và sau khi đổi model).

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → (US2, US3 song song được) → Polish.
- Trong Phase 2: T002, T003, T004, T005, T008, T009 song song; T006 sau T004 và T005; T007 sau T006 (theo contract).
- US1: T010, T011, T016 song song; T012 trước T013; T013 trước T014, T015, T017.
- US2 và US3 chỉ phụ thuộc Phase 2 + T013.

## Parallel Examples

- Phase 2: chạy cùng lúc T004 (echo), T005 (claude), T008 (agent.rs), T009 (api.ts), T002 (types).
- US1: chạy cùng lúc T010, T011, T016.

## Implementation Strategy

1. MVP: Phase 1 + 2 + US1, rồi kiểm tra bằng `?mock` và session Echo.
2. Thêm US2 (chủ yếu là test khẳng định hành vi), rồi US3 (persistence + test Rust).
3. Polish: cập nhật contract chung, chạy toàn bộ test, screenshot UI.
