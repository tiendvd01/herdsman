# Implementation Plan: Kéo đổi độ rộng hai sidebar

**Branch**: `004-resizable-sidebars` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-resizable-sidebars/spec.md`

## Summary

Cho phép kéo mép sidebar trái và side panel phải để đổi độ rộng, nhớ độ rộng qua các lần mở app, nhấp đúp để về mặc định, và điều khiển bằng bàn phím. Cách làm: một component `ResizeHandle` tự viết (Pointer Events + pointer capture, không thêm dependency), hai trường độ rộng mới trong `useUiStore` (thay `rightWide`, có migration), và một hàm thuần `layoutWidths` tính độ rộng hiển thị để vùng hội thoại luôn còn ≥ 400px. Chỉ đổi frontend.

## Technical Context

**Language/Version**: TypeScript 5.8 (frontend); Rust (backend, không đổi)

**Primary Dependencies**: React 18, Zustand (persist), Tailwind 4 — không thêm dependency

**Storage**: localStorage qua `persist` của `useUiStore` (key `herdsman-ui`); không đụng SQLite

**Testing**: Vitest + Testing Library (jsdom); kiểm giao diện bằng Playwright trên `http://localhost:1420/?mock`

**Target Platform**: macOS desktop (Tauri 2, WebView), cửa sổ tối thiểu 960×600

**Project Type**: desktop-app

**Performance Goals**: độ rộng bám chuột mỗi frame (60 fps), không re-render vùng hội thoại khi kéo (SC-002)

**Constraints**: vùng hội thoại ≥ 400px; không di chuyển cửa sổ khi kéo mép; giữ nút widen/narrow

**Scale/Scope**: 1 component mới, 1 module tiện ích, sửa 3 file (store, Sidebar, RightPanel), 2 file test

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Đánh giá |
|---|---|
| I. Agent sống độc lập với app | Đạt. Chỉ đổi bố cục giao diện. App tắt giữa lúc kéo: agent không bị ảnh hưởng; độ rộng là giá trị đã lưu gần nhất. |
| II. Không mất dữ liệu hội thoại | Đạt. Không đụng event log/transcript; FR-010 bảo đảm vị trí cuộn và nội dung ô nhập giữ nguyên. |
| III. Developer nắm quyền kiểm soát | Không ảnh hưởng. |
| IV. Hiển thị giàu thông tin nhưng không chậm | Đạt. Vùng hội thoại là `flex-1`, không re-render khi kéo; cập nhật theo frame (research R4). |
| V. Tương thích hệ sinh thái | Không ảnh hưởng. |
| VI. Project → Workspace → Session, giữ đơn giản | Đạt. Không thêm khái niệm hay store mới; không thêm dependency (research R1). |

Không có vi phạm → bỏ trống Complexity Tracking. **Re-check sau Phase 1**: thiết kế (data-model, contract) giữ nguyên kết luận trên.

## Project Structure

### Documentation (this feature)

```text
specs/004-resizable-sidebars/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── resize-handle.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── lib/layout.ts                     # mới: hằng số giới hạn, clamp, layoutWidths (thuần, không import store)
├── lib/useLayoutWidths.ts            # mới: useViewportWidth, useLayoutWidths
├── stores/useUiStore.ts              # sidebarWidth, rightWidth (thay rightWide), migrate v0→v1
└── components/
    ├── layout/
    │   ├── ResizeHandle.tsx          # mới: thanh kéo (chuột, bàn phím, nhấp đúp, a11y)
    │   ├── AppShell.tsx              # theo dõi độ rộng cửa sổ, truyền độ rộng hiển thị
    │   └── Sidebar.tsx               # width động + handle ở cạnh phải
    └── panels/RightPanel.tsx         # width động + handle ở cạnh trái; nút widen/narrow theo rightWidth

tests/unit/
├── layout.test.ts                    # mới: clamp, layoutWidths, migrate
└── resizeHandle.test.tsx             # mới: kéo, bàn phím, nhấp đúp, aria
```

**Structure Decision**: Frontend React hiện có dưới `src/`, test dưới `tests/unit/`. Không chạm `src-tauri/` hay `sidecar/`.

## Complexity Tracking

Không có.
