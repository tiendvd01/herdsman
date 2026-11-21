# Data Model: Icon app

Không có dữ liệu runtime. Các "thực thể" là file ảnh trong repo.

| Thực thể | File | Sinh từ | Quy tắc |
|---|---|---|---|
| Thiết kế gốc | `src/assets/herdsman-mark.svg` | Viết tay | viewBox 0 0 1024 1024; nền tối bo góc tràn khung; chữ H trắng; chấm #4ADE80 trên, #FBBF24 dưới. Nguồn duy nhất. |
| Icon macOS (vector) | `src-tauri/icons/icon.svg` | Script, từ thiết kế gốc | Nền 824×824 tại (100,100); lề trong suốt; bóng đổ chỉ nằm trong lề. Không sửa tay. |
| Bộ icon macOS/Linux | `icon.icns`, `icon.png`, `32x32.png`, `64x64.png`, `128x128.png`, `128x128@2x.png` | `tauri icon` từ icon macOS | Mọi cỡ có lề trong suốt. |
| Bộ icon Windows | `icon.ico`, `Square*Logo.png`, `StoreLogo.png` | `tauri icon` từ thiết kế gốc | Tràn khung (Windows không dùng lưới macOS). |
| Logo trong app | `HerdsmanMark` (Sidebar) + favicon | Import trực tiếp thiết kế gốc | Không có bản sao thiết kế. |

Luồng cập nhật: sửa thiết kế gốc → `pnpm icons` → commit các file sinh ra.
