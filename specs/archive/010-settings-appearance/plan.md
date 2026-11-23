# Implementation Plan: Settings — Appearance

**Branch**: `010-settings-appearance` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

## Summary

Thêm nút Settings (bánh răng) vào footer sidebar cạnh trạng thái `hc`, mở `SettingsDialog` (Radix Dialog, có cột mục bên trái, hiện chỉ có **Appearance**). Appearance gồm: chọn Theme (System/Light/Dark, segmented), Interface font và Code font (danh sách preset, có Reset). Font áp dụng bằng cách ghi đè biến CSS `--font-sans` / `--font-mono` trên `<html>`; lựa chọn lưu trong `useUiStore` (persist, version 3). Bỏ `ThemeToggle` ở header; giữ ⌘⇧L và lệnh "Toggle theme"; thêm ⌘, và lệnh "Open settings".

## Technical Context

**Language/Version**: TypeScript 5, React 18 · Tailwind v4 (`@theme` tokens) · Zustand (persist)
**Primary Dependencies**: `@radix-ui/react-dialog` (đã có), lucide-react; không thêm dependency.
**Storage**: localStorage qua `zustand/persist` (key `herdsman-ui`), như theme hiện tại.
**Testing**: Vitest + Testing Library; kiểm UI bằng `?mock` + Playwright.
**Target Platform**: Tauri 2 / WebKit trên macOS.
**Performance Goals**: đổi font/theme < 200 ms (chỉ đổi biến CSS, không re-mount).
**Scope**: chỉ frontend; không đổi Rust, sidecar, socket hay event log.

## Constitution Check

- I (agent sống độc lập): chỉ là tuỳ chọn UI; tắt app giữa chừng không ảnh hưởng agent — PASS.
- II (không mất hội thoại): không đụng event log — PASS.
- III (kiểm soát agent): dialog Settings không chặn permission flow; đóng là thấy trạng thái — PASS.
- IV (hiển thị không chậm): đổi font = đổi một biến CSS; Mermaid/chart đọc font hiện tại khi render — PASS.
- V (tương thích): không liên quan — PASS.
- VI (giữ đơn giản): không store mới, mở rộng `useUiStore`; không dependency mới. Settings không phải khái niệm tổ chức — PASS.
- Tài liệu: cập nhật BR-001 §3.2 (theme đổi trong Settings) trong cùng thay đổi.

Post-design re-check: PASS.

## Complexity Tracking

| Thêm | Lý do | Phương án đơn giản hơn bị loại vì |
|------|-------|----------------------------------|
| Crate `core-text` (chỉ macOS) + lệnh `font_families` | liệt kê mọi font cài trên máy | WebKit không có API liệt kê font; preset cố định quá ít (phản hồi người dùng) |

## Design

- **Fonts** (`src/lib/fonts.ts`): `UI_FONTS`, `CODE_FONTS` — mảng `{ id, label, stack }`; mặc định `geist` / `geist-mono`. `fontStack(id, kind)` trả về stack, id lạ → mặc định. `isFontAvailable(family)` đo bằng canvas (so chiều rộng với fallback generic) để ẩn font không có trên máy; font đóng gói luôn có. Stack luôn kết thúc bằng Geist + generic để rơi về mặc định (FR-012).
- **Áp dụng** (`src/lib/theme.ts`): `useAppearanceEffect()` = theme effect cũ + `documentElement.style.setProperty('--font-sans' | '--font-mono', stack)`. Gọi chỗ đang gọi `useThemeEffect`.
- **Store**: `uiFont: string`, `codeFont: string`, `settingsOpen: boolean` (transient), `setUiFont`, `setCodeFont`, `setSettingsOpen`. Persist `uiFont`, `codeFont`; bump version 2 → 3 (migrate điền mặc định).
- **Mermaid/Chart**: thay chuỗi `'Geist, system-ui, sans-serif'` bằng `currentFontSans()` (đọc computed `--font-sans`); cache Mermaid khoá thêm theo font.
- **UI**:
  - `src/components/settings/SettingsDialog.tsx`: Dialog 80vw × 80vh; nav trái (Appearance), nội dung phải. Theme = 3 nút segmented (`role="radiogroup"`, icon Monitor/Sun/Moon). Font = `FontSelect` (Radix Popover hoặc `<select>` native? → dùng DropdownMenu radio đã có), mỗi mục render bằng chính font; nút Reset khi khác mặc định.
  - `Sidebar.tsx` `HcStatus`: thêm nút icon `Settings` (ghost, size-7) ở cuối hàng, tooltip "Settings ⌘,".
  - `WorkspaceView.tsx`: bỏ `ThemeToggle` ở `TopBar` và header workspace.
  - `CommandDialog.tsx`: ⌘, → `setSettingsOpen(true)`; thêm lệnh "Open settings".
- Dialog mount một lần ở `App` (cạnh `CommandDialog`).

## Project Structure

```text
src/lib/fonts.ts                          # mới: preset font, stack, phát hiện font
src/lib/theme.ts                          # áp dụng theme + font
src/stores/useUiStore.ts                  # uiFont, codeFont, settingsOpen; persist v2
src/components/settings/SettingsDialog.tsx# mới
src/components/layout/Sidebar.tsx         # nút Settings ở footer
src/components/layout/WorkspaceView.tsx   # bỏ ThemeToggle
src/components/command/CommandDialog.tsx  # ⌘, + "Open settings"
src/components/conversation/{Mermaid,Chart}.tsx # dùng font hiện tại
specs/business-requirement/BR-001.md      # §3.2 theme trong Settings
tests/unit/fonts.test.ts, settingsDialog.test.tsx # mới
```
