# Tasks: Bộ mã màu theo tên (color token set)

**Input**: `/specs/016-color-theme-tokens/` (plan.md, spec.md, research.md, data-model.md, contracts/theme-file.md, quickstart.md)

**Tests**: Có — plan.md liệt kê `themeRoles`, `themeSchema`, `themeBuiltin` và cập nhật các test theme cũ; golden test là cách duy nhất chứng minh FR-010.

**Format**: `- [ ] [ID] [P?] [Story] Mô tả + đường dẫn file`

## Phase 1: Setup

- [x] T001 Chụp "golden" giá trị màu hiện tại của 3 theme TRƯỚC khi xóa CSS cũ: viết script một lần (hoặc lệnh trong terminal) đọc khối `:root` (Light), `.paper` (ghi đè lên `:root`) và `.dark` (ghi đè lên `:root`) trong `src/styles/globals.css`, ghi ra `tests/fixtures/theme-golden.json` dạng `{ light: {--var: value}, paper: {...}, dark: {...} }` (mỗi theme đủ mọi biến màu, đã gộp với `:root`). File này là nguồn đối chiếu cho T007 và T015.

## Phase 2: Foundational (chặn mọi user story)

**Mục tiêu**: sổ vai trò, validate, suy ra màu, file theme có sẵn và danh mục — nền chung cho cả 4 story.

