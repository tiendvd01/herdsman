# Research: Thanh cuộn mảnh theo theme

## 1. Cách tạo thanh cuộn mảnh trên WKWebView (Tauri macOS)

- **Decision**: dùng pseudo-element `::-webkit-scrollbar*`; fallback `scrollbar-width: thin` + `scrollbar-color` chỉ khi trình duyệt không hỗ trợ `::-webkit-scrollbar` (`@supports not selector(...)`).
- **Rationale**: WebKit hỗ trợ đầy đủ `::-webkit-scrollbar` (độ dày, màu, bo góc, hover). Chromium ≥ 121 bỏ qua `::-webkit-scrollbar` nếu phần tử có `scrollbar-width`/`scrollbar-color`, nên không đặt hai thuộc tính chuẩn vô điều kiện.
- **Alternatives**: chỉ dùng `scrollbar-width: thin` (WebKit hỗ trợ không đồng đều, không có hover, không chỉnh được bo góc); bọc mọi vùng bằng Radix ScrollArea (phải sửa ~20 chỗ, vùng mới dễ quên — trái FR-007).

## 2. Độ dày

- **Decision**: rãnh 8px, thumb nhìn thấy 4px (viền trong suốt 2px + `background-clip: content-box`), bo tròn hoàn toàn, `min-height: 24px`.
- **Rationale**: ≤ 8px theo SC-002, giảm hơn nửa so với 15px mặc định; vùng bấm vẫn 8px nên dễ kéo.

## 3. Màu và tương phản (SC-003, ≥ 3:1)

Độ sáng tương đối WCAG, làm tròn:

| Token | Màu | so với nền chính | so với surface |
|-------|-----|------------------|----------------|
| Light thumb | `#909098` | 3.2 : 1 (`#ffffff`) | 3.0 : 1 (`#fafafa`) |
| Light hover | `#71717a` | 4.8 : 1 | 4.6 : 1 |
| Dark thumb | `#63636b` | 3.3 : 1 (`#09090b`) | 3.2 : 1 (`#111113`) |
| Dark hover | `#8b8b93` | 5.6 : 1 | 5.3 : 1 |

- **Decision**: dùng các màu trên, cùng tông zinc của app.
- **Alternatives**: dùng `--ring` (`#a1a1aa` / `#52525b`) có sẵn — chỉ đạt ~2.6 : 1, không đủ.

## 4. Vùng nền tối cố định (Log)

- **Decision**: `.bg-term-bg` ghi đè hai token sang bộ màu Dark.
- **Rationale**: `--term-bg` là `#09090b` ở cả hai theme; nếu dùng màu Light trên nền tối thì thumb `#909098` vẫn thấy nhưng hover `#71717a` bị chìm. Ghi đè theo class nền giữ quy tắc "màu theo nền" mà không cần biết component.

## 5. Vùng đang ẩn thanh cuộn

- **Decision**: giữ nguyên `[&::-webkit-scrollbar]:hidden` ở dải tab session; class tiện ích có độ đặc hiệu cao hơn selector toàn cục nên vẫn thắng.
