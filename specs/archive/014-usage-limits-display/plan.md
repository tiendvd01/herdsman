# Implementation Plan: Hiển thị % context và giới hạn 5h / tuần

**Branch**: `014-usage-limits-display` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-usage-limits-display/spec.md`

## Summary

Sau mỗi lượt agent trả lời, sidecar hỏi Claude Agent SDK lấy % context của session và mức dùng hạn mức 5h/tuần, rồi phát một event `usage_snapshot` vào event log. UI lưu % context theo từng session, hạn mức dùng chung toàn app, và hiển thị ba chỉ số văn bản (không progress bar) ở thanh công cụ của composer. Thay chỉ số `ctx` tổng token hiện có ở header (không phải % và dễ gây hiểu nhầm).

## Technical Context

**Language/Version**: TypeScript 5.8 / React 18 / Tailwind v4 (UI); Node ESM (sidecar)

**Primary Dependencies**: `@anthropic-ai/claude-agent-sdk` 0.3.329 (đã có), Zustand. Không thêm dependency.

**Storage**: event log của session (đã có). Không thêm nơi lưu mới.

**Testing**: Vitest + Testing Library; kiểm UI bằng `?mock` + Playwright

**Target Platform**: macOS desktop (Tauri 2)

**Project Type**: desktop-app (UI + sidecar)

**Performance Goals**: không chặn luồng trả lời; việc lấy số liệu chạy sau `turn_end`, lỗi thì bỏ qua

**Constraints**: thanh công cụ composer không vỡ ở cửa sổ 960×600; text nhỏ gọn; engine không có dữ liệu thì không phát event

**Scale/Scope**: sửa `sidecar/src/engines/claude.mjs`, `src/lib/types.ts`, `useSessionStore.ts`, `Composer.tsx`, `WorkspaceView.tsx` (bỏ `ctx`), `devMock.ts`; thêm `UsageIndicators.tsx` và hàm thuần `usageFormat.ts`; thêm test

## Constitution Check

| Nguyên tắc | Đánh giá |
|---|---|
| I. Agent sống độc lập | Đạt. Số liệu lấy trong sidecar sau mỗi lượt; app tắt không ảnh hưởng agent. |
| II. Không mất dữ liệu hội thoại | Đạt. Chỉ thêm loại event mới, tương thích ngược (UI cũ bỏ qua type lạ). Không sửa transcript gốc. |
| III. Nắm quyền kiểm soát | Đạt. Chỉ hiển thị, không tự chặn hay nén. |
| IV. Hiển thị không chậm | Đạt. Một event nhỏ mỗi lượt; chỉ chỉ báo re-render. |
| V. Tương thích hệ sinh thái | Đạt. Dùng SDK, không gọi API trực tiếp; UI chỉ dùng event chuẩn hoá, engine khác không phát thì ẩn. |
| VI. Giữ đơn giản | Đạt. Một event, một component, không khái niệm tổ chức mới. |

Re-check sau thiết kế: PASS.

## Design

- **Sidecar** (`claude.mjs`): sau khi emit `turn_end`, gọi không chặn `q.getContextUsage({detail:'summary'})` lấy `percentage`, và `q.usage_EXPERIMENTAL…({skipBehaviors:true})` lấy `rate_limits.five_hour/seven_day` + `rate_limits_available`. Gộp thành một event `usage_snapshot`. Mọi lỗi bị nuốt (không emit). Hàm usage là API thử nghiệm nên bọc try/catch; dự phòng bằng message `rate_limit_event` (có `rateLimitType`, `utilization`, `resetsAt`) để cập nhật cửa sổ tương ứng khi API trên lỗi.
- **Event**: `usage_snapshot { context_pct: number|null, limits: { five_hour?: {pct, resets_at}, seven_day?: {pct, resets_at} } | null }`. Ghi log (nhỏ, một lần mỗi lượt) để mở lại app vẫn có số gần nhất.
- **Store**: `SessionView.ctxPct` (theo session) và `limits` toàn cục `{ five_hour, seven_day, updatedAt }`, lấy snapshot mới nhất của mọi session. Bỏ `ctxTokens`.
- **UI**: `UsageIndicators` trong thanh công cụ composer (bên trái nút gửi). Ba chỉ số chữ `ctx 42%` · `5h 30%` · `7d 12%`, font mono nhỏ, màu theo ngưỡng (<80 muted, ≥80 cảnh báo, ≥95 nguy hiểm). Rê chuột (`title`/tooltip) cho thời điểm đặt lại. Thiếu dữ liệu: context hiện `—`; hạn mức ẩn. Hạn mức quá `resets_at` mà chưa có số mới thì hiện `—` thay vì số cũ. Giá trị hạn mức cũ hơn 15 phút kèm dấu `~` (có thể đã cũ).
- **Hàm thuần** `usageFormat.ts`: `levelOf(pct)`, `formatPct(n)` (làm tròn, kẹp 0–100), `formatReset(iso, now)`, `isStale(...)`.
- **Header**: bỏ `ctx {tokens}` tại `WorkspaceView.tsx`.

## Project Structure

### Documentation

```text
specs/014-usage-limits-display/
├── plan.md  research.md  data-model.md  quickstart.md
├── contracts/usage-snapshot.md
└── tasks.md   # /speckit-tasks
```

### Source Code

```text
sidecar/src/engines/claude.mjs        # lấy số liệu sau turn_end, emit usage_snapshot
src/lib/types.ts                      # AgentEvent: usage_snapshot
src/stores/useSessionStore.ts         # ctxPct, limits
src/components/composer/UsageIndicators.tsx   # mới
src/components/composer/Composer.tsx  # gắn chỉ báo
src/components/layout/WorkspaceView.tsx       # bỏ ctx
src/lib/usageFormat.ts                # mới, hàm thuần
src/lib/devMock.ts                    # dữ liệu mẫu cho ?mock
tests/                                # usageFormat, store, component
```

**Structure Decision**: giữ cấu trúc hiện có; thêm đúng hai file mới ở frontend.
