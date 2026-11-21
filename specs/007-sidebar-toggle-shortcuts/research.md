# Research: Phím tắt ẩn/hiện hai sidebar

## R1. Gắn phím ở đâu

- **Decision**: Module mới `src/lib/sidebarShortcuts.ts` gồm hàm thuần `matchSidebarShortcut(e, ctx)` (trả `'left' | 'right' | null`) và `installSidebarShortcuts()` gắn một listener `keydown` ở **capture phase** trên `window`; gọi từ `AppShell` trong `useEffect`.
- **Rationale**: Capture phase chạy trước handler của textarea/ô tìm kiếm, nên `preventDefault` + `stopPropagation` chặn được mọi hành vi mặc định (chèn ký tự, ⌘R tải lại trang) và không bị component con nuốt mất. Hàm thuần dễ test. Không nhét vào handler của `CommandDialog` vì handler đó ở bubble phase và trộn nhiều lệnh.
- **Alternatives considered**: thêm nhánh vào handler sẵn có trong `CommandDialog.tsx` (bubble phase, có thể bị chặn; khó test riêng); menu accelerator của Tauri (cần sửa Rust/menu, không chạy được trên `?mock`).

## R2. ⌘R và tải lại trang

- **Decision**: `preventDefault()` trên `keydown` của ⌘R.
- **Rationale**: Chromium và WKWebView đều bỏ qua phím tắt tải lại khi trang đã `preventDefault` sự kiện keydown. App không có menu Tauri nào gắn ⌘R. Tải lại không cần cho người dùng (constitution II: state UI dựng lại từ event log).

## R3. Khi nào bỏ qua

- **Decision**: Bỏ qua khi `e.repeat`, khi có Shift/Alt, khi modifier sai (macOS: phải là ⌘ không kèm Ctrl; nơi khác: Ctrl không kèm ⌘), hoặc khi đang có hộp thoại mở (`ui.cmdOpen` hoặc trong DOM có `[role="dialog"]` / `[role="alertdialog"]` với `data-state="open"`). Phải có `data-state="open"` vì thẻ duyệt quyền nằm trong hội thoại cũng dùng `role="alertdialog"` nhưng không phải hộp thoại modal; nếu tính nó thì phím tắt chết mỗi khi agent đang chờ duyệt (phát hiện khi kiểm bằng Playwright).
- **Rationale**: FR-006, FR-007, edge case hộp thoại. Kiểm DOM bao được mọi dialog Radix (tạo workspace, xác nhận xoá, rename…) mà không phải thêm state cho từng dialog.

## R4. Terminal của Log

- **Decision**: Không cần ngoại lệ cho terminal.
- **Rationale**: Log hiện là `<pre>` chỉ đọc (`TerminalView` trong `RightPanel.tsx`), không nhận phím, nên Ctrl+B/Ctrl+R không có gì để "để lại cho terminal". Edge case trong spec về terminal tự thoả: phím tắt chạy và không có ký tự nào bị gửi. Nếu sau này đổi sang terminal tương tác thì xem lại.

## R5. Focus khi ẩn cột đang có focus (FR-010)

- **Decision**: Trước khi đổi trạng thái, ghi nhớ `document.activeElement` có nằm trong `<aside>` sắp bị ẩn không. Nếu có, sau khi React cập nhật (`requestAnimationFrame`) focus vào ô nhập tin nhắn đang hiện (`textarea[id^="composer-"]`), không có thì focus `<main>` (đặt `tabIndex=-1`).
- **Rationale**: Khi `<aside>` bị gỡ khỏi DOM, focus rơi về `body`; chuyển về ô nhập là chỗ hợp lý nhất.

## R6. Hiển thị phím tắt

- **Decision**: Hằng `SHORTCUT_LABEL = { left: '⌘B', right: '⌘R' }` (macOS) / `'Ctrl+B'`, `'Ctrl+R'` (nơi khác) trong `sidebarShortcuts.ts`. Tooltip header hiện "Collapse sidebar" + `<Kbd>`; command palette thêm lệnh "Hide/Show sidebar" với `kbd`, và thêm `kbd` cho lệnh side panel có sẵn.
- **Rationale**: Các lệnh có sẵn trong palette ghi cứng '⌘N', '⌘T'; dùng hằng theo nền tảng cho hai lệnh mới, không đụng các lệnh cũ.