- [x] T002 [P] Tạo `src/theme/color.ts`: `parseHex(s)` chỉ nhận đúng `#rrggbb` (6 chữ số hex, không alpha) và `parseHexA(s)` nhận thêm `#rrggbbaa` (chỉ dùng cho `scrim`), `toHex`, `mix(a, b, pct)` trong sRGB, `luminance`, `contrast(a, b)` (công thức WCAG như `tests/unit/scrollbar.test.ts`)
- [x] T003 Tạo `src/theme/roles.ts` (cần T002): mảng `ROLES` gồm `{ key, cssVar, derive(base) }` cho đủ vai trò trong data-model.md: `background`, `foreground`, `surface`, `muted`, `muted_foreground`, `border`, `input`, `ring`, `primary`, `primary_foreground`, `accent`, `accent_foreground`, `destructive`, `code`, `working`, `blocked`, `error`, `done`, `idle`, `warn_bg`, `warn_fg`, `warn_border`, `warn_icon`, `danger_bg`, `diff_add`, `diff_del`, `diff_add_fg`, `diff_del_fg`, `term_bg`, `term_fg`, `scrim`, `scrollbar_thumb`, `scrollbar_thumb_hover`, `term_scrollbar_thumb`, `term_scrollbar_thumb_hover`; `tailwind: boolean` (true nếu cần `--color-<tên>`; false chỉ cho `scrollbar_thumb`, `scrollbar_thumb_hover`, `term_scrollbar_thumb`, `term_scrollbar_thumb_hover`); `cssVar` giữ đúng tên hiện tại (ví dụ `muted_foreground` → `--muted-foreground`, `working` → `--st-working`, `error` → `--st-error`); `term_bg`/`term_fg`/`term_scrollbar_*` luôn suy ra bảng tối cố định bất kể theme (Log luôn tối); `scrim` suy ra `#rrggbbaa` (đen, độ mờ 0.5 cho theme sáng, 0.7 cho theme tối); `derive` theo research.md R4 (trộn từ `background`/`foreground`; trạng thái dùng `ansi[4|3|1|2|8]` nếu có, không thì bảng mặc định theo sáng/tối); kèm hàm `deriveBase(file)` cho `selection` mặc định mix(background, foreground, 15%). Đầu file ghi chú "Thêm màu mới = thêm một dòng ở đây rồi `pnpm theme:gen`" (theo contracts/theme-file.md)
- [x] T004 Tạo `scripts/gen-theme-css.mjs` (chạy bằng `node scripts/gen-theme-css.mjs` — Node ≥ 24 chạy được `.ts` trực tiếp nên `src/theme/roles.ts` và `src/theme/color.ts` MUST chỉ dùng cú pháp TypeScript xoá được (không enum/parameter property) và import nhau kèm đuôi `.ts`, không dùng alias `@/`) sinh `src/styles/theme-roles.css` gồm một khối `@theme inline { --color-<tên>: var(<cssVar>); … }` từ `ROLES` (tên Tailwind giữ như hiện nay: `--color-background`, `--color-st-working`, `--color-term-bg`…; thêm trường `tailwind` trong `ROLES` để loại biến không cần màu Tailwind như `scrollbar_*`, `ring` giữ); thêm script `theme:gen` (= `node scripts/gen-theme-css.mjs`), `predev`, `prebuild`, `pretest` vào `package.json`; chạy một lần và commit file sinh
- [x] T005 [P] Tạo `src/theme/schema.ts`: `parseThemeFile(file: string, text: string)` → `{ ok: true, theme } | { ok: false, error: { file, field?, message } }` theo data-model.md: `background` và `foreground` bắt buộc; mọi màu "`#rrggbb` (đúng 6 chữ số hex)", riêng khóa `scrim` nhận "`#rrggbbaa` (8 chữ số hex)" hoặc `#rrggbb`; `ansi` "đúng 16 phần tử nếu có"; `name` "1–40 ký tự; MUST NOT trùng `light`/`paper`/`dark`"; `appearance` "`light` hoặc `dark`, mặc định suy từ độ sáng `background` (< 0.5 → dark)"; file "≤ 256 KB"; JSON hỏng → lỗi; khóa `colors` không thuộc `ROLES` → cảnh báo (không lỗi), giá trị sai định dạng → lỗi theme
- [x] T006 Tạo `src/theme/resolve.ts` (cần T003, T005): `resolveTheme(parsed)` → `ResolvedTheme { id, name, appearance, source, colors }` với `colors` đủ mọi vai trò (khai báo thắng suy ra); `contrastReport(resolved)` trả danh sách cặp chữ–nền dưới 4.5:1 cho `foreground`/`muted_foreground`/`working`/`blocked`/`error`/`done` trên `background`/`surface`/`muted`, `primary_foreground` trên `primary`, `warn_fg` trên `warn_bg`, `diff_*_fg` trên `diff_*`
- [x] T007 [P] Tạo 3 theme có sẵn `src/theme/builtin/light.json`, `paper.json`, `dark.json` (cần T001, T003): định dạng file theme, khai báo ĐỦ mọi vai trò bằng đúng giá trị trong `tests/fixtures/theme-golden.json` (chuyển `--st-working` → `working`, v.v.), `appearance` tương ứng, `background`/`foreground` lấy từ `--background`/`--foreground`
- [x] T008 Tạo `src/theme/catalog.ts` (cần T005–T007): `buildCatalog(customFiles: {file, text}[])` → `{ themes, errors, warnings }`; hiện chỉ nạp built-in (nạp 3 file bằng `import.meta.glob('./builtin/*.json', { eager: true, query: '?raw' })`), có `DEFAULT_LIGHT='light'`, `DEFAULT_DARK='dark'`, `findTheme(catalog, id, appearance)` rơi về mặc định cùng chiều khi id không có/không đúng chiều; phần custom làm ở T022
- [x] T009 [P] Tạo `tests/unit/themeRoles.test.ts` và `tests/unit/themeSchema.test.ts`: `ROLES` không trùng `key`/`cssVar`; mọi `derive` trả `#rrggbb` hợp lệ cho theme tối thiểu (chỉ `background`/`foreground`); schema: hợp lệ tối thiểu, thiếu `background`, hex 3 chữ số/`rgb()`/có alpha → lỗi, `ansi` 15 phần tử → lỗi, tên trùng `paper` → lỗi, khóa lạ → cảnh báo, JSON hỏng → lỗi nêu tên file

**Checkpoint**: `resolveTheme` cho ra bảng màu đủ vai trò từ built-in.

