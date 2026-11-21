# Tasks: Light theme — Paper style

**Input**: `/specs/015-light-paper-theme/` (plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md)

**Tests**: Có — plan.md liệt kê `tests/unit/paperTheme.test.ts` và mở rộng `settingsDialog.test.tsx` (theo mẫu `scrollbar.test.ts`).

**Format**: `- [ ] [ID] [P?] [Story] Mô tả + đường dẫn file`

## Phase 1: Setup

Không cần setup mới (dự án đã có Vite/Vitest/Tailwind).

## Phase 2: Foundational (chặn mọi user story)

**Mục tiêu**: có field lưu `lightStyle`, token `.paper`, và logic áp class đúng bảng trong data-model.md.

- [x] T001 Thêm type `LightStyle = 'default' | 'paper'`, field `lightStyle` (mặc định `'default'`) và action `setLightStyle` vào `src/stores/useUiStore.ts`; thêm `lightStyle` vào `partialize`; trong `merge` validate: giá trị không thuộc `'default' | 'paper'` → `'default'` (không bump version)
- [x] T002 [P] Thêm khối `.paper { … }` vào `src/styles/globals.css`, đặt sau `:root` và trước `.dark`, ghi đè token theo research.md R3: `--background #f6f1e7`, `--surface #efe8da`, `--muted`/`--accent #e8dfcc`, `--border`/`--input #d9cfba`, `--foreground #2b2620`, `--muted-foreground #6b6354`, `--primary #2b2620`, `--primary-foreground #f6f1e7`, `--code #efe8da`, `--ring #a39a85`, `--st-working #1d4ed8`, `--st-blocked #b45309`, `--st-error #b91c1c`, `--st-done #15803d`, cùng `--warn-*`, `--danger-bg`, `--diff-*`, `--scrim`, `--scrollbar-thumb(-hover)` tông ấm; KHÔNG ghi đè `--term-bg`/`--term-fg` (Log giữ tối)
- [x] T003 Cập nhật `useThemeEffect` trong `src/lib/theme.ts`: đọc `lightStyle` từ store; `dark` → bật class `dark` và tắt `paper`; ngược lại bật `paper` khi `lightStyle==='paper'`; không bao giờ có cả hai class; `lightStyle` vào deps của effect. ~~Thêm export `currentVariant()`~~ (bỏ: effect con chạy trước effect áp class của App nên đọc class sẽ cũ; dùng `useVariant()` + `resolveVariant()` thay thế)

**Checkpoint**: đặt `lightStyle: 'paper'` trong store là `<html>` có class `paper` khi Light.

## Phase 3: User Story 1 — Chọn bộ Paper cho chế độ Light (P1) 🎯 MVP

**Mục tiêu**: chọn Paper trong Settings → giao diện đổi ngay, được lưu.

**Independent Test**: Settings → Appearance → Light + Paper → nền kem toàn app; Default → như cũ; tải lại vẫn giữ.

- [x] T004 [P] [US1] Tạo `tests/unit/paperTheme.test.ts`: (a) `.paper` định nghĩa đủ các token của `:root` cần ghi đè; (b) tương phản `--foreground`/`--muted-foreground`/`--st-*` trên `--background` và `--surface` ≥ 4.5:1 (hàm `block`/`contrast` theo `tests/unit/scrollbar.test.ts`); (c) store: mặc định `'default'`, `merge` giá trị lạ → `'default'`
- [x] T005 [P] [US1] Mở rộng `tests/unit/settingsDialog.test.tsx`: reset `lightStyle: 'default'` trong `beforeEach`; test radiogroup `aria-label="Light style"` có 2 radio Default/Paper, bấm Paper → `useUiStore.getState().lightStyle === 'paper'` và `aria-checked` đúng
- [x] T006 [US1] Thêm `LightStylePicker` (radiogroup `aria-label="Light style"`, radio **Default** và **Paper**, cùng kiểu class với `ThemePicker`) và hàng `Row label="Light style" hint="Applies when the theme is Light."` ngay dưới hàng Theme trong `AppearanceSection` tại `src/components/settings/SettingsDialog.tsx` (theo `contracts/ui-contract.md`)
- [x] T007 [US1] Chạy `pnpm vitest run tests/unit/paperTheme.test.ts tests/unit/settingsDialog.test.tsx`; chỉnh màu `.paper` ở T002 cho tới khi test tương phản đạt

**Checkpoint**: US1 dùng được độc lập (MVP).

## Phase 4: User Story 2 — Paper chỉ ảnh hưởng Light (P2)

**Mục tiêu**: Dark và System/⌘⇧L giữ nguyên hành vi.

**Independent Test**: Paper đã chọn, đổi System/Light/Dark và appearance macOS → Paper chỉ hiện khi kết quả là Light.

