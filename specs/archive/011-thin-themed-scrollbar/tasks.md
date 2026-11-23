---

description: "Task list for 011 thin themed scrollbar"
---

# Tasks: Thanh cuộn mảnh theo theme

**Input**: specs/011-thin-themed-scrollbar/ (plan.md, spec.md, research.md, data-model.md, quickstart.md)

**Tests**: một unit test đọc `globals.css` (SC-002, SC-003 đo được tự động).

## Phase 1: Setup

Không cần (không dependency, không cấu hình mới).

## Phase 2: Foundational

- [X] T001 Thêm token `--scrollbar-thumb: #909098` và `--scrollbar-thumb-hover: #71717a` vào `:root`; `--scrollbar-thumb: #63636b` và `--scrollbar-thumb-hover: #8b8b93` vào `.dark` trong src/styles/globals.css

## Phase 3: User Story 1 — Thanh cuộn mảnh, thống nhất toàn app (P1) 🎯 MVP

**Goal**: mọi vùng cuộn dùng cùng thanh cuộn mảnh 8px, không mũi tên.
**Independent Test**: cuộn sidebar, khung chat, khối code → cùng kiểu thanh mảnh; dải tab session vẫn ẩn thanh cuộn.

- [X] T002 [US1] Thêm quy tắc toàn cục trong `@layer base` của src/styles/globals.css: `::-webkit-scrollbar { width: 8px; height: 8px }`, track/corner `transparent`, `::-webkit-scrollbar-button { display: none }`, thumb `border: 2px solid transparent; background-clip: content-box; border-radius: 9999px; min-height: 24px; min-width: 24px`
- [X] T003 [US1] Thêm fallback `@supports not selector(::-webkit-scrollbar) { * { scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb) transparent } }` trong src/styles/globals.css
- [X] T004 [US1] Xác nhận src/components/layout/WorkspaceView.tsx dải tab vẫn có `[&::-webkit-scrollbar]:hidden` và `[scrollbar-width:none]` (không sửa)

## Phase 4: User Story 2 — Màu tương phản theo theme (P1)

**Goal**: thumb tương phản ≥ 3:1 với nền ở Light/Dark và vùng Log nền tối; đậm hơn khi hover/kéo.
**Independent Test**: Light → thumb xám đậm; ⌘⇧L → thumb xám sáng; Log nền tối ở Light vẫn thấy rõ.

- [X] T005 [US2] Thumb dùng `background-color: var(--scrollbar-thumb)`; `::-webkit-scrollbar-thumb:hover, ::-webkit-scrollbar-thumb:active` dùng `var(--scrollbar-thumb-hover)` trong src/styles/globals.css
- [X] T006 [US2] Thêm `.bg-term-bg { --scrollbar-thumb: #63636b; --scrollbar-thumb-hover: #8b8b93 }` trong src/styles/globals.css
- [X] T007 [P] [US2] Viết tests/unit/scrollbar.test.ts: đọc src/styles/globals.css, lấy token từ `:root`, `.dark`, `.bg-term-bg`; kiểm tra thumb và hover đạt tương phản WCAG ≥ 3:1 với `--background`, `--surface` (và `--term-bg` cho Log); kiểm tra `::-webkit-scrollbar` có width/height ≤ 8px

## Phase 5: Polish

- [X] T008 [P] Thêm dòng "Thanh cuộn: mảnh (8px), không mũi tên, màu xám tương phản theo theme" vào §3.2 specs/business-requirement/BR-001.md
- [X] T009 Chạy `pnpm test` và `pnpm typecheck`
- [X] T010 Kiểm tra bằng mắt theo specs/011-thin-themed-scrollbar/quickstart.md (`?mock` + Playwright, Light/Dark, panel Log)

## Dependencies

- T001 → T002–T006 (cùng file, làm tuần tự).
- T007 cần T001, T006 để pass; viết song song được.
- US1 và US2 cùng file CSS nhưng độc lập về hành vi; T008 độc lập.

## Parallel Example

- T007 (test) và T008 (tài liệu) chạy song song với T002–T006.

## Implementation Strategy

MVP = T001–T004 (thanh mảnh, màu token mặc định). Sau đó T005–T007 cho tương phản theo theme, cuối cùng Polish.
