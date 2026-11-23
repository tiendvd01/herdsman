# Implementation Plan: Bộ mã màu theo tên (color token set)

**Branch**: `016-color-theme-tokens` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-color-theme-tokens/spec.md`

## Summary

Chuyển toàn bộ màu của app về **một sổ vai trò màu (role registry)** và **theme là file dữ liệu**. Sổ vai trò khai báo mỗi màu một lần: tên khóa trong file theme, CSS variable, và quy tắc suy ra mặc định từ màu gốc. Light, Paper, Dark trở thành ba file theme cùng định dạng; theme custom là file trong `<data_dir>/themes/`. Lúc chạy, app tính bảng màu đầy đủ (gốc + suy ra + ghi đè) rồi ghi lên `<html>`. Mermaid và biểu đồ đọc cùng bảng màu đó, nên không còn hex gõ tay. File CSS `@theme` của Tailwind được sinh từ sổ vai trò để thêm màu mới vẫn chỉ sửa một chỗ.

## Technical Context

**Language/Version**: TypeScript (React 18.3, Vite), Tailwind CSS v4, Rust (Tauri 2)

**Primary Dependencies**: Zustand (persist), TanStack Query, Radix, Mermaid, vega-embed, Shiki; không thêm thư viện mới (trộn màu hex tự viết ~20 dòng)

**Storage**: file `*.json` trong `<data_dir>/themes/` (custom); lựa chọn theme lưu trong `useUiStore` (`herdsman-ui`, nâng version 3 → 4)

**Testing**: Vitest + Testing Library (`tests/unit`); Rust `cargo test` cho lệnh đọc thư mục; Playwright ở `?mock` để kiểm tay

**Target Platform**: macOS desktop (Tauri WebView); `?mock` web view khi dev

**Project Type**: desktop-app

**Performance Goals**: áp bảng màu < 1 frame; không chớp màu lúc khởi động

**Constraints**: 3 theme có sẵn không đổi một pixel (FR-010); mã màu chỉ `#rrggbb`; theme lỗi không làm vỡ app

**Scale/Scope**: ~33 vai trò màu, 3 theme có sẵn, số theme custom không giới hạn cứng

## Constitution Check

- I. Agent độc lập app: chỉ giao diện + đọc file theme; app tắt không ảnh hưởng agent. **Pass**
- II. Không mất dữ liệu hội thoại: không đụng event log, transcript. **Pass**
- III. Quyền kiểm soát: màu trạng thái `working/blocked/done/idle/error` là vai trò bắt buộc ở mọi theme; theme thiếu vai trò này vẫn có giá trị suy ra. **Pass**
- IV. Hiển thị giàu thông tin nhưng không chậm: Mermaid/chart vẫn render lười, lỗi rơi về source; vẽ lại chỉ khi đổi theme. **Pass**
- V. Không thay engine: không liên quan. **Pass**
- VI. Project → Workspace → Session: không thêm khái niệm tổ chức. **Pass**

Sau thiết kế: không vi phạm. Không cần Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/016-color-theme-tokens/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/theme-file.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── theme/                          # mới — toàn bộ logic màu
│   ├── roles.ts                    # SỔ VAI TRÒ: key, cssVar, derive(base) — nơi DUY NHẤT thêm màu
│   ├── color.ts                    # parse/validate #rrggbb, mix, luminance, contrast
│   ├── resolve.ts                  # base + derive + overrides → bảng màu đầy đủ
│   ├── schema.ts                   # validate file theme → {ok, theme} | {error: file, field, msg}
│   ├── catalog.ts                  # built-in + custom → danh mục, mặc định, fallback
│   ├── apply.ts                    # ghi CSS var + class `dark` lên <html>
│   └── builtin/{light,paper,dark}.json   # 3 theme có sẵn, cùng định dạng file custom
├── lib/theme.ts                    # useThemeEffect/useVariant dùng catalog + apply (bỏ lightStyle)
├── lib/{api.ts,queries.ts,devMock.ts}  # + themeFiles()/useThemeFiles(), mock rỗng
├── stores/useUiStore.ts            # theme(mode) giữ; lightStyle → lightTheme + darkTheme (id); migrate v4
├── styles/
│   ├── globals.css                 # bỏ khối :root/.paper/.dark màu; import theme-roles.css
│   └── theme-roles.css             # SINH TỰ ĐỘNG từ roles.ts (@theme inline --color-*)
├── components/settings/SettingsDialog.tsx  # "Light style" → chọn Light theme + Dark theme; hiện lỗi theme
└── components/conversation/{Mermaid,Chart}.tsx  # đọc bảng màu đang dùng, hết hex

scripts/gen-theme-css.mjs           # sinh theme-roles.css; chạy ở predev/prebuild/test
src-tauri/src/commands.rs, lib.rs   # + theme_files: đọc <data_dir>/themes/*.json (thô)

tests/unit/
├── themeRoles.test.ts              # đủ vai trò, derive, theme-roles.css khớp sổ vai trò
├── themeSchema.test.ts             # file hợp lệ/lỗi, trùng tên, hex sai
├── themeBuiltin.test.ts            # 3 theme = giá trị cũ (golden), tương phản
└── paperTheme.test.ts, settingsDialog.test.tsx, scrollbar.test.ts  # cập nhật theo mô hình mới
```

**Structure Decision**: giữ frontend hiện có; gom logic màu vào `src/theme/`; Rust chỉ đọc file thô (một lệnh), mọi validate nằm ở TS để built-in và custom dùng chung một đường.

## Complexity Tracking

Không có vi phạm.
