# Research: Thống nhất bộ khoảng cách (spacing)

## Hiện trạng (kiểm kê `src/**/*.{ts,tsx}`, 2026-11-21)

Token padding / margin / gap / space dùng bậc spacing của Tailwind (1 bậc = 4px):

| Bậc | px | Số lần | Ghi chú |
|-----|----|-------:|---------|
| 0 | 0 | 13 | reset |
| px | 1 | 1 | `gap-px` hàng workspace |
| 0.5 | 2 | 30 | |
| 1 | 4 | 40 | |
| 1.5 | 6 | 36 | |
| 2 | 8 | 105 | |
| 2.5 | 10 | 19 | lẻ |
| 3 | 12 | 47 | |
| 3.5 | 14 | 6 | lẻ |
| 4 | 16 | 28 | |
| 5 | 20 | 2 | lẻ |
| 6 | 24 | 15 | |
| 7 | 28 | 2 | `pr-7` chừa chỗ nút menu workspace |
| 8 | 32 | 2 | |
| 12 | 48 | 1 | `py-12` EmptySession |
| `[3px]` | 3 | 2 | đệm tablist (RightPanel, HistoryPopover) |
| `[15px]` | 15 | 1 | thụt đường cây workspace |
| `[84px]` | 84 | 1 | chừa chỗ đèn giao thông macOS |

→ 18 giá trị khác nhau.

## Nguyên nhân lệch trong ảnh

- Dòng tiêu đề "Projects" có `pr-0.5` (2px), còn nút "+" của project nằm sát mép phải vùng nav → nút "+" tiêu đề lệch trái 2px.
- Nút menu workspace (`WorkspaceMenu` biến thể sidebar) đặt `absolute right-0.5` → cũng lệch trái 2px so với nút "+" project.
- Ba header (sidebar `h-14`, vùng giữa `min-h-14`, side panel `min-h-14`) đã cùng 56px; giữ nguyên, chỉ thêm vào quy tắc.

## Quyết định

### D1. Bộ khoảng cách 8 bậc trên lưới 4px

- **Decision**: cho phép các bậc `0.5, 1, 1.5, 2, 3, 4, 6, 8` (2, 4, 6, 8, 12, 16, 24, 32px) cộng `0` để reset. Vai trò:

  | Bậc | px | Vai trò |
  |-----|----|---------|
  | 0.5 | 2 | khe sát giữa các nút icon / hàng liền nhau, đệm tablist |
  | 1 | 4 | khe nhỏ trong control, lề trong cụm |
  | 1.5 | 6 | khe icon ↔ chữ cỡ nhỏ |
  | 2 | 8 | đệm ngang hàng danh sách, khe icon ↔ chữ, khoảng giữa control |
  | 3 | 12 | đệm ngang khu vực / header / card, khe giữa nhóm |
  | 4 | 16 | đệm khối lớn, khoảng giữa các section |
  | 6 | 24 | đệm hộp thoại, lề vùng nội dung |
  | 8 | 32 | khoảng trống của trạng thái rỗng |

- **Rationale**: 8 bậc phủ ~95% chỗ dùng hiện tại; chỉ ~33 token phải đổi nên mật độ giao diện gần như giữ nguyên (SC-005). Lưới 4px khớp mặc định Tailwind, không cần sửa theme.
- **Alternatives**: (a) lưới 8px thuần (4 bậc) — phải đổi >150 token, giao diện thưa hẳn ra, vi phạm giữ mật độ; (b) định nghĩa token tên ngữ nghĩa (`--space-row`, …) trong `@theme` — thêm tầng trừu tượng mà Tailwind đã có sẵn bậc số; khó grep hơn. Bỏ.

### D2. Quy tắc đổi các giá trị lẻ

| Cũ | Mới | Lý do |
|----|-----|-------|
| `*-2.5` (10px) đệm ngang/dọc control | `*-3` nếu là đệm khung/control, `*-2` nếu là khe (`gap`) hoặc đệm trong cụm nhỏ | quyết theo vai trò D1 |
| `*-3.5` (14px) | `*-3` | gần nhất, giữ gọn |
| `*-5` (20px) | `*-4` | gần nhất |
| `pr-7` (chừa chỗ nút menu 28px) | `pr-8` | đủ chỗ cho nút `size-7` đặt `right-0`, cộng khe 4px |
| `py-12` | `py-8` | trạng thái rỗng, bậc lớn nhất |
| `p-[3px]` tablist | `p-0.5` | trong bộ, khác 1px |
| `gap-px` | `gap-0.5` | trong bộ |

### D3. Ngoại lệ được phép (ghi trong danh sách, kèm lý do)

- `pl-[84px]` (`TRAFFIC_LIGHTS_PAD`): chừa chỗ nút đèn giao thông macOS, kích thước do hệ điều hành.
- `ml-[15px]` đường cây workspace: phải nằm dưới tâm mũi tên project (8px đệm + 7px nửa icon 14px). Đổi sang `ml-4` lệch tâm 1px.
- Vị trí tuyệt đối của hộp thoại (`top-[120px]`, `top-[140px]`, `left-1/2`) và kích thước (`h-*`, `w-*`, `size-*`) không phải khoảng cách → ngoài phạm vi kiểm tra.
- CSS của nội dung agent (`.prose-hs` trong `globals.css`, đơn vị `em`) ngoài phạm vi theo Assumptions của spec.

### D4. Căn mép phải cột nút

- **Decision**: mọi nút hành động cuối hàng trong sidebar nằm sát mép phải vùng nội dung (không thêm `pr-*` / `right-*` lệch): đổi tiêu đề "Projects" `pr-0.5` → bỏ, nút menu workspace `right-0.5` → `right-0`.
- **Rationale**: nhỏ nhất, đúng nguyên nhân. Nút ẩn/hiện của project dùng `opacity` nên đã giữ chỗ (FR-007 đạt sẵn); nút workspace là `absolute` nên không đẩy nút khác.

### D5. Kiểm tra tự động

- **Decision**: một test Vitest (`tests/unit/spacingScale.test.ts`) đọc mọi file `src/**/*.{ts,tsx}`, tìm token spacing (kể cả có tiền tố variant như `group-hover:`, dấu âm, giá trị `[...]`) và báo lỗi `file:dòng token` khi giá trị không thuộc bộ D1 và không có trong danh sách ngoại lệ D3. Bộ bậc và ngoại lệ đặt ở `src/lib/spacing.ts` — chỗ duy nhất (FR-009), test import từ đó.
- **Rationale**: chạy cùng `pnpm test` sẵn có; không thêm dependency (không cần ESLint plugin Tailwind, dự án chưa dùng ESLint).
- **Alternatives**: `eslint-plugin-tailwindcss` — thêm ESLint + plugin cho một quy tắc; Tailwind theme ghi đè `--spacing-*` để chặn bậc lạ — Tailwind v4 sinh bậc động từ `--spacing`, không chặn được giá trị `[...]`.

### D6. Zoom (spec 006)

Zoom của 006 phóng cả webview (hoặc CSS `zoom` trên `<html>`), nên mọi khoảng cách co giãn cùng tỉ lệ; FR-008 đạt mà không cần làm gì thêm. Kiểm tra bằng ảnh chụp ở một bậc zoom khác nếu zoom đã có trong bản đang chạy.
