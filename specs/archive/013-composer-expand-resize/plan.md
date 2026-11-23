# Implementation Plan: Resize ô chat ở chế độ mở rộng, mặc định 300px

**Branch**: `013-composer-expand-resize` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-composer-expand-resize/spec.md`

## Summary

Chế độ mở rộng của ô chat (spec 012) hiện cao cố định `65vh`. Đổi thành chiều cao `composerHeight` mặc định 300px, kéo đổi được bằng một tay nắm ngang ở cạnh trên ô chat. Tái dùng `ResizeHandle` của spec 004 (thêm trục ngang), lưu `composerHeight` trong `useUiStore` (persist), và tính chiều cao hiệu lực bằng hàm thuần kẹp theo chiều cao cửa sổ. Chỉ đổi frontend.

## Technical Context

**Language/Version**: TypeScript 5.8, React 18, Tailwind v4

**Primary Dependencies**: Zustand (persist) — không thêm dependency

**Storage**: localStorage qua `persist` của `useUiStore` (key `herdsman-ui`)

**Testing**: Vitest + Testing Library; kiểm UI bằng `?mock` + Playwright

**Target Platform**: macOS desktop (Tauri 2), cửa sổ tối thiểu 960×600

**Project Type**: desktop-app

**Performance Goals**: chiều cao bám con trỏ mỗi frame (rAF), chỉ Composer re-render

**Constraints**: thanh công cụ luôn hiện; ≥120px, ≤80% chiều cao cửa sổ; bù zoom CSS

**Scale/Scope**: sửa `ResizeHandle`, `layout.ts`, `useLayoutWidths.ts`, `useUiStore.ts`, `Composer.tsx`; thêm test

## Constitution Check

| Nguyên tắc | Đánh giá |
|---|---|
| I. Agent sống độc lập | Đạt. Thuần UI; app tắt giữa lúc kéo chỉ mất lần kéo dở, agent không ảnh hưởng. |
| II. Không mất dữ liệu hội thoại | Đạt. Không đụng event log; nội dung soạn giữ nguyên khi kéo (FR-005). |
| III. Nắm quyền kiểm soát | Đạt. Nút Interrupt và Esc giữ nguyên (FR-008). |
| IV. Hiển thị không chậm | Đạt. rAF throttle, hội thoại không re-render. |
| V. Tương thích hệ sinh thái | Không liên quan. |
| VI. Giữ đơn giản | Đạt. Tái dùng component có sẵn, một số lưu mới, không dependency/khái niệm tổ chức mới. |

Re-check sau thiết kế: PASS.

## Design

- `layout.ts`: thêm `COMPOSER = { min: 120, max: 1200, def: 300 }` và `effectiveComposerHeight(saved, viewportHeight)` = kẹp `saved` vào `[min, max(min, floor(0.8*vh))]`.
- `useLayoutWidths.ts`: thêm `useViewportHeight()` (bù `currentZoomFactor`, lắng nghe `resize`, phụ thuộc `zoom`).
- `useUiStore.ts`: thêm `composerHeight` (default 300), `setComposerHeight` (kẹp), kẹp lại trong `merge`, thêm vào `partialize`.
- `ResizeHandle.tsx`: thêm `orientation` (mặc định vertical, không đổi hành vi cũ); ngang dùng `clientY`, ↑/↓, `cursor-row-resize`, `aria-orientation="horizontal"`, kéo lên = tăng.
- `Composer.tsx`: khi `expanded` render `<ResizeHandle orientation="horizontal" …>` ở cạnh trên khung viền; textarea `style={{ height: effective }}` thay `h-[65vh]` (giữ `shrink` + `min-h-0`).

## Project Structure

### Documentation

```text
specs/013-composer-expand-resize/
├── plan.md  research.md  data-model.md  quickstart.md
├── contracts/ui-contract.md
└── tasks.md   # /speckit-tasks
```

### Source Code

```text
src/lib/layout.ts                        # COMPOSER, effectiveComposerHeight
src/lib/useLayoutWidths.ts               # useViewportHeight
src/stores/useUiStore.ts                 # composerHeight
src/components/layout/ResizeHandle.tsx   # orientation
src/components/composer/Composer.tsx     # tay nắm + chiều cao
tests/unit/                              # layout, ResizeHandle ngang, composerResize
```

**Structure Decision**: giữ cấu trúc hiện có của app Tauri + React; không thêm thư mục.

## Complexity Tracking

Không có vi phạm.
