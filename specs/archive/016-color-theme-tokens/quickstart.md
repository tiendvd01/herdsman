# Quickstart: kiểm tra bộ mã màu theo tên

**Chuẩn bị**: `pnpm install`; `pnpm dev` rồi mở `http://localhost:<port>/?mock` (Playwright như thường lệ). Với theme custom thật, chạy app Tauri (`pnpm tauri dev`) để dùng `<data_dir>/themes/`.

## Test tự động
- `pnpm vitest run tests/unit/themeRoles.test.ts tests/unit/themeSchema.test.ts tests/unit/themeBuiltin.test.ts` — sổ vai trò đủ khóa; `theme-roles.css` khớp sổ; file hợp lệ/lỗi/trùng tên; 3 theme có sẵn khớp giá trị cũ (golden) và tương phản ≥ 4.5:1.
- `pnpm vitest run` và `pnpm tsc --noEmit` — không hồi quy (`scrollbar`, `settingsDialog`, `paperTheme` đã cập nhật).
- `cargo test --manifest-path src-tauri/Cargo.toml` — lệnh `theme_files` (thư mục thiếu, file lớn, không phải `.json`).

## Kiểm tay (khớp spec)
1. **US1**: đổi `border` trong `src/theme/builtin/paper.json` → mọi viền (sidebar, hộp thoại, bảng, Mermaid, biểu đồ) ở Paper đổi theo; Light/Dark không đổi. `rg "#[0-9a-fA-F]{6}" src --glob '!src/theme/builtin/*'` không còn mã màu gõ tay (trừ devMock). (SC-001, SC-004)
2. **US2**: thêm một dòng vai trò mới vào `roles.ts`, dùng class `bg-<tên>` ở một thành phần → màu hiện ở cả 3 theme, không sửa file theme. (SC-002)
3. **US3**: thả `{ "background": "...", "foreground": "..." }` vào `<data_dir>/themes/sepia.json` → mở Settings → thấy `sepia` ở Light theme (hoặc Dark theme) → chọn → app đổi; xóa file → về `light`. File hỏng → thấy dòng lỗi, theme khác vẫn dùng. (SC-003, SC-006)
4. **US4**: chọn Light theme = Paper, Dark theme = Dark; Theme = System, đổi macOS Light/Dark → Paper ↔ Dark; ⌘⇧L vẫn xoay vòng. Người dùng cũ đã chọn Paper (spec 015) vẫn thấy Paper sau khi nâng cấp.
5. Chụp Light, Paper, Dark trước/sau và so sánh: không khác biệt thị giác. (SC-005)