## Phase 3: User Story 1 — Mỗi theme là một bộ màu duy nhất (P1) 🎯 MVP

**Mục tiêu**: đổi/thêm màu của một theme chỉ sửa file bộ màu; không còn hex gõ tay ngoài bộ màu.

**Independent Test**: sửa `border` trong `src/theme/builtin/paper.json` → mọi viền ở Paper đổi theo, Light/Dark không đổi; quét mã không còn hex ngoài `builtin/*.json`.

- [x] T010 [US1] Tạo `src/theme/apply.ts` (cần T006): `applyTheme(resolved, root = document.documentElement)` ghi từng `cssVar` bằng `style.setProperty`, xóa các biến do lần áp trước đặt mà bảng mới không có, và đặt class `dark` trên `<html>` đúng bằng `appearance === 'dark'` (class `paper` bị bỏ)
- [x] T011 [US1] Sửa `src/styles/globals.css`: xóa toàn bộ khối màu `:root`, `.paper`, `.dark` (giữ `--radius`, `--content-step` trong `:root`), thay toàn bộ dòng `--color-*` trong `@theme inline` bằng `@import './theme-roles.css';` (giữ `--font-*`, `--radius-*`), đổi `.bg-term-bg { --scrollbar-thumb: var(--term-scrollbar-thumb); --scrollbar-thumb-hover: var(--term-scrollbar-thumb-hover); }`; kiểm `pnpm vite build` biên dịch được
- [x] T012 [US1] Viết lại `src/lib/theme.ts` (cần T008, T010): `useThemeEffect` chọn theme hiệu lực (tạm thời: `resolveVariant` cũ → id `dark`/`paper`/`light` theo `lightStyle`, US4 sẽ đổi sang `lightTheme`/`darkTheme`), gọi `applyTheme`, giữ lắng nghe `matchMedia`; mỗi lần áp xong, lưu bảng màu đã giải của theme đang dùng vào `localStorage` khóa `herdsman-theme-cache` (try/catch) để lúc khởi động không chớp theme dự phòng với theme custom; `useVariant` thay bằng `useThemeColors(): ResolvedTheme` (reactive) và `useThemeId()`; giữ `isDark()`, `currentFontSans()`, `applyFonts`; sửa `src/main.tsx` gọi `applyTheme` đồng bộ MỘT lần trước `createRoot` với bảng màu lấy từ `herdsman-theme-cache` (nếu đúng id đã chọn trong `herdsman-ui`), không có/lỗi → theme built-in tương ứng, cuối cùng `light`, để không chớp màu khi mở app
- [x] T013 [P] [US1] Sửa `src/components/conversation/Mermaid.tsx`: bỏ `palettes` hex, dựng `themeVariables` từ `useThemeColors().colors` (bg=`background`, node=`surface`, border=`border`, text=`foreground`, muted/line=`muted_foreground`, note=`muted`); khóa cache và `lastTheme` theo `id` theme; effect phụ thuộc `id`
- [x] T014 [P] [US1] Sửa `src/components/conversation/Chart.tsx`: bỏ mọi hex, lấy `mark.color`=`foreground`, `range.category`=[`foreground`,`working`,`blocked`,`done`,`idle`,`error`], `axis.labelColor/titleColor`=`muted_foreground`, `domainColor/tickColor`=`border`, `gridColor`=`muted`, `theme: appearance==='dark' ? 'dark' : undefined`; effect phụ thuộc `id` theme
- [x] T015 [US1] Cập nhật/ thêm test: tạo `tests/unit/themeBuiltin.test.ts` — (a) `resolveTheme` của `light`/`paper`/`dark` trùng từng biến với `tests/fixtures/theme-golden.json` (FR-010, SC-005); (b) `contrastReport` rỗng cho 3 theme có sẵn; (c) quét `src/**/*.{ts,tsx,css}` (trừ `src/theme/builtin`, `src/lib/devMock.ts`, `src/styles/theme-roles.css`) không còn `#[0-9a-fA-F]{6}` hay `rgba?(` (SC-004); sửa `tests/unit/scrollbar.test.ts` và `tests/unit/paperTheme.test.ts` đọc giá trị từ `src/theme/builtin/*.json` thay vì phân tích khối CSS đã xóa
- [x] T016 [US1] Chạy `pnpm vitest run` + `pnpm tsc --noEmit`; mở `?mock` bằng Playwright, chụp Light, Paper, Dark và so với ảnh chụp trước thay đổi (quickstart bước 1 và 5)

