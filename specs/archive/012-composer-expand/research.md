# Research: Nút mở rộng ô chat

## Mở rộng tại chỗ hay mở hộp thoại riêng

- **Decision**: mở rộng tại chỗ (textarea cao lên trong ô chat).
- **Rationale**: giữ nguyên thanh công cụ (đính kèm, chế độ, model, gửi), không phải đồng bộ text giữa hai ô, không đổi focus/flow phím.
- **Alternatives**: Dialog toàn màn hình — phải nhân đôi thanh công cụ hoặc thiếu chức năng; cửa sổ riêng — quá nặng.

## Chiều cao khi mở rộng

- **Decision**: `65vh` cố định, cuộn bên trong.
- **Rationale**: cửa sổ mặc định 1440×900 → ~585px, hơn gấp đôi `max-h-60` (240px) của chế độ thường (SC-001); cửa sổ tối thiểu cao 600 → 390px, vẫn còn chỗ cho header và thanh công cụ.
- **Alternatives**: `flex-1` chiếm toàn bộ khung hội thoại — cần đổi layout SessionView, che hết hội thoại; kéo thả để đổi cỡ — phức tạp hơn yêu cầu.

## Esc khi mở rộng

- **Decision**: Esc thu nhỏ trước, không interrupt ở cùng lần nhấn.
- **Rationale**: Esc là cách thoát tự nhiên của trạng thái mở rộng; tránh interrupt agent ngoài ý muốn khi người dùng chỉ muốn thu nhỏ. Interrupt vẫn có qua nút và Esc lần sau.

## Icon

- **Decision**: `Maximize2` / `Minimize2` của lucide-react (mũi tên chéo), khớp ảnh tham chiếu.
