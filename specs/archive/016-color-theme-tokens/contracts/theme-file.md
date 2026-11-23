# Contract: File theme custom

**Vị trí**: `<data_dir>/themes/<tên>.json` (`data_dir` là thư mục dữ liệu app, hiện trong Settings → Appearance). Nạp lúc khởi động và mỗi lần mở Settings.

**Tối thiểu hợp lệ**:

```json
{ "background": "#fbf7ef", "foreground": "#2a2622" }
```

**Đầy đủ**: xem trường ở [data-model.md](../data-model.md) (`name`, `appearance`, `selection`, `ansi[16]`, `colors{}`).

**Hành vi**
- Vai trò không khai báo → suy ra từ `background`/`foreground`/`ansi`; có khai báo → dùng giá trị đó.
- Sáng/tối: `appearance` nếu có, không thì theo độ sáng `background`.
- Hiện ở Settings → Appearance: ô **Light theme** liệt kê theme sáng, ô **Dark theme** liệt kê theme tối.

**Lỗi** (theme bị bỏ qua, thông báo `file · trường · lý do` trong Settings, theme khác không bị ảnh hưởng)
- JSON hỏng; thiếu `background`/`foreground`; mã màu không phải `#rrggbb`; `ansi` không đủ 16; tên trùng `light`/`paper`/`dark`; file > 256 KB.

**Cảnh báo** (theme vẫn dùng được): khóa `colors` không thuộc sổ vai trò; cặp chữ–nền dưới 4.5:1.

**Dự phòng**: theme đang chọn mất/hỏng → dùng `light` (hoặc `dark`) có sẵn.

**Thêm màu mới cho mọi theme**: thêm một dòng vào sổ vai trò `src/theme/roles.ts` (`key`, `cssVar`, `derive`), chạy `pnpm theme:gen` (tự chạy ở dev/build); không sửa file theme nào.