**Checkpoint**: US1 dùng được độc lập (MVP) — 3 theme chạy từ file, giao diện không đổi.

## Phase 4: User Story 2 — Thêm màu mới chỉ ở một chỗ (P1)

**Mục tiêu**: thêm một vai trò màu = một dòng ở sổ vai trò, mọi theme tự có.

**Independent Test**: thêm vai trò thử, dùng ở một class → hiện đúng ở 3 theme mà không sửa file theme.

- [x] T017 [P] [US2] Thêm vào `tests/unit/themeRoles.test.ts`: (a) `src/styles/theme-roles.css` bằng đúng đầu ra của hàm sinh từ `ROLES` (test thất bại nếu quên chạy `pnpm theme:gen`); (b) thêm một vai trò giả `{ key: 'link', cssVar: '--link', derive }` vào bản sao `ROLES` → `resolveTheme` của 3 theme có sẵn đều có `link` (suy ra) và theme khai báo `link` thì thắng (FR-003, FR-005, SC-002)
- [x] T018 [P] [US2] Thêm vào `tests/unit/themeSchema.test.ts`: theme tối thiểu `{ background, foreground }` cho ra bảng màu đủ vai trò và `contrastReport` không quá 0 cặp lỗi cho một cặp nền sáng/chữ tối và một cặp nền tối/chữ sáng; theme cũ không biết vai trò mới vẫn resolve đủ (edge case)
- [x] T019 [US2] Rà `src/theme/roles.ts` và `scripts/gen-theme-css.mjs`: chắc chắn thêm một dòng vai trò rồi chạy `pnpm theme:gen` là đủ (không sửa tay `globals.css` hay `theme-roles.css`); cập nhật ghi chú đầu file và mục "Thêm màu mới" trong `specs/016-color-theme-tokens/contracts/theme-file.md` nếu lệnh/đường dẫn khác thực tế

**Checkpoint**: US1 + US2 đạt mục tiêu chính của feature.

## Phase 5: User Story 3 — Tự thêm theme custom bằng một file (P2)

**Mục tiêu**: thả file `.json` vào `<data_dir>/themes/` là có theme mới, không build lại.

**Independent Test**: thả `{ "background": "...", "foreground": "..." }` → Settings thấy theme, chọn được; file hỏng → hiện lỗi, theme khác dùng bình thường.