- [x] T008 [P] [US2] Thêm test vào `tests/unit/paperTheme.test.ts` cho `useThemeEffect` (mock `matchMedia`): bảng class trong data-model.md (dark→`dark` không `paper`; light+default→không class; light+paper→`paper`); System + macOS đổi Light↔Dark → `paper`↔`dark`; đổi theme rồi quay lại giữ nguyên `lightStyle`
- [x] T009 [P] [US2] Thêm test `cycleTheme` trong `tests/unit/paperTheme.test.ts`: vòng System → Light → Dark → System và `lightStyle` không đổi (`src/lib/actions.ts` giữ nguyên, không sửa)
- [x] T010 [US2] Trong `src/components/settings/SettingsDialog.tsx`, khi `theme` hiệu lực là Dark vẫn cho chọn Light style nhưng hint hiện "Shown when the theme is Light." (không thêm logic đổi màu app)

**Checkpoint**: US1 + US2 đều chạy, Dark không đổi.

## Phase 5: User Story 3 — Nội dung giàu định dạng đồng bộ (P3)

**Mục tiêu**: Mermaid, Chart, code block, bảng, thanh cuộn hợp tông giấy và vẽ lại khi đổi bộ.

**Independent Test**: hội thoại mẫu có code/Mermaid/chart/bảng ở Light+Paper đọc rõ; đổi Default↔Paper (và Light↔Dark) thì sơ đồ/chart vẽ lại đúng màu.

- [x] T011 [P] [US3] `src/components/conversation/Mermaid.tsx`: `renderMermaid` nhận variant (`currentVariant()`) thay vì `dark`; thêm bảng màu paper (`bg #f6f1e7`, node `#efe8da`, border `#d9cfba`, text `#2b2620`, muted/line `#6b6354`, note `#e8dfcc`); đưa variant vào `cache` key và `lastTheme` key; effect trong `Mermaid` thêm variant (đọc từ store `lightStyle` + `theme` hoặc subscribe class) vào deps để vẽ lại khi đổi
- [x] T012 [P] [US3] `src/components/conversation/Chart.tsx`: thêm nhánh paper cho `mark.color`, `range.category`, `axis.*Color` (khớp token Paper, giữ họ màu trạng thái); thêm variant vào deps của effect để vẽ lại khi đổi
- [x] T013 [P] [US3] Rà `src/components/conversation/CodeBlock.tsx` và `.prose-hs` trong `src/styles/globals.css`: màu Shiki `github-light`, bảng, `hr`, inline code đạt ≥ 4.5:1 trên `--code`/`--background` Paper; chỉ sửa nếu không đạt (không thêm theme Shiki riêng)
- [x] T014 [US3] Trong `src/lib/theme.ts` (hoặc hook nhỏ cạnh đó) export `useVariant()` trả `'dark' | 'paper' | 'light'` theo `theme`, `lightStyle` và `matchMedia`, để T011/T012 dùng làm dependency (làm trước T011/T012 nếu cần)
- [x] T015 [P] [US3] Thêm test trong `tests/unit/paperTheme.test.ts`: `--scrollbar-thumb` Paper ≥ 3:1 trên `--background` và `--surface`; `.bg-term-bg` (Log) không bị `.paper` ghi đè

**Checkpoint**: cả 3 story hoàn chỉnh.

## Phase 6: Polish

- [x] T016 Chạy `pnpm vitest run` và `pnpm tsc --noEmit` — không hồi quy (đặc biệt `scrollbar.test.ts`, `settingsDialog.test.tsx`)
- [x] T017 Kiểm tay theo `specs/015-light-paper-theme/quickstart.md` bằng Playwright ở `?mock` (chụp ảnh Light Default, Paper, Dark; xác nhận Default và Dark không đổi so với trước — FR-010, SC-005)
- [x] T018 [P] Cập nhật ghi chú đầu `src/lib/theme.ts` (comment `useThemeEffect`) nhắc spec 015

## Dependencies & Order

- Phase 2 (T001–T003) chặn mọi story; T002 song song với T001/T003.
- US1 (T004–T007) → MVP. US2 (T008–T010) cần Phase 2, độc lập US1 về logic nhưng T010 sửa cùng file với T006 nên làm sau T006.
- US3: T014 trước T011/T012; T011, T012, T013, T015 song song (khác file).
- Polish sau cùng.

## Parallel Examples

- Phase 2: T002 ‖ (T001 → T003)
- US1: T004 ‖ T005, rồi T006, T007
- US3: T011 ‖ T012 ‖ T013 ‖ T015 (sau T014)

## Implementation Strategy

- **MVP**: Phase 2 + US1 (T001–T007) → Paper dùng được.
- Tiếp theo US2 (bảo vệ hành vi Dark/System), rồi US3 (Mermaid/Chart), cuối cùng Polish.
