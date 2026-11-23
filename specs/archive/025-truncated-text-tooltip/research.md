# Research

## Kiểm tra chữ bị cắt

**Decision** — So sánh kích thước cuộn và kích thước hiển thị tại thời điểm mở tooltip.

**Rationale** — Cách này hỗ trợ cả ellipsis và giới hạn số dòng, sử dụng kích thước mới nhất sau khi người dùng thay đổi bố cục.

**Alternatives considered** — Đếm ký tự thiếu chính xác với phông chữ và chiều rộng khác nhau. Theo dõi kích thước liên tục làm tăng số observer.

## Vị trí tooltip

**Decision** — Dùng Radix Tooltip và bật ngắt dòng với chiều rộng tối đa theo cửa sổ.

**Rationale** — Portal cho phép tooltip vượt khỏi vùng cuộn, còn cơ chế định vị xử lý các mép cửa sổ.

**Alternatives considered** — Tooltip `title` phụ thuộc thời gian hiển thị và bố cục do hệ điều hành quyết định.
