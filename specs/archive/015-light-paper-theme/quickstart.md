# Quickstart: kiểm tra Light — Paper

**Chuẩn bị**: `pnpm install`; chạy `pnpm dev` rồi mở `http://localhost:<port>/?mock` (web view với dữ liệu mẫu, kiểm bằng Playwright theo thói quen của repo).

## Test tự động
- `pnpm vitest run tests/unit/paperTheme.test.ts tests/unit/settingsDialog.test.tsx` — token Paper đủ & tương phản ≥ 4.5:1; store mặc định/validate; class `paper`/`dark` đúng bảng ở [data-model.md](./data-model.md); picker hiện và đổi được.
- `pnpm vitest run` và `pnpm tsc --noEmit` — không hồi quy.

## Kiểm tay (khớp spec)
1. Settings → Appearance → Theme = Light, Light style = Paper → nền kem ở sidebar, hội thoại, composer, Settings, command palette (⌘K); không còn trắng/xám lạnh. (US1, SC-002)
2. Đổi Default → giao diện y như cũ. Tải lại app → lựa chọn còn nguyên. (US1, FR-005)
3. Theme = Dark → Dark chuẩn; Theme = System + đổi macOS Light/Dark → Paper ↔ Dark. ⌘⇧L vẫn xoay vòng. (US2)
4. Mở hội thoại mẫu có code block, Mermaid, chart, bảng ở Paper: đọc rõ, đổi Default↔Paper thì sơ đồ/chart vẽ lại đúng màu. Thanh cuộn thấy rõ. (US3)
5. Kiểm chip trạng thái working/blocked/error/done phân biệt được trên nền kem. (FR-008)
