# Implementation Plan: Light theme — Paper style

**Branch**: `015-light-paper-theme` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-light-paper-theme/spec.md`

## Summary

Thêm tùy chọn **bộ Light** (`default` | `paper`) vào Settings → Appearance. Paper là một khối CSS token riêng (`.paper`) ghi đè token của `:root`, được bật trên `<html>` chỉ khi theme hiệu lực là Light. Lựa chọn lưu trong `useUiStore` (persist). Mermaid, chart và Shiki đọc thêm biến thể này để chọn bảng màu và vẽ lại khi đổi. Không động tới Dark.

## Technical Context

**Language/Version**: TypeScript, React 19 (Vite), Tailwind CSS v4, Tauri 2 shell

**Primary Dependencies**: Zustand (persist), Radix Dialog, Shiki, Mermaid, vega-embed

**Storage**: `localStorage` qua `useUiStore` persist (thêm field `lightStyle`)

**Testing**: Vitest + Testing Library (`tests/unit`), kiểm tra CSS token bằng đọc `globals.css` (mẫu `scrollbar.test.ts`); kiểm tra UI bằng Playwright ở `?mock`

**Target Platform**: macOS desktop (Tauri WebView)

**Project Type**: desktop-app (frontend only cho tính năng này)

**Performance Goals**: đổi bộ hiệu lực trong 1 frame, không tải lại

**Constraints**: tương phản chữ ≥ 4.5:1; Light Default và Dark không đổi một pixel; không gradient

**Scale/Scope**: 1 field store, 1 khối CSS token, 1 picker, 3 renderer (Mermaid, Chart, Shiki)

## Constitution Check

- I. Agent độc lập app: không liên quan (chỉ giao diện); app tắt không ảnh hưởng agent. **Pass**
- II. Không mất dữ liệu hội thoại: không đụng event log. **Pass**
- III. Quyền kiểm soát: màu trạng thái vẫn phân biệt (FR-008), badge/blocked giữ nguyên. **Pass**
- IV. Hiển thị giàu thông tin nhưng không chậm: renderer lỗi vẫn rơi về source; vẽ lại Mermaid/chart chỉ khi đổi bộ, vẫn lười theo viewport. **Pass**
- V. Không thay engine: không liên quan. **Pass**
- VI. Project → Workspace → Session: không thêm khái niệm tổ chức. **Pass**

Re-check sau thiết kế: không vi phạm, không cần Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/015-light-paper-theme/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui-contract.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── stores/useUiStore.ts            # + lightStyle, setLightStyle, persist + validate
├── lib/theme.ts                    # useThemeEffect bật class `paper`; export currentVariant()
├── styles/globals.css              # + khối `.paper` token (đặt sau :root, trước .dark)
├── components/settings/SettingsDialog.tsx  # + LightStylePicker (hàng "Light style")
└── components/conversation/
    ├── Mermaid.tsx                 # palette paper; cache key + effect deps theo variant
    ├── Chart.tsx                   # palette paper; effect deps theo variant
    └── CodeBlock.tsx               # (nếu cần) màu Shiki hợp nền paper

tests/unit/
├── paperTheme.test.ts              # token, tương phản, store, class trên <html>
└── settingsDialog.test.tsx         # + picker
```

**Structure Decision**: giữ cấu trúc hiện có, chỉ sửa file sẵn có; không thêm thư mục mới ngoài test.

## Complexity Tracking

Không có vi phạm.