- [x] T020 [US3] Thêm lệnh Tauri `theme_files` vào `src-tauri/src/commands.rs`: đọc `<st.data_dir>/themes/*.json` (tạo thư mục nếu thiếu), trả `Vec<ThemeFile { file: String, text: Option<String>, error: Option<String> }>` sắp theo tên; bỏ qua mục không phải file `.json`; file lớn hơn 256 KB trả `error` thay vì `text`; đăng ký trong `tauri::generate_handler!` ở `src-tauri/src/lib.rs`; thêm unit test trong module test cùng file (thư mục thiếu, file lớn, đuôi khác `.json`)
- [x] T021 [P] [US3] Thêm `themeFiles: () => invoke<ThemeFile[]>('theme_files')` vào `src/lib/api.ts` (+ kiểu `ThemeFile` trong `src/lib/types.ts`), `useThemeFiles()` trong `src/lib/queries.ts` (`refetchOnMount: 'always'`, `staleTime: 0`, `retry: false`), và `case 'theme_files': return []` trong `src/lib/devMock.ts`
- [x] T022 [US3] Hoàn thiện `src/theme/catalog.ts` (cần T020 hình dạng dữ liệu): `buildCatalog` nhận `ThemeFile[]`, với mỗi file gọi `parseThemeFile`; lỗi → `errors[]` `{file, field, message}`; id = tên file bỏ `.json`; id/name trùng built-in hoặc trùng nhau giữa custom → bỏ file, ghi lỗi trùng tên; cảnh báo khóa lạ và cảnh báo tương phản từ `contrastReport` → `warnings[]`; theme custom có `source: 'custom'`
- [x] T023 [US3] Thêm hook `useThemeCatalog()` (trong `src/lib/theme.ts` hoặc `src/theme/useCatalog.ts`): ghép `useThemeFiles()` với `buildCatalog`, memo theo dữ liệu; `useThemeEffect` dùng catalog này và rơi về `light`/`dark` có sẵn khi theme đã chọn không còn hợp lệ (FR-009); Mermaid/Chart tự vẽ lại khi `id` đổi
- [x] T024 [US3] Sửa `src/components/settings/SettingsDialog.tsx`: trong Appearance thêm khối "Custom themes" hiện đường dẫn thư mục `themes/` (từ `app_info.data_dir`), danh sách lỗi dạng `file · trường · lý do` và cảnh báo (màu `warn_*`/`error`), và gợi ý nạp lại khi mở Settings (spec FR-006, FR-008, FR-012)
- [x] T025 [P] [US3] Tạo `tests/unit/themeCatalog.test.ts`: file tối thiểu hợp lệ vào catalog; hex sai/ JSON hỏng/ thiếu `background` → vào `errors` đúng `file` và `field`, theme khác còn nguyên; trùng `paper` → bị bỏ + lỗi; hai file cùng id → lỗi; khóa lạ → `warnings`; tương phản thấp → `warnings` không phải `errors`; thêm một test trong `tests/unit/settingsDialog.test.tsx` kiểm lỗi catalog hiện trong Settings

**Checkpoint**: theme custom dùng được độc lập; lỗi không làm vỡ app.

## Phase 6: User Story 4 — Light/Dark chọn theo theme, Paper là theme thường (P3)

**Mục tiêu**: bỏ `lightStyle`; chọn theme sáng và theme tối từ danh mục; System/⌘⇧L giữ nguyên.

**Independent Test**: Light theme = Paper, Dark theme = Dark, đổi macOS → Paper ↔ Dark; người dùng cũ đã chọn Paper vẫn thấy Paper.

- [x] T026 [US4] Sửa `src/stores/useUiStore.ts`: bỏ `lightStyle`/`setLightStyle`/`isLightStyle`; thêm `lightTheme: string` (mặc định `'light'`), `darkTheme: string` (mặc định `'dark'`), `setLightTheme`, `setDarkTheme`; nâng `version` 3 → 4; `migrateUi` v3→v4: `lightStyle === 'paper'` → `lightTheme = 'paper'`, xóa `lightStyle`; `merge` đặt id không phải chuỗi/rỗng về mặc định; thêm `lightTheme`, `darkTheme` vào `partialize`
- [x] T027 [US4] Sửa `src/lib/theme.ts` (cần T026): `resolveVariant` → `resolveThemeId(mode, lightTheme, darkTheme, systemDark)` (Dark thắng theo `mode`/System; còn lại `lightTheme`), `findTheme` kiểm đúng chiều sáng/tối, id sai/mất → `light`/`dark` có sẵn; `src/main.tsx` đọc `lightTheme`/`darkTheme` từ `localStorage`; `src/lib/actions.ts` (`cycleTheme`) giữ nguyên
- [x] T028 [US4] Sửa `SettingsDialog.tsx`: thay `LightStylePicker` bằng hai ô chọn **Light theme** (liệt kê theme `appearance=light`) và **Dark theme** (liệt kê theme `appearance=dark`) dùng `@radix-ui/react-select` (đã là dependency) qua wrapper mới `src/components/ui/select.tsx` theo kiểu `popover.tsx`/`dropdown-menu.tsx`, gắn nhãn `Custom` cho `source==='custom'`; hint "Applies when the theme is Light/Dark."; chọn → áp ngay và lưu
- [x] T029 [US4] Cập nhật test: `tests/unit/paperTheme.test.ts` → đổi sang `lightTheme`/`darkTheme` (bảng class `dark` theo `appearance`, System + macOS đổi → `paper` ↔ `dark`, ⌘⇧L xoay vòng giữ `lightTheme`); thêm test `migrateUi` v3→v4 (`lightStyle:'paper'` → `lightTheme:'paper'`; `lightStyle:'default'` → `light`), id mất/sai chiều → mặc định; `tests/unit/settingsDialog.test.tsx` thay test radiogroup "Light style" bằng test hai ô chọn theme

