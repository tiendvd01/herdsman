# Feature Specification: Xác nhận đã xem khi focus tab agent

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-24

**Status**: Draft

**Input**: Khi agent chạy xong, focus vào tab của agent tính là đã xem và chuyển trạng thái từ `done` về `idle`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem kết quả của agent (Priority: P1)

Khi chạy nhiều agent song song, tôi muốn tab tự bỏ dấu hiệu hoàn thành sau khi tôi mở lại phiên tương ứng để biết phiên nào còn kết quả chưa xem.

**Why this priority** — Người dùng có thể nhận ra phiên nào còn cần xem khi chuyển qua lại giữa các tab.

**Independent Test** — Cho hai agent hoàn thành ở hai tab nền, rồi mở một tab bằng chuột hoặc phím tắt và kiểm tra trạng thái cả hai tab.

**Acceptance Scenarios**

1. **Given** hai phiên ở trạng thái `done`, **When** tôi chọn tab của một phiên để đưa cuộc hội thoại đó ra trước, **Then** phiên đó chuyển sang `idle`, kết quả vẫn đọc được và phiên kia vẫn là `done`.
2. **Given** tab đã được chọn nhưng cửa sổ Herdsman đang ở nền khi agent hoàn thành, **When** tôi quay lại cửa sổ và thấy phiên đó đang mở, **Then** phiên chuyển từ `done` sang `idle`.
3. **Given** tôi đang xem một phiên khi agent hoàn thành, **When** kết quả xuất hiện, **Then** tab tự chuyển về `idle` và lượt đó được tính là đã xem.
4. **Given** tôi đã xem kết quả của lượt trước, **When** agent hoàn thành một lượt mới trong lúc tôi xem tab khác, **Then** tab báo `done` cho lượt mới và có thể được xác nhận lại.

### Edge Cases

- Rê chuột qua tab, nhìn thấy tab trong thanh tab hoặc chuyển focus bàn phím qua tên tab mà chưa mở cuộc hội thoại đều giữ `done`.
- Chọn lại tab đã được xác nhận giữ trạng thái `idle`. Mở tab đang `working`, `blocked` hoặc `error` giữ trạng thái tương ứng.
- Nếu agent hoàn thành trong lúc ứng dụng đóng, khi mở lại, phiên vẫn báo `done` cho đến khi người dùng chủ động mở hoặc chọn lại tab. Việc tự khôi phục tab khi khởi động chưa tính là đã xem.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Khi người dùng mở hoặc chọn lại phiên đang `done` trong cửa sổ Herdsman đang hoạt động, ứng dụng MUST chuyển riêng phiên đó sang `idle`. Áp dụng cho cả chuột và bàn phím. Việc quay lại cửa sổ đã mở với phiên đó đang được chọn cũng tính là đã xem. Nếu phiên đang hiển thị trong cửa sổ có focus khi lượt mới hoàn thành, ứng dụng MUST tự đánh dấu lượt đó là đã xem và hiển thị `idle`.
- **FR-002** — Ứng dụng MUST giữ `done` cho mỗi lượt hoàn thành thành công cho đến khi lượt đó được xác nhận theo FR-001. Tab ở nền, việc rê chuột, và việc tự khôi phục tab lúc khởi động đều giữ `done`.
- **FR-003** — Việc xác nhận MUST chỉ áp dụng cho phiên đang `done` và lượt vừa hoàn thành. Các phiên khác giữ trạng thái của chúng, còn lượt hoàn thành tiếp theo có thể báo `done` lại.
- **FR-004** — Ứng dụng MUST giữ nguyên kết quả và lịch sử hội thoại khi chuyển phiên về `idle`. Sau khi mở lại ứng dụng, lượt đã xem tiếp tục được tính là đã xem, còn lượt chưa xem tiếp tục báo `done` nếu phiên vẫn ở trạng thái hoàn thành.
- **FR-005** — Tiếng báo và thông báo hệ điều hành MUST tiếp tục tuân theo quy tắc và cài đặt thông báo hiện hành khi agent hoàn thành. Việc xác nhận đã xem chỉ thay đổi cách hiển thị trạng thái phiên.

### Key Entities

- **Phiên agent** — Phiên có tab riêng, trạng thái hiện tại và lịch sử hội thoại.
- **Lượt hoàn thành** — Kết quả thành công của một lượt trong phiên. Khi lượt còn chưa xem, tab báo `done`. Sau khi xác nhận, tab báo `idle` nếu agent đang rảnh.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Trong 10 lần mở hoặc chọn lại tab `done`, gồm thao tác bằng chuột, bàn phím và quay lại cửa sổ, cả 10 lần đều chuyển phiên tương ứng sang `idle` trong vòng 1 giây và vẫn xem được kết quả.
- **SC-002** — Trong kịch bản hai phiên hoàn thành, xác nhận một phiên để lại đúng một phiên `done`. Sau khi đóng rồi mở lại ứng dụng, phiên đã xem vẫn `idle` và phiên chưa xem vẫn `done`.
- **SC-003** — Trong một lượt kiểm tra cho mỗi trạng thái `working`, `blocked` và `error`, việc mở tab giữ đúng trạng thái ở cả ba lượt. Hai lượt hoàn thành liên tiếp ở tab nền được xác nhận riêng. Lượt hoàn thành trong tab đang xem tự về `idle` trong vòng 1 giây.

## Assumptions

- Cuộc hội thoại đang hiển thị trong cửa sổ Herdsman có focus được tính là đang xem. Việc phát lại lượt từ trước lúc khởi động giữ dấu chưa xem.
- Quy tắc giữ đèn `done` trong đặc tả tiếng báo hoàn thành được áp dụng đến lúc người dùng xác nhận đã xem. Tính năng dựa trên trạng thái phiên và cơ chế thông báo hiện có.
