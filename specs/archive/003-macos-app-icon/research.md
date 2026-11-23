# Research: Icon app đúng chuẩn macOS

## R1. Kích cỡ chuẩn icon app macOS

- **Decision**: Khung 1024×1024, nền bo góc 824×824 đặt tại (100, 100), bán kính bo góc ≈ 185 px (tỉ lệ 22.5% như icon hiện tại: 224/1024 → 185/824). Bóng đổ nhẹ: lệch xuống ~10 px, blur ~10 px, đen ~30% độ đậm, nằm trong lề.
- **Rationale**: Đây là lưới icon app macOS từ Big Sur trở đi (Apple Design Resources). Icon theo lưới này có cùng kích cỡ nhìn thấy với app hệ thống trên Dock/Launchpad.
- **Alternatives considered**: Giữ tràn khung (là lỗi hiện tại); dùng squircle chính xác của Apple (phức tạp hơn, khác biệt khó thấy; spec đã chấp nhận bo góc tròn).

## R2. Sinh bộ icon từ SVG

- **Decision**: Dùng `pnpm tauri icon <svg>` (Tauri CLI 2 đã có, nhận SVG trực tiếp, render bằng resvg, có hỗ trợ filter bóng đổ). Chạy hai lần: bản có lề cho macOS/Linux, bản tràn khung vào thư mục tạm rồi chép `icon.ico`, `Square*Logo.png`, `StoreLogo.png`. Bỏ các thư mục `android/`, `ios/` mà CLI có thể sinh thêm (app không build mobile).
- **Rationale**: Không thêm dependency; CLI tạo đủ các cỡ của `.icns` (16→1024, kể cả @2x).
- **Alternatives considered**: `iconutil` + `sips` (chỉ có trên macOS, nhiều bước); sharp/resvg-js (thêm dependency).

## R3. Một nguồn cho icon và logo trong app

- **Decision**: File gốc `src/assets/herdsman-mark.svg` (nền tràn khung). Script `scripts/gen-icons.mjs` đọc phần nội dung bên trong `<svg>` của file gốc, bọc trong `<g transform="translate(100 100) scale(0.8046875)">` (824/1024) kèm filter bóng đổ, ghi ra `src-tauri/icons/icon.svg`, rồi gọi `tauri icon`.
- **Rationale**: Sửa thiết kế một chỗ rồi chạy `pnpm icons` là đồng bộ mọi nơi (FR-008).
- **Alternatives considered**: Giữ 2 file SVG sửa tay (dễ lệch); sinh logo từ icon có lề (logo trong app sẽ bị nhỏ, thừa lề).

## R4. Hiển thị logo trong app

- **Decision**: `HerdsmanMark` render `<img src={markUrl} alt="" aria-hidden draggable={false}>` với `markUrl` import từ file gốc (Vite trả về URL). Ô sidebar bỏ nền `bg-primary` và chữ màu theme; logo tự mang nền tối nên giữ đúng màu ở cả hai theme. Kích cỡ giữ `size-4` (16 px) như hiện tại.
- **Rationale**: Dùng đúng file gốc, không chép path vào JSX. Nền đen #09090B trên sidebar theme tối vẫn tách được nhờ sidebar có màu `surface` khác và chữ H trắng tương phản cao.
- **Alternatives considered**: SVG inline trong JSX (chép thiết kế lần hai, vi phạm FR-008); `?react` loader (cần plugin svgr, thêm dependency).

## R5. Favicon bản web

- **Decision**: Thêm `<link rel="icon" type="image/svg+xml" href="/src/assets/herdsman-mark.svg" />` vào `index.html`; Vite tự đóng gói khi build. Xoá `public/icon.svg` vì trùng và không được tham chiếu ở đâu.
- **Rationale**: Hiện `index.html` chưa khai báo favicon; trỏ về file gốc giữ một nguồn.
