# Implementation Plan: Icon engine thay chữ ở tab session

**Branch**: `008-session-engine-icon` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

## Summary

Thay `<span>{ENGINE_LABEL[s.engine]}</span>` ở hàng tab session (`WorkspaceView.tsx`) bằng component `EngineIcon`: SVG Claude/Codex chép từ herdr-app (`icons/claude.svg`, `icons/codex.svg`) và icon `Bot` của lucide-react (chính là `icons/agent.svg` của herdr-app) cho engine khác. Có tooltip + `aria-label` là tên engine.

## Technical Context

**Language/Version**: TypeScript 5, React 18 · **Build**: Vite (import SVG thành URL, như `herdsman-mark.svg`)
**Testing**: Vitest + Testing Library; kiểm UI bằng `?mock` + Playwright
**Scope**: chỉ frontend, không đổi sidecar / socket / event log.

## Constitution Check

- I (agent sống độc lập): không đụng tiến trình agent — PASS.
- II (không mất hội thoại): không đổi event log — PASS.
- III (kiểm soát agent): chấm trạng thái, badge bypass giữ nguyên — PASS.
- Giữ đơn giản: một component nhỏ, không thêm dependency — PASS.

## Design

- `src/assets/engines/claude.svg`, `codex.svg`: chép nguyên từ herdr-app (MIT, LobeHub). Bỏ `width/height="1em"` không cần vì set bằng class.
- `src/components/ui/engine-icon.tsx`: `EngineIcon({ engine, className })` → `<img>` cho claude/codex, `<Bot>` cho còn lại; bọc `Tooltip` với `ENGINE_LABEL`; `role="img"` + `aria-label`.
- `ENGINE_LABEL` giữ ở `WorkspaceView.tsx` (SessionView vẫn dùng làm chữ trong câu).
- Kích thước `size-3.5 shrink-0` cho khớp chữ 13px của tab.

## Project Structure

```text
src/assets/engines/{claude,codex}.svg   # mới
src/components/ui/engine-icon.tsx       # mới
src/components/layout/WorkspaceView.tsx # dùng EngineIcon thay chữ
tests/…/engine-icon.test.tsx            # mới
```
