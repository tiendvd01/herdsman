# Data Model: Resize ô chat mở rộng

## `composerHeight` (UI preference, persist)
- **Nơi lưu**: `useUiStore` → localStorage key `herdsman-ui` (cùng chỗ `sidebarWidth`, `rightWidth`).
- **Kiểu**: số nguyên px. **Mặc định**: 300.
- **Giới hạn lưu**: `COMPOSER.min = 120` … `COMPOSER.max = 1200` (kẹp khi `set` và khi đọc từ localStorage; giá trị không hợp lệ → 300).
- **Giới hạn hiển thị (suy ra, không lưu)**: `effective = clamp(composerHeight, min, max(min, floor(0.8 * viewportHeight)))`.
- **Chuyển trạng thái**: kéo tay nắm → `setComposerHeight(px)`; double-click/Enter trên tay nắm → 300; chế độ mở rộng bật/tắt (`expanded`, state cục bộ của 012) không đổi giá trị lưu.
- **Vòng đời**: không gắn session; không đụng event log/transcript.
