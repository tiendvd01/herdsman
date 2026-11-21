---
description: "Tasks for 014-usage-limits-display"
---

# Tasks: Hiển thị % context và giới hạn 5h / tuần

**Input**: `/specs/014-usage-limits-display/` (plan.md, spec.md, research.md, data-model.md, contracts/usage-snapshot.md, quickstart.md)

**Tests**: Vitest (theo quy ước dự án), đặt ở `tests/unit/`.

## Phase 1: Foundational

- [x] T001 [P] Tạo hàm thuần `levelOf`, `formatPct`, `formatReset`, `limitView` trong `src/lib/usageFormat.ts` (ngưỡng <80/≥80/≥95, làm tròn + kẹp 0–100, `null`→`—`, quá `resets_at`→`—`, cũ >15 phút→`~`)
- [x] T002 [P] Thêm event `usage_snapshot` (`context_pct`, `limits.five_hour|seven_day {pct, resets_at}`) vào union `AgentEvent` trong `src/lib/types.ts`

## Phase 2: User Story 1 - % context của session (P1)

**Test độc lập**: session có `usage_snapshot` → `ctxPct` đúng; session khác không đổi.

- [x] T003 [US1] Sidecar: sau `turn_end` trong `sidecar/src/engines/claude.mjs`, gọi `q.getContextUsage({detail:'summary'})` (không chặn, nuốt lỗi) và emit `usage_snapshot` với `context_pct`
- [x] T004 [US1] Store: thay `ctxTokens` bằng `ctxPct: number | null` (mặc định `null`) và xử lý `usage_snapshot` trong `src/stores/useSessionStore.ts`; cập nhật `tests/unit/sessionStore.test.ts` cho field mới
- [x] T005 [P] [US1] Tạo `src/components/composer/UsageIndicators.tsx` hiển thị `ctx N%` (chữ, không progress bar, mono nhỏ, màu theo `levelOf`, `aria-label`)
- [x] T006 [US1] Gắn `UsageIndicators` vào nhóm bên phải thanh công cụ trong `src/components/composer/Composer.tsx`; bỏ `ctx {tokens}` ở `src/components/layout/WorkspaceView.tsx`

## Phase 3: User Story 2 - Hạn mức 5h / tuần (P1)

**Test độc lập**: snapshot có `limits` → hiện `5h`, `7d`, tooltip thời điểm đặt lại; chuyển session giữ nguyên.

- [x] T007 [US2] Sidecar: lấy `usage_EXPERIMENTAL…({skipBehaviors:true})` → `limits` (null nếu `rate_limits_available=false`); dự phòng bằng message `rate_limit_event`; gộp vào cùng `usage_snapshot` trong `sidecar/src/engines/claude.mjs`
- [x] T008 [US2] Store: thêm `limits` toàn app, chỉ ghi đè khi snapshot mới hơn (`ts`) trong `src/stores/useSessionStore.ts`
- [x] T009 [US2] Mở rộng `UsageIndicators.tsx`: `5h NN%`, `7d N%`, tooltip "Đặt lại sau …", màu theo ngưỡng

## Phase 4: User Story 3 - Trạng thái không có dữ liệu (P2)

- [x] T010 [US3] `UsageIndicators.tsx`: `ctx —` khi `ctxPct=null`; ẩn hạn mức khi `limits=null`; `—` khi quá `resets_at`; `~` khi cũ (dùng `limitView`)

## Phase 5: Tests & Polish

- [x] T011 [P] Test `tests/unit/usageFormat.test.ts` (ngưỡng, làm tròn, kẹp, reset, stale)
- [x] T012 [P] Test `tests/unit/usageIndicators.test.tsx` (hiển thị, `—`, ẩn khi `limits=null`, màu, không có progressbar) và store (`limits` lấy bản mới nhất)
- [x] T013 [P] `src/lib/devMock.ts`: thêm `usage_snapshot` mẫu cho `?mock`
- [ ] T014 Chạy `pnpm test`, `pnpm tsc --noEmit`; kiểm UI `?mock` bằng Playwright theo `quickstart.md`

## Dependencies

T001, T002 → mọi task sau. US1 (T003–T006) → US2 (T007–T009) → US3 (T010) vì cùng sửa `UsageIndicators.tsx` và store. T011–T013 song song sau T010. MVP = US1.
