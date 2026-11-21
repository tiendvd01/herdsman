# Research: Giao diện gọn hơn và zoom chữ / giao diện

## R1. Cách zoom toàn giao diện

- **Decision**: Trong Tauri dùng `getCurrentWebview().setZoom(factor)` (zoom gốc của WKWebView, như ⌘+ của Safari). Ngoài Tauri (dev `?mock`) đặt `document.documentElement.style.zoom = factor`.
- **Rationale**: Zoom gốc co giãn mọi thứ (px cứng, inline style, SVG Mermaid/chart, canvas) mà không phải sửa từng component; `innerWidth`, `clientX` và kích thước phần tử cùng hệ toạ độ nên logic kéo sidebar (004) và `layoutWidths` không cần sửa. Không reload trang nên không mất state.
- **Alternatives**:
  - Đổi `font-size` của `<html>` (scale rem): chỉ ăn các giá trị rem; ~125 lớp `*-[Npx]`, độ rộng sidebar và inline style phải đổi hết sang rem → nhiều sửa, dễ sót.
  - CSS `zoom` trên `<html>` cho cả Tauri: WebKit tính `clientX` khác hệ với kích thước đã zoom → phải chia hệ số ở mọi chỗ đo chuột. Chỉ chấp nhận làm fallback xem trước.
  - `zoomHotkeysEnabled` của Tauri: không nhớ giá trị, không có chỉ báo, không có bậc cố định.

## R2. Bậc zoom và cỡ chữ

- **Decision**: Zoom: `[0.8, 0.9, 1, 1.1, 1.2, 1.35, 1.5]`, mặc định 1. Cỡ chữ nội dung: bước nguyên −2…+4 (mỗi bước 1px), mặc định 0. Giá trị lưu ngoài danh sách → bậc gần nhất; không phải số → mặc định.
- **Rationale**: Theo FR-005/FR-009; bậc cố định giúp ⌘0 / đặt lại rõ ràng và test được.

## R3. Thu gọn giao diện

- **Decision**:
  - `@theme` trong `globals.css`: `--spacing: 0.225rem` (−10%), `--text-xs: 11px`, `--text-sm: 12.5px`, `--text-base: 14px`, `--text-lg: 16px`; body 13px. Bo góc `--radius` 6px → 5px.
  - Quy đổi px cứng: chữ 20→18, 18→16, 15→14, 14→13, 13→12, 12.5→12, 12→11.5, 11.5→11, 11→11, 10→11 (giữ ≥ 11px, FR-003). Chiều cao cố định viết px (h-[30px], h-[26px]…): nhân 0.9, làm tròn, không dưới 24px cho vùng bấm. Các px khoảng cách lẻ (p-[3px], ml-[15px]…) không đụng — thuộc phạm vi spec 009.
  - Sidebar 004: `LEFT {min 184, max 440, def 232}`, `RIGHT {min 256, max 660, def 308, wide 504}`; `MAIN_MIN` giữ 400.
- **Rationale**: Gom phần lớn thay đổi vào token gốc nên toàn app nhỏ đều một tỉ lệ (US1-AS1); px cứng đổi theo một bảng duy nhất để nhất quán. Đo SC-001 bằng Playwright (số hàng sidebar, số dòng hội thoại trước/sau ở 1440×900).
- **Alternatives**: Chỉ đặt zoom mặc định 90% — đơn giản nhưng chữ nhỏ thành 10–11px, vi phạm FR-003 ở vài chỗ, và "100%" không còn là mặc định.

## R4. Cỡ chữ nội dung tách khỏi zoom

- **Decision**: Biến `--content-step` (px) trên `<html>`. Utility trong `globals.css`: `.text-content { font-size: calc(13px + var(--content-step)) }`, `.text-content-code { font-size: calc(12px + var(--content-step)) }`. Áp cho `Markdown` (`prose-hs`), `CodeBlock`, `ToolCard`, `Diff`, `Mermaid` source, `PermissionCard` pre, composer textarea, Files và Log trong `RightPanel`. Các cỡ tương đối trong `prose-hs` (h1–h3 dùng `em`) tự theo. Code inline trong prose: `0.92em`.
- **Rationale**: Không đụng khung giao diện (FR-010); zoom gốc nhân thêm lên trên → cộng dồn đúng như US3-AS4.

## R5. Phím tắt

- **Decision**: Zoom: ⌘= và ⌘+ (Shift+Equal), ⌘− (Minus), ⌘0 (Digit0). Cỡ chữ: ⌥⌘=, ⌥⌘−, ⌥⌘0. Nhận theo `e.code` (Equal / Minus / Digit0 / NumpadAdd / NumpadSubtract / Numpad0) để không phụ thuộc layout và vì ⌥ đổi `e.key` trên macOS. Listener `keydown` capture phase, `preventDefault` + `stopPropagation`. Cho phép phím lặp (giữ phím → đổi từng bậc tới giới hạn). Không chạy khi `ctrlKey` trên macOS. Vẫn chạy khi hộp thoại mở (zoom là thao tác hiển thị, không gây tác dụng phụ). Ngoài macOS: Ctrl thay ⌘, Alt thay ⌥.
- **Rationale**: ⌘⇧+ trùng ⌘+ trên bàn phím US (⌘+ = ⌘⇧=) nên cỡ chữ dùng ⌥; đã cập nhật spec FR-011.

## R6. Menu macOS

- **Decision**: Trong `setup`, lấy `Menu::default(handle)`, tìm submenu "View", thêm separator + `MenuItem` `zoom_in` (accelerator `CmdOrCtrl+=`), `zoom_out` (`CmdOrCtrl+-`), `zoom_reset` (`CmdOrCtrl+0`); `app.set_menu`; `on_menu_event` emit `"ui-zoom"` với payload `"in" | "out" | "reset"`. Frontend `listen("ui-zoom")` gọi cùng hàm với phím tắt. Khi accelerator của menu bắt phím, webview không nhận `keydown` nên không bị đổi hai lần.
- **Rationale**: FR-014; giữ nguyên menu Edit mặc định (cần cho copy/paste trong WKWebView).

## R7. Không nháy cỡ mặc định

- **Decision**: Trong `main.tsx`, trước `createRoot().render`, đọc state đã lưu (`useUiStore.getState()` sau khi persist hydrate đồng bộ từ localStorage) và gọi `applyContentStep` (đồng bộ) + `await applyZoom` (IPC nhanh). Sau đó store subscribe áp dụng mỗi lần đổi.
- **Rationale**: SC-003. Trang chưa render gì cho tới khi zoom xong, nên không có khung nào ở cỡ mặc định.

## R8. Chỉ báo mức zoom

- **Decision**: Một phần tử nổi nhỏ giữa trên vùng hội thoại (`role="status"`, `aria-live="polite"`), hiện "110%" hoặc "Chữ 14px", tự ẩn sau 1,5 s; tại giới hạn thêm "(tối đa)" / "(tối thiểu)". Dùng toast có sẵn nếu hợp, không thì một component `ZoomIndicator` nhỏ trong `AppShell`.
