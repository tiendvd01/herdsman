# Implementation Plan: Thanh cuộn mảnh theo theme

**Branch**: `011-thin-themed-scrollbar` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

## Summary

Một quy tắc CSS toàn cục trong `src/styles/globals.css` cho mọi phần tử cuộn: thanh 8px (thumb 4px nhìn thấy nhờ viền trong suốt + `background-clip`), không mũi tên, track và góc trong suốt. Màu thumb lấy từ hai token mới `--scrollbar-thumb` / `--scrollbar-thumb-hover`, khai báo ở `:root` (Light) và `.dark` (Dark) nên đổi theo theme ngay. Vùng nền luôn tối (`bg-term-bg` — Log) ghi đè token sang bộ màu tối. Unit test đọc `globals.css`, kiểm tra token tồn tại và đạt tương phản ≥ 3:1 với nền.

## Technical Context

**Language/Version**: TypeScript 5, React 18 · Tailwind v4 (`@theme` tokens) · CSS thuần
**Primary Dependencies**: không thêm dependency.
**Storage**: không.
**Testing**: Vitest (đọc file CSS, tính tương phản WCAG); kiểm UI bằng `?mock` + Playwright.
**Target Platform**: Tauri 2 / WebKit (WKWebView) trên macOS; dev server có thể mở trên Chromium.
**Performance Goals**: đổi theme < 200 ms — chỉ là biến CSS, không JS.
**Scope**: chỉ frontend CSS; không đổi Rust, sidecar, socket hay event log.

## Constitution Check

- I (agent sống độc lập): thay đổi hiển thị thuần; app tắt giữa chừng không ảnh hưởng agent — PASS.
- II (không mất hội thoại): không đụng event log — PASS.
- III (kiểm soát agent): không đổi permission flow; thanh cuộn rõ hơn giúp thấy nội dung dài (diff, lệnh) — PASS.
- IV (hiển thị không chậm): CSS tĩnh, không listener cuộn — PASS.
- V (tương thích): không liên quan — PASS.
- VI (giữ đơn giản): một quy tắc toàn cục + 2 token, không component bọc mới — PASS.
- Tài liệu: thêm một dòng "Thanh cuộn" vào BR-001 §3.2 trong cùng thay đổi.

Post-design re-check: PASS (không có mục Complexity Tracking).

## Design

- **Token** (`:root` / `.dark` trong `globals.css`):
  - Light: `--scrollbar-thumb: #909098`, `--scrollbar-thumb-hover: #71717a`.
  - Dark: `--scrollbar-thumb: #63636b`, `--scrollbar-thumb-hover: #8b8b93`.
  - Lý do chọn màu: xem [research.md](research.md) — đạt ≥ 3:1 với `--background` và `--surface` ở cả hai theme.
- **Quy tắc** (trong `@layer base`):
  - `::-webkit-scrollbar { width: 8px; height: 8px; }`
  - `::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }`
  - `::-webkit-scrollbar-thumb { background-color: var(--scrollbar-thumb); border: 2px solid transparent; background-clip: content-box; border-radius: 9999px; min-height: 24px; }`
  - `:hover` / `:active` của thumb → `--scrollbar-thumb-hover`.
  - `::-webkit-scrollbar-button { display: none; }`
  - Trình duyệt không có `::-webkit-scrollbar` (Firefox): `@supports not selector(::-webkit-scrollbar)` → `* { scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb) transparent; }`. Không đặt `scrollbar-width`/`scrollbar-color` vô điều kiện vì Chromium ≥ 121 sẽ bỏ qua `::-webkit-scrollbar` khi có chúng.
- **Nền tối cố định**: `.bg-term-bg { --scrollbar-thumb: #63636b; --scrollbar-thumb-hover: #8b8b93; }` — biến kế thừa xuống thanh cuộn của chính phần tử đó.
- **Vùng ẩn thanh cuộn**: dải tab session dùng `[&::-webkit-scrollbar]:hidden` (`display:none`) có độ đặc hiệu cao hơn `::-webkit-scrollbar` toàn cục → vẫn ẩn. Không sửa.
- **Radix ScrollArea**: hiện không dùng trong `src/`; không cần xử lý.

## Project Structure

```text
src/styles/globals.css                 # token + quy tắc thanh cuộn
specs/business-requirement/BR-001.md   # §3.2 thêm dòng Thanh cuộn
tests/unit/scrollbar.test.ts           # mới: token có mặt, tương phản ≥ 3:1, quy tắc mảnh
```

## Complexity Tracking

Không có.
