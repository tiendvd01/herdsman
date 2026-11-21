# Research: Bộ mã màu theo tên

## R1. Cấu trúc tham khảo từ Herdr
Đọc `~/.config/herdr-app/themes/*.json` và `AGENTS.md`: file theme = `{background, foreground, selection, cursor?, ansi[16], colors?{vai trò→hex}}`; panel dùng tên vai trò cố định (canvas, chrome, surface, popover, raised, hover, selected, border, input, muted, dim, accent, solid, working, blocked, done, idle, unknown); vai trò không khai báo được suy ra; theme sáng/tối dùng chung tên; thả file vào `themes/` là có theme mới.
- **Decision**: lấy nguyên tắc (màu gốc + `colors` ghi đè + suy ra + cùng tập tên + một file một theme + thả file là có theme), không chép nguyên tập tên.
- **Why**: Herdsman theo shadcn minimal (BR 3.2) với bộ biến sẵn có (`--background`, `--surface`, `--muted`, `--primary`…) đang dùng trong hàng trăm class; giữ tên đó thì không phải sửa component.
- **Alternatives**: đổi sang tên Herdr (`chrome`, `raised`, `solid`…) — phải đổi toàn bộ class Tailwind, rủi ro hồi quy thị giác lớn mà không thêm giá trị.

## R2. Tên khóa trong file theme
- **Decision**: khóa trong `colors` = tên CSS var hiện tại bỏ `--`, đổi `-` thành `_`; riêng trạng thái dùng tên Herdr: `working`, `blocked`, `error`, `done`, `idle` (ánh xạ tới `--st-*`). Bảng alias Herdr ↔ Herdsman nằm trong `data-model.md`.
- **Alternatives**: hỗ trợ cả hai bộ tên (alias) — thêm phức tạp, hoãn.

## R3. Sổ vai trò là nguồn duy nhất
- **Decision**: `src/theme/roles.ts` là mảng `{key, cssVar, derive(base, ctx)}`; từ đó sinh: (a) bảng màu runtime, (b) validate khóa file theme, (c) `theme-roles.css` (`@theme inline { --color-x: var(--x) }`).
- **Rationale**: Tailwind v4 cần `--color-*` biết lúc build nên không thể chỉ khai báo ở runtime; sinh file bằng script giữ đúng "thêm màu = sửa một chỗ". Test so sánh file sinh với sổ vai trò để không bao giờ lệch; `predev`/`prebuild` tự sinh.
- **Alternatives**: viết tay khối `@theme inline` (lại là chỗ thứ hai phải sửa); plugin Vite ảo (khó với `@import` của Tailwind, khó debug).

## R4. Suy ra màu mặc định
- **Decision**: `derive` dùng phép trộn màu trong sRGB từ `background`/`foreground` (ví dụ `border = mix(bg, fg, 12%)`, `muted_foreground = mix(bg, fg, 55%)`, `surface = mix(bg, fg, 2%)`); trạng thái dùng ansi (`working`=ansi4, `blocked`=ansi3, `error`=ansi1, `done`=ansi2, `idle`=ansi8) nếu có, không thì bảng mặc định theo sáng/tối.
- **Rationale**: theme custom chỉ cần vài màu gốc vẫn đọc được (SC-003). Ba theme có sẵn **khai báo đầy đủ** giá trị hiện tại nên không phụ thuộc vào công thức (FR-010).
- Sáng/tối: suy từ độ sáng của `background` (như Herdr), cho phép khóa tùy chọn `"appearance"` ghi đè.

## R5. Nạp theme custom
- **Decision**: lệnh Tauri `theme_files` trả `[{file, text}]` (đọc thô `*.json` trong `<data_dir>/themes/`, tạo thư mục nếu thiếu, giới hạn 256 KB/file); TS parse và validate. Nạp lúc khởi động và mỗi lần mở Settings (react-query `refetchOnMount`).
- **Rationale**: validate một chỗ cho cả built-in lẫn custom; Rust không cần biết định dạng. `?mock` trả mảng rỗng.
- **Alternatives**: plugin `fs` của Tauri từ frontend — cần mở capability fs rộng hơn; theo dõi file realtime (watcher) — ngoài phạm vi, nạp lại khi mở Settings là đủ.

## R6. Mô hình lựa chọn và migrate
- **Decision**: giữ `theme: system|light|dark` (chế độ), thay `lightStyle` (spec 015) bằng `lightTheme: string` (mặc định `light`) và `darkTheme: string` (mặc định `dark`). Migrate v3→v4: `lightStyle==='paper'` → `lightTheme='paper'`. Id không tồn tại → mặc định cùng chiều sáng/tối; ⌘⇧L và System không đổi.
- **Why**: khớp US4 mà không đổi hành vi spec 010/015.

## R7. Áp màu và chống chớp
- **Decision**: `apply.ts` ghi từng `--var` bằng `style.setProperty` trên `<html>` và đặt class `dark` theo appearance của theme; `main.tsx` gọi một lần đồng bộ trước `createRoot` với theme đọc từ `localStorage` (nếu lỗi → built-in), rồi `useThemeEffect` giữ đồng bộ sau đó. Khi đổi theme, xóa các var không còn trong bảng.
- **Alternatives**: giữ class `.paper`/`.dark` trong CSS — quay lại nhiều chỗ phải sửa tay.

## R8. Mermaid / Chart / Shiki / Log / scrollbar
- Mermaid và vega lấy màu từ bảng đã giải (`useThemeColors()`), khóa cache theo id theme; hex gõ tay bị xóa (hiện chỉ có trong hai file này).
- Shiki giữ `github-light`/`github-dark` chọn theo appearance (nền trong suốt); ngoài phạm vi tạo theme code riêng.
- Vùng Log dùng vai trò `term_bg`/`term_fg`; scrollbar dùng `scrollbar_thumb(_hover)`; cả hai khai báo trong từng theme.

## R9. Kiểm tra tương phản
- **Decision**: hàm `contrastReport(resolved)` kiểm các cặp chữ–nền chính (foreground/muted_foreground/trạng thái trên background/surface/muted, primary_foreground/primary, warn, diff). Test: theme có sẵn phải đạt ≥ 4.5:1 (lỗi); theme custom chỉ cảnh báo trong Settings.
