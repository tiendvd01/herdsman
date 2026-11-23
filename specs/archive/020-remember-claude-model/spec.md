# Feature Specification — Ghi nhớ model Claude cho session mới

**Feature Branch** — `master`  
**Created** — 2026-11-23  
**Status** — Draft  
**Input** — “Ghi nhớ model khi được chọn, ghi nhớ cho tất cả session claude mới tạo sau luôn”

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dùng lại model đã chọn trên mọi session Claude mới (Priority: P1)

Người dùng đổi model trong khung chat của một session Claude. Từ đó, các session Claude mới trong Herdsman tự dùng model vừa chọn ngay từ lượt đầu, kể cả khi được tạo trong project khác hoặc sau khi mở lại ứng dụng.

**Why this priority** — Người dùng chỉ cần chọn model một lần để dùng cho các công việc mới.

**Independent Test** — Đổi model thành công trong một session Claude, tạo một session Claude mới trong cùng workspace và một session ở project khác, rồi xác nhận lượt đầu tiên của cả hai dùng model đã chọn. Lặp lại sau khi mở lại ứng dụng.

**Acceptance Scenarios**

1. **Given** một session Claude đang dùng model A, **When** người dùng chọn model B thành công trong khung chat, **Then** các session Claude tạo sau đó trong workspace hiện tại, workspace khác hoặc project khác đều dùng B từ lượt đầu tiên.
2. **Given** B là model đã ghi nhớ, **When** người dùng mở lại Herdsman rồi tạo session Claude, **Then** session mới dùng B từ lượt đầu và tên model hiển thị khớp với model thực sự dùng khi session sẵn sàng.
3. **Given** người dùng đã tạo một session với B, **When** họ chọn C thành công trong một session Claude khác, **Then** session Claude tạo tiếp theo dùng C và session đã tạo với B vẫn dùng B.
4. **Given** Herdsman đã ghi nhớ B, **When** người dùng tạo hoặc đổi model trong session Codex hoặc Echo, **Then** các session đó dùng quy tắc của loại agent tương ứng, và session Claude mới tiếp theo vẫn dùng B.

---

### User Story 2 - Tiếp tục tạo session khi lựa chọn chưa có hiệu lực hoặc model hết khả dụng (Priority: P2)

Người dùng có thể tiếp tục tạo hội thoại khi chưa từng chọn model, khi lần đổi model thất bại, hoặc khi Claude từ chối model đã lưu vì model đó không còn khả dụng.

**Why this priority** — Một lựa chọn model thất bại không nên làm gián đoạn việc bắt đầu công việc mới.

**Independent Test** — Dùng môi trường chưa có lựa chọn, môi trường từ chối lần đổi model và môi trường từ chối model đã lưu lúc tạo session. Kiểm tra model dùng cho lượt đầu và thông báo tương ứng.

**Acceptance Scenarios**

1. **Given** người dùng chưa từng đổi model Claude thành công trong Herdsman, **When** họ tạo session Claude mới, **Then** session dùng model mặc định hiện có của Claude.
2. **Given** Herdsman đã ghi nhớ B, **When** lần chọn C bị từ chối hoặc lỗi kết nối, **Then** ứng dụng báo lỗi và session Claude mới tiếp theo vẫn dùng B.
3. **Given** Herdsman đã ghi nhớ B nhưng Claude xác nhận B không còn khả dụng, **When** người dùng tạo session Claude mới, **Then** session dùng model mặc định của Claude nếu khả dụng, hiển thị model thực tế và báo lý do chuyển sang mặc định. B vẫn là lựa chọn đã ghi nhớ cho đến lần đổi thành công tiếp theo.

### Edge Cases

- Áp dụng cho mọi luồng bắt đầu hội thoại Claude mới trong Herdsman, kể cả session đầu tiên của workspace mới và hội thoại mới từ `/clear` khi lệnh đó khả dụng.
- Khi mở lại hoặc tiếp tục hội thoại cũ, session dùng lựa chọn riêng đã có của nó.
- Khi đổi model trong lúc agent đang xử lý hoặc chờ duyệt quyền, lượt đang chạy và yêu cầu quyền tiếp tục theo hành vi hiện có. Chỉ những lần đổi đã được xác nhận mới cập nhật lựa chọn ghi nhớ.
- Nếu session được tạo khi lần đổi model vẫn đang chờ xác nhận, session dùng lựa chọn đã xác nhận gần nhất tại thời điểm tạo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Herdsman MUST ghi nhớ model Claude gần nhất mà người dùng chủ động đổi thành công từ bộ chọn model trong khung chat. Model do Claude tự báo khi khởi động và lần đổi thất bại MUST NOT cập nhật lựa chọn ghi nhớ.
- **FR-002** — Lựa chọn ghi nhớ MUST áp dụng trên toàn ứng dụng, qua mọi project và workspace, và được giữ khi đóng rồi mở lại Herdsman.
- **FR-003** — Mọi session Claude bắt đầu một hội thoại mới trong Herdsman MUST dùng lựa chọn đã xác nhận tại thời điểm tạo ngay từ lượt đầu tiên. Khi model được xác định, tên hiển thị MUST khớp với model thực tế.
- **FR-004** — Lần đổi model MUST áp dụng cho session nơi người dùng thao tác theo hành vi hiện có. Các session khác đã tạo, kể cả hội thoại được mở lại hoặc tiếp tục, MUST giữ lựa chọn model riêng. Codex và Echo MUST tiếp tục áp dụng quy tắc model của loại agent tương ứng.
- **FR-005** — Khi chưa có lựa chọn ghi nhớ, session Claude mới MUST dùng quy tắc chọn model mặc định hiện có.
- **FR-006** — Khi Claude xác nhận model đã ghi nhớ không còn khả dụng, session mới MUST dùng model mặc định nếu khả dụng và thông báo cho người dùng về việc chuyển sang mặc định. Việc dùng model dự phòng MUST NOT ghi đè lựa chọn đã lưu.

### Key Entities *(include if feature involves data)*

- **Lựa chọn model Claude đã ghi nhớ** — Model gần nhất được người dùng đổi thành công, dùng chung cho các hội thoại Claude tạo mới trong Herdsman.
- **Model của session** — Model dùng cho hội thoại cụ thể. Khi bắt đầu hội thoại mới, Herdsman xác định giá trị ban đầu cho session đó.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Trong tất cả ca nghiệm thu tạo hội thoại Claude mới ở cùng workspace, workspace khác, project khác và sau khi mở lại ứng dụng, lượt đầu dùng đúng model đã ghi nhớ với 0 lần chọn lại.
- **SC-002** — Trong mỗi ca kiểm tra đổi mặc định, 100% session đã tạo trước đó giữ model riêng khi tiếp tục, và 100% session Codex và Echo trong ca kiểm tra giữ quy tắc hiện có.
- **SC-003** — Cả ba trường hợp chưa chọn model, đổi model thất bại và model đã lưu hết khả dụng đều cho kết quả như kịch bản nghiệm thu, với thông báo trong các trường hợp có lỗi.

## Assumptions

- “Tất cả session Claude mới” được hiểu là hội thoại Claude mới trên cùng một bản cài Herdsman, ở mọi project và workspace.
- Dùng bộ chọn model trong khung chat hiện có. Thao tác chọn lại mục đang dùng tiếp tục theo hành vi hiện có của bộ chọn. Chỉ lần đổi được xác nhận mới trở thành lựa chọn mặc định.
- Đặc tả này bổ sung phạm vi áp dụng cho session Claude tạo sau vào [đặc tả bộ chọn model](../005-chat-model-switcher/spec.md).
