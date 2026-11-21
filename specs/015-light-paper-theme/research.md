# Research: Light theme — Paper style

## R1. Cách biểu diễn bộ Paper
- **Decision**: giữ `theme: 'system'|'light'|'dark'`, thêm field riêng `lightStyle: 'default'|'paper'`; áp class `paper` lên `<html>` khi và chỉ khi Dark không hiệu lực.
- **Rationale**: đúng giả định "Paper là biến thể của Light"; ⌘⇧L (`cycleTheme`) và System theo macOS giữ nguyên, bộ Light không mất khi đổi mode (FR-009).
- **Alternatives**: thêm giá trị `paper` vào `Theme` — phải sửa `NEXT_THEME` và logic System, và chọn Paper sẽ mất khả năng "System → Light/Dark".

## R2. Cách ghi đè màu
- **Decision**: khối `.paper { --background… }` trong `globals.css`, đặt sau `:root`; `.dark` đặt sau nên luôn thắng nếu có cả hai class (phòng hờ), và hook không bật `paper` khi dark.
- **Rationale**: toàn bộ UI đã dùng token CSS → đổi class là đủ, không sửa component. Chỉ cần token tối thiểu thay đổi.
- **Alternatives**: thuộc tính `data-light-style` — tương đương, nhưng repo đã dùng class `.dark` nên dùng class cho nhất quán.

## R3. Bảng màu Paper (đề xuất, kiểm tương phản bằng test)
- Nền `--background #f6f1e7`, `--surface #efe8da`, `--muted/--accent #e8dfcc`, `--border/--input #d9cfba`, chữ `--foreground #2b2620`, `--muted-foreground #6b6354`, `--primary #2b2620` / `--primary-foreground #f6f1e7`, `--code #efe8da`, `--ring #a39a85`.
- Màu trạng thái giữ họ màu cũ nhưng đậm hơn một nấc để đạt ≥ 4.5:1 trên kem (working `#1d4ed8`, blocked `#b45309`, error `#b91c1c`, done `#15803d`); `--warn-*`, `--danger-bg`, `--diff-*` chỉnh sang tông ấm.
- `--term-bg/--term-fg` (Log) giữ tối như hiện tại; scrollbar thumb tối hơn nền kem, ≥ 3:1.
- Con số cuối chốt khi triển khai bằng test tương phản (mẫu `scrollbar.test.ts`).

## R4. Renderer có màu riêng
- **Mermaid**: `renderMermaid(code, dark)` chọn bảng màu theo `dark`; thêm variant vào cache key và `theme` key (`lastTheme`), palette paper khớp token.
- **Chart (vega)**: màu `mark/range/axis` hard-code theo `dark`; thêm nhánh paper.
- **Phát hiện**: hai renderer hiện chỉ phụ thuộc `[code, seen]` nên **không vẽ lại khi đổi theme** (lỗi có sẵn). Vì FR-004/edge case yêu cầu vẽ lại theo màu mới, thêm key biến thể giao diện (`dark`/`paper`/`light`) vào deps — sửa luôn cho đổi Light↔Dark.
- **Shiki**: dùng `github-light` + biến `--shiki-dark`; nền đã trong suốt (`.shiki` transparent) nên hợp nền kem; chỉ kiểm màu chữ đủ tương phản, chưa cần theme Shiki riêng.

## R5. Lưu trữ
- **Decision**: thêm `lightStyle` vào `partialize`; `merge` validate giá trị lạ → `'default'`. Không cần bump version migrate (field mới có mặc định).
- **Rationale**: edge case "giá trị không hợp lệ" và "người dùng cũ" (FR-005, FR-010).
