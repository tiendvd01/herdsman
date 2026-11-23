# Research: Hiển thị % context và giới hạn

## 1. Lấy % context
- **Decision**: `query.getContextUsage({detail:'summary'})` → `percentage` (0–100).
- **Rationale**: SDK trả đúng % cửa sổ context hiện tại; `summary` không gọi API đếm token theo từng loại nên nhanh, đủ cho một con số.
- **Alternatives**: tự cộng `input+output` từ `turn_end` (hiện tại) — sai bản chất, không biết cửa sổ tối đa; chạy `'full'` — chậm, không cần.

## 2. Lấy hạn mức 5h / tuần
- **Decision**: `query.usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET({skipBehaviors:true})` → `rate_limits.five_hour|seven_day {utilization, resets_at}`; `rate_limits_available=false` (API key, Bedrock, Vertex) → ẩn chỉ báo.
- **Rationale**: trả đủ % và thời điểm đặt lại cho cả hai cửa sổ trong một lần gọi, gọi chủ động sau mỗi lượt.
- **Alternatives**: chỉ nghe `rate_limit_event` — chỉ phát khi trạng thái đổi/ngưỡng, thường không có số khi mới mở. Dùng làm dự phòng khi API thử nghiệm đổi/lỗi. Gọi endpoint claude.ai trực tiếp — vi phạm nguyên tắc V.
- **Rủi ro**: API được ghi rõ là không ổn định; mọi lỗi bị nuốt, tính năng suy giảm thành ẩn.

## 3. Cách chuyển số liệu lên UI
- **Decision**: một event `usage_snapshot` ghi vào event log sau mỗi `turn_end`.
- **Rationale**: theo nguyên tắc II (UI dựng lại từ event log), mở lại app có số gần nhất; thêm loại event không phá tương thích ngược.
- **Alternatives**: event `live` (không ghi log) — mất khi kết nối lại; kênh riêng — thêm giao thức không cần thiết.

## 4. Phạm vi hạn mức
- **Decision**: hạn mức là toàn app: UI lấy snapshot mới nhất (theo `ts`) từ bất kỳ session nào.
- **Rationale**: hạn mức thuộc tài khoản; mọi session cùng báo một giá trị nên chuyển session không làm đổi.

## 5. Dữ liệu cũ / đã đặt lại
- **Decision**: hạn mức quá `resets_at` mà chưa có số mới → `—`; cũ hơn 15 phút → thêm `~`.
- **Rationale**: đáp ứng FR-009 và edge case "đã đặt lại" mà không cần timer làm mới nền.

## 6. Engine khác
- **Decision**: `echo` và Codex không phát `usage_snapshot` → chỉ báo ẩn/`—`. Không sửa component khi thêm engine (nguyên tắc V).