**Checkpoint**: cả 4 story hoàn chỉnh.

## Phase 7: Polish

- [x] T030 Chạy `pnpm vitest run`, `pnpm tsc --noEmit`, `pnpm vite build` và `cargo test --manifest-path src-tauri/Cargo.toml` — không hồi quy
- [x] T031 Kiểm tay theo `specs/016-color-theme-tokens/quickstart.md` (Playwright `?mock` cho US1/US2/US4; app Tauri thật cho US3 với `<data_dir>/themes/sepia.json`): chụp Light, Paper, Dark trước/sau và xác nhận không khác biệt (SC-005); thử file hỏng, trùng tên, xóa file khi đang chọn (SC-006)
- [x] T032 [P] Thêm ghi chú trong `specs/015-light-paper-theme/spec.md` rằng "Light style" (`lightStyle`) được spec 016 thay bằng `lightTheme`/`darkTheme`; cập nhật chú thích đầu `src/lib/theme.ts` nhắc spec 016

## Implementation notes

- Custom theme files load through a small zustand store (`src/theme/files.ts`) instead of react-query (T021/T023), so Mermaid and Chart work outside a `QueryClientProvider`; `useThemeFiles` in `src/lib/queries.ts` was not added.
- Built-in Light keeps its pre-016 colours (FR-010): its status colours and muted-on-muted text are below 4.5:1, so `themeBuiltin.test.ts` exempts only those pairs for `light`; Paper and Dark pass every pair.
- Chart: the 5th category and the dark `mark` colour now come from `idle` / `primary` (tiny shift in dark), everything else matches the old values.
- `isDark()` was removed (no callers).

## Dependencies & Order

- Phase 1 → Phase 2 (T002 ‖ T005 trước; T003 sau T002; T004, T006, T007 sau T003; T008 sau T005–T007; T009 song song sau T003/T005).
- US1 (T010–T016) cần Phase 2; T011 phải xong trước khi chạy giao diện; T013 ‖ T014 sau T012.
- US2 (T017–T019) cần Phase 2 (độc lập US1 về logic nhưng nên làm sau US1 để chạy được trên giao diện).
- US3 (T020–T025) cần US1; T020 ‖ T021; T022 sau T008; T023 sau T021–T022; T024 sau T023.
- US4 (T026–T029) cần US1 và US3 (cần catalog + chọn theme custom); T028 sửa cùng file với T024 nên làm sau T024.
- Polish sau cùng.

## Parallel Examples

- Phase 2: T002 ‖ T005; sau đó T004 ‖ T006 ‖ T007.
- US1: T013 ‖ T014.
- US2: T017 ‖ T018.
- US3: T020 ‖ T021; T025 song song với T024.

## Implementation Strategy

- **MVP**: Phase 1 + Phase 2 + US1 (T001–T016) → ba theme chạy từ file bộ màu, giao diện không đổi.
- Tiếp theo US2 (khóa "thêm màu chỉ một chỗ" bằng test), rồi US3 (theme custom), US4 (dọn mô hình chọn theme), cuối cùng Polish.
- Rủi ro lớn nhất là hồi quy thị giác khi xóa CSS cũ: T001 + T015(a) là rào chắn, làm đủ trước khi xóa ở T011.
