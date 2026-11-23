---

description: "Task list for 003-macos-app-icon"
---

# Tasks: Icon app đúng chuẩn macOS và đồng bộ logo trong app

**Input**: Design documents from `/specs/003-macos-app-icon/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/herdsman-mark.md, quickstart.md

**Tests**: Một unit test cho logo sidebar (plan.md → Testing). Còn lại kiểm tra bằng mắt theo quickstart.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Tạo thiết kế gốc `src/assets/herdsman-mark.svg` bằng cách chép nguyên nội dung `public/icon.svg` hiện tại (viewBox 0 0 1024 1024; nền `#09090B` rx 224 tràn khung; chữ H trắng `#FAFAFA` nét 56; chấm `#4ADE80` tại (512,300), chấm `#FBBF24` tại (512,724), r 44)

## Phase 2: Foundational

- [X] T002 Viết `scripts/gen-icons.mjs` (Node ESM, không dependency mới): đọc `src/assets/herdsman-mark.svg`, lấy phần bên trong thẻ `<svg>`, ghi `src-tauri/icons/icon.svg` = khung 1024×1024 trong suốt + filter bóng đổ (dy 10, blur 10, đen opacity 0.3) + `<g transform="translate(100 100) scale(0.8046875)">` chứa nội dung gốc (nền 824×824 ở giữa); chạy `pnpm tauri icon src-tauri/icons/icon.svg`; chạy `pnpm tauri icon src/assets/herdsman-mark.svg -o <thư mục tạm>` rồi chép `icon.ico`, `Square*Logo.png`, `StoreLogo.png` (bản tràn khung) vào `src-tauri/icons/`; xoá `src-tauri/icons/android`, `src-tauri/icons/ios` nếu có; exit ≠ 0 khi lỗi
- [X] T003 Thêm script `"icons": "node scripts/gen-icons.mjs"` vào `package.json`

**Checkpoint**: `pnpm icons` chạy được.

## Phase 3: User Story 1 - Icon Dock đúng kích cỡ macOS (P1) 🎯 MVP

**Goal**: icon app trên Dock có nền 824/1024 với lề trong suốt, cùng thiết kế chữ H.

**Independent Test**: mở `src-tauri/icons/icon.png` thấy lề trong suốt; build app, so Dock với Finder/Safari (quickstart §1, §4).

- [X] T004 [US1] Chạy `pnpm icons` để sinh lại `src-tauri/icons/icon.svg`, `icon.icns`, `icon.png`, `32x32.png`, `64x64.png`, `128x128.png`, `128x128@2x.png`, `icon.ico`, `Square*Logo.png`, `StoreLogo.png`
- [X] T005 [US1] Kiểm tra `src-tauri/icons/icon.png` và `32x32.png`: có lề trong suốt, chữ H và hai chấm còn rõ ở cỡ nhỏ; `src-tauri/tauri.conf.json` → `bundle.icon` không cần đổi

## Phase 4: User Story 2 - Logo trong app giống icon (P2)

**Goal**: logo góc trên sidebar là chữ H từ thiết kế gốc, thay logo ba chấm.

**Independent Test**: `pnpm test` pass test logo; mở `?mock` thấy chữ H ở sidebar, cả theme sáng và tối.

- [X] T006 [P] [US2] Viết test `tests/unit/herdsmanMark.test.tsx`: render `<HerdsmanMark className="size-4" />`, kỳ vọng có `<img>` với `src` chứa `herdsman-mark`, `alt=""`, `aria-hidden="true"`, có class `size-4`
- [X] T007 [US2] Sửa `HerdsmanMark` trong `src/components/layout/Sidebar.tsx`: import `markUrl from '@/assets/herdsman-mark.svg'`, render `<img src={markUrl} alt="" aria-hidden="true" draggable={false} className={className} />`; ở header sidebar bỏ ô `bg-primary text-primary-foreground` bọc ngoài, dùng trực tiếp `<HerdsmanMark className="pointer-events-none size-4 shrink-0" />`

## Phase 5: User Story 3 - Favicon bản web (P3)

**Goal**: tab trình duyệt hiện chữ H.

**Independent Test**: `pnpm dev`, mở `http://localhost:1420/?mock`, nhìn icon tab.

- [X] T008 [P] [US3] Thêm `<link rel="icon" type="image/svg+xml" href="/src/assets/herdsman-mark.svg" />` vào `<head>` của `index.html`
- [X] T009 [US3] Xoá `public/icon.svg` (trùng thiết kế gốc; xác nhận không còn chỗ nào tham chiếu bằng `rg "icon.svg"`)

## Phase 6: Polish

- [X] T010 Chạy `pnpm typecheck` và `pnpm test`
- [X] T011 Kiểm tra UI theo quickstart §3 (Playwright, `?mock`): chụp sidebar theme sáng và tối

## Dependencies

- T001 → T002 → T003 → T004 → T005 (US1)
- T001 → T006, T007 (US2); không phụ thuộc US1
- T001 → T008, T009 (US3)
- T010, T011 sau cùng

## Parallel

- Sau T001: T002 (script), T006 (test), T008 (index.html) chạy song song được vì khác file.

## Implementation Strategy

MVP = US1 (Phase 1–3). Sau đó US2, US3 rồi Polish; mỗi story kiểm tra độc lập theo Independent Test.
