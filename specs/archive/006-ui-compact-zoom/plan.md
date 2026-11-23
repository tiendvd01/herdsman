# Implementation Plan: Giao diện gọn hơn và zoom chữ / giao diện

**Branch**: `006-ui-compact-zoom` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-ui-compact-zoom/spec.md`

## Summary

Ba phần, chỉ đổi frontend và menu macOS:

1. **Gọn hơn**: thu nhỏ thang kích thước gốc trong `globals.css` (Tailwind v4 `@theme`: `--spacing` 0.25rem → 0.225rem, `--text-xs/sm/base…` nhỏ đi một nấc), chữ body 14px → 13px, và đổi các giá trị px viết cứng (`text-[14px]`, `h-[30px]`…) theo một bảng quy đổi. Giữ chữ ≥ 11px.
2. **Zoom giao diện**: một module `uiZoom.ts` giữ bậc zoom (80…150%), áp dụng bằng zoom gốc của webview (`getCurrentWebview().setZoom`) khi chạy trong Tauri, fallback CSS `zoom` trên `<html>` khi chạy trình duyệt (`?mock`). Phím ⌘= / ⌘+ / ⌘− / ⌘0 qua listener capture phase (giống `sidebarShortcuts.ts`) và mục Zoom In / Zoom Out / Actual Size thêm vào menu View của macOS (Rust, emit event về frontend). Chỉ báo mức zoom là toast nhỏ tự ẩn.
3. **Cỡ chữ nội dung**: biến CSS `--content-step` (px, −2…+4) đặt trên `<html>`; các vùng nội dung dùng utility `text-content` / `text-content-code` = `calc(base + var(--content-step))`. Phím ⌥⌘= / ⌥⌘− / ⌥⌘0.

Zoom và bước cỡ chữ lưu trong `useUiStore` (persist localStorage, version 2, clamp khi đọc). Áp dụng trước khi React render lần đầu để không nháy cỡ mặc định.

## Technical Context

**Language/Version**: TypeScript 5.8, Rust (Tauri 2)

**Primary Dependencies**: React 18, Zustand, Tailwind v4, `@tauri-apps/api` (webview `setZoom`, event `listen`) — không thêm dependency

**Storage**: `useUiStore` persist (`herdsman-ui`, localStorage) thêm `zoom`, `contentStep`; migrate v1 → v2

**Testing**: Vitest + Testing Library (hàm thuần: bậc zoom, clamp, khớp phím, migrate); Playwright trên `http://localhost:1420/?mock` để chụp màn hình sáng/tối ở 100% và các bậc zoom

**Target Platform**: macOS desktop (Tauri 2, WKWebView), sau đó Linux

**Project Type**: desktop-app

**Performance Goals**: đổi zoom/cỡ chữ cập nhật trong cùng frame với lần nhấn phím (SC-002)

**Constraints**: không nháy cỡ mặc định lúc mở app (SC-003); vùng hội thoại vẫn ≥ `MAIN_MIN` (spec 004); kéo sidebar vẫn đúng ở mọi bậc zoom; không chặn phím tắt của 007 (⌘B / ⌘R)

**Scale/Scope**: 2 module mới (`uiZoom.ts`, `zoomShortcuts.ts`), sửa `globals.css`, `useUiStore`, `main.tsx`, `AppShell`, `CommandDialog`, ~25 component có px cứng, `lib.rs` (menu) và capability; 1–2 file test

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Đánh giá |
|---|---|
| I. Agent sống độc lập với app | Đạt. Chỉ đổi hiển thị; tắt app giữa chừng không ảnh hưởng agent. Menu Rust chỉ emit event UI. |
| II. Không mất dữ liệu hội thoại | Đạt. Không đụng event log; đổi zoom không reload trang, không mất nội dung đang gõ (FR-015). |
| III. Developer nắm quyền kiểm soát | Không ảnh hưởng. Hộp duyệt quyền vẫn đọc được ở mọi bậc zoom (chữ ≥ 11px). |
| IV. Hiển thị giàu thông tin nhưng không chậm | Đạt, đúng mục tiêu: thấy nhiều nội dung hơn; Mermaid/chart co giãn theo zoom native, không phải render lại. |
| V. Tương thích hệ sinh thái | Không ảnh hưởng. |
| VI. Giữ đơn giản | Đạt. Không store mới (thêm 2 field vào `useUiStore`), không dependency mới. |

Không có vi phạm. **Re-check sau Phase 1**: giữ nguyên.

## Project Structure

### Documentation (this feature)

```text
specs/006-ui-compact-zoom/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui-zoom.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── styles/globals.css            # @theme thang gọn, --content-step, .text-content*
├── lib/uiZoom.ts                 # MỚI: bậc zoom, clamp, applyZoom/applyContentStep, chỉ báo
├── lib/zoomShortcuts.ts          # MỚI: khớp phím ⌘=/⌘−/⌘0, ⌥⌘=/⌥⌘−/⌥⌘0; nghe event menu
├── stores/useUiStore.ts          # + zoom, contentStep, setter; migrate v2
├── main.tsx                      # áp dụng zoom/cỡ chữ đã lưu trước render đầu
├── components/layout/AppShell.tsx        # cài shortcuts zoom
├── components/command/CommandDialog.tsx  # 6 lệnh zoom/cỡ chữ
├── components/conversation/*.tsx         # text-content / text-content-code
├── components/composer/Composer.tsx      # text-content
├── components/panels/RightPanel.tsx      # Files, Log dùng text-content-code
└── components/** (các px cứng)           # quy đổi theo research R3
src-tauri/
├── src/lib.rs                    # menu View: Zoom In/Out/Actual Size → emit "ui-zoom"
└── capabilities/default.json     # + core:webview:allow-set-webview-zoom
tests/
└── unit/uiZoom.test.ts           # bậc, clamp, khớp phím, migrate
```

**Structure Decision**: giữ cấu trúc frontend hiện có (`src/lib` cho logic thuần, `src/stores` cho state); thêm hai module nhỏ theo mẫu `sidebarShortcuts.ts` của spec 007.

## Rủi ro / phối hợp

- Spec `009-unified-spacing-scale` (session khác, làm song song) thống nhất bộ khoảng cách và bỏ các giá trị lẻ (3px, 15px…). Để tránh sửa chồng: spec này thu gọn khoảng cách **chỉ** qua token gốc `--spacing` trong `@theme`, còn trong component chỉ quy đổi px cứng của **cỡ chữ** (`text-[Npx]`) và chiều cao cố định cần cho FR-003; các px khoảng cách lẻ để 009 xử lý. Hai thay đổi cộng dồn được: 009 chọn bậc trong thang, 006 thu nhỏ đơn vị của thang.
- WKWebView: `setZoom` thay đổi viewport CSS (`innerWidth` chia theo zoom) nên `layoutWidths` (spec 004) tự đúng. Fallback CSS `zoom` ở chế độ trình duyệt chỉ dùng để xem trước; toạ độ chuột khi kéo sidebar ở chế độ đó được chia cho hệ số zoom.

## Complexity Tracking

Không có vi phạm cần giải trình.
