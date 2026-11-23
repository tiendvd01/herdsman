# Research: Settings — Appearance

## R1. Cách đổi font toàn app
- **Decision**: ghi đè `--font-sans` / `--font-mono` bằng inline style trên `<html>`.
- **Rationale**: Tailwind v4 `@theme` khai báo hai biến này ở `:root`, mọi `font-sans`/`font-mono`, `body` và `.prose-hs code` đều đọc qua `var(...)`. Inline style thắng `:root` → một lần set là cả app đổi, không re-render React.
- **Alternatives**: class theo từng font (phải sinh CSS cho mọi font); context React (re-render toàn cây).

## R2. Danh sách font
- **Cập nhật**: người dùng thấy preset quá ít → lấy toàn bộ font family cài trên máy qua lệnh Tauri `font_families` (crate `core-text`, `CTFontManagerCopyAvailableFontFamilyNames`, bỏ family ẩn bắt đầu bằng `.`). Font code lọc monospace ở frontend (đo canvas `i` vs `W`). Picker có ô tìm kiếm. Preset cũ chỉ còn là fallback khi danh sách rỗng.
- **Decision ban đầu**: preset cố định. UI: Geist (mặc định), System (SF Pro), Inter, Helvetica Neue, Avenir Next. Code: Geist Mono (mặc định), SF Mono, Menlo, Monaco, JetBrains Mono, Fira Code, Cascadia Code. Ẩn font không có trên máy (trừ font đóng gói).
- **Rationale**: app chạy offline, không tải font mạng; WebKit không có API liệt kê font hệ thống.
- **Alternatives**: Local Font Access API (không có trong WebKit); lệnh Rust liệt kê font (thêm phức tạp, ngoài phạm vi).

## R3. Phát hiện font có trên máy
- **Decision**: đo chiều rộng chuỗi mẫu bằng canvas với `"<font>", monospace` và `"<font>", serif`, so với chỉ generic; khác ở ít nhất một → có font.
- **Rationale**: `document.fonts.check()` trả `true` cho font không tồn tại trên WebKit.

## R4. Bỏ nút theme ngoài header
- **Decision**: bỏ `ThemeToggle` ở `TopBar` và header workspace; giữ ⌘⇧L và lệnh "Toggle theme"; Settings mở bằng nút footer, ⌘, và command palette.
- **Rationale**: đúng yêu cầu; ⌘, là quy ước macOS cho Preferences.

## R5. Mermaid/Chart
- **Decision**: đọc `getComputedStyle(document.documentElement).getPropertyValue('--font-sans')` lúc render; Mermaid khoá cache theo font.
- **Rationale**: thư viện vẽ SVG cần tên font cụ thể, không theo CSS var sau khi render.
