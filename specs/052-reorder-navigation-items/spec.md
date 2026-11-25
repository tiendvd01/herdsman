# Feature Specification: Sắp xếp lại tab, workspace và project

**Feature Branch**: `master`

**Created**: 2026-11-25

**Status**: Ready for planning

**Input**: “Làm tính năng reorder các tab, reorder các workspace, projects”

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sắp xếp các tab trên thanh tab (Priority: P1)

Là người dùng Herdsman, tôi muốn đặt các tab đang dùng cạnh nhau để chuyển qua lại nhanh khi làm việc.

**Why this priority** — Người dùng chuyển tab nhiều lần trong một phiên làm việc.

**Independent Test** — Mở tab session, terminal, file và diff, rồi di chuyển từng loại tab đến vị trí mong muốn.

**Acceptance Scenarios**

1. Khi thanh tab hiển thị session, terminal, file và diff, người dùng có thể kéo mỗi tab qua các loại tab khác đến vị trí đầu, giữa hoặc cuối. Các tab còn lại giữ thứ tự tương đối, tab đang chọn và nội dung đang xem được giữ nguyên.
2. Khi người dùng dùng bàn phím để di chuyển một tab, kết quả giống thao tác kéo thả và tiêu điểm vẫn ở tab vừa di chuyển.
3. Khi người dùng đổi workspace rồi quay lại hoặc mở lại ứng dụng, các tab còn hiển thị trong workspace trở về thứ tự đã lưu. Tab file hiện diện ở hai workspace có thể ở hai vị trí khác nhau.

---

### User Story 2 - Sắp xếp workspace trong project (Priority: P2)

Là người dùng có nhiều workspace, tôi muốn đưa các workspace cần dùng lên những vị trí dễ tìm trong project.

**Why this priority** — Thứ tự do người dùng chọn giúp tìm đúng công việc trong project có nhiều workspace.

**Independent Test** — Tạo ba workspace trong một project, đặt mục cuối lên đầu rồi mở lại ứng dụng.

**Acceptance Scenarios**

1. Khi người dùng chuyển một workspace trong danh sách của project, thanh bên hiển thị thứ tự mới và giữ nguyên project chứa workspace, workspace đang mở và các session của nó.
2. Khi người dùng thả workspace vào project khác, hệ thống bỏ thao tác và giữ thứ tự cũ của cả hai project.
3. Khi người dùng mở lại ứng dụng, thứ tự workspace trong từng project khớp với thứ tự đã lưu.

---

### User Story 3 - Sắp xếp project ở thanh bên (Priority: P3)

Là người dùng làm việc trên nhiều project, tôi muốn đặt project ưu tiên lên trên để truy cập nhanh.

**Why this priority** — Thứ tự project ổn định giúp người dùng tìm lại công việc khi chuyển repo.

**Independent Test** — Sắp xếp ba project trong thanh bên rồi mở lại ứng dụng để so sánh thứ tự.

**Acceptance Scenarios**

1. Khi người dùng di chuyển một project, thanh bên hiển thị project ở vị trí đích, giữ nguyên thứ tự workspace trong project, mục đang chọn và trạng thái mở hoặc thu gọn của project.
2. Khi mở lại ứng dụng, danh sách project khớp với thứ tự đã lưu.

### Edge Cases

- Danh sách rỗng hoặc có một mục vẫn dùng được như bình thường. Di chuyển về vị trí cũ, hủy thao tác hoặc thả ngoài danh sách hợp lệ giữ nguyên thứ tự.
- Nếu mục đang kéo hoặc vị trí đích biến mất trong lúc thao tác, hệ thống hủy thao tác và hiển thị danh sách cập nhật.
- Tab mới hoặc xuất hiện lại sau khi rời thanh tab, workspace mới và project mới nằm cuối danh sách đã sắp xếp thủ công. Khi xóa một mục, các mục còn lại giữ thứ tự tương đối.
- Nếu lưu thứ tự thất bại, ứng dụng khôi phục thứ tự hợp lệ đã lưu gần nhất, báo lỗi và cho phép thử lại. Nếu ứng dụng thoát giữa lúc lưu, lần mở sau hiển thị trọn vẹn thứ tự cũ hoặc thứ tự mới. Agent và terminal đang chạy tiếp tục hoạt động.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Người dùng phải có thể kéo thả tab session, terminal, file và diff tới bất kỳ vị trí nào giữa các tab đang hiển thị trên cùng thanh tab. Mỗi workspace có thứ tự thanh tab riêng.
- **FR-002** — Người dùng phải có thể kéo thả workspace trong danh sách của project chứa nó. Việc chuyển workspace sang project khác nằm ngoài phạm vi.
- **FR-003** — Người dùng phải có thể kéo thả project trong danh sách project của thanh bên.
- **FR-004** — Cả ba danh sách phải chỉ rõ vị trí chèn hợp lệ khi kéo và hỗ trợ thao tác tương đương bằng bàn phím. Sau khi di chuyển bằng bàn phím, tiêu điểm phải theo mục vừa di chuyển. Mọi nhãn và thông báo do tính năng cung cấp dùng tiếng Anh.
- **FR-005** — Khi hoàn tất thao tác, giao diện phải hiển thị thứ tự mới, giữ thứ tự tương đối của các mục còn lại, giữ mục đang chọn và giữ nội dung đang xem. Việc đổi thứ tự chỉ thay đổi vị trí hiển thị. Quy tắc vòng đời của tab và trạng thái runtime của session hoặc terminal tiếp tục được áp dụng.
- **FR-006** — Ứng dụng phải lưu thứ tự project, thứ tự workspace theo project và thứ tự tab theo workspace trên máy hiện tại. Sau khi chuyển ngữ cảnh hoặc mở lại ứng dụng, thứ tự đã lưu phải được áp dụng cho các mục tương ứng còn hiển thị theo quy tắc hiện hành.
- **FR-007** — Danh sách chưa từng được sắp xếp thủ công phải tiếp tục dùng thứ tự hiện hành. Danh sách đã sắp xếp thủ công phải thêm mục mới hoặc mục xuất hiện lại vào cuối và giữ thứ tự tương đối khi loại mục đã biến mất.
- **FR-008** — Khi hủy, thả sai phạm vi hoặc mục di chuyển hay vị trí đích biến mất, ứng dụng phải bỏ thao tác. Khi lưu thất bại hoặc ứng dụng thoát giữa lúc lưu, thứ tự hiển thị phải tuân theo quy tắc khôi phục trong Edge Cases.

### Key Entities *(include if feature involves data)*

- **Thứ tự tab** — Vị trí hiển thị của các tab session, terminal, file và diff trong một workspace.
- **Thứ tự workspace** — Vị trí của các workspace trong danh sách của project chứa chúng.
- **Thứ tự project** — Vị trí của các project trong thanh bên của Herdsman trên máy hiện tại.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Với mỗi loại danh sách có ít nhất ba mục, 100% thao tác thử đưa mục tới đầu, giữa và cuối bằng chuột hoặc bàn phím cho đúng thứ tự. Mục đang chọn và nội dung đang xem được giữ trong mọi lần thử.
- **SC-002** — Trong 10 lần thử đổi workspace rồi quay lại và 10 lần thử mở lại ứng dụng, thứ tự của các mục còn hiển thị khớp với thứ tự đã lưu ở cả ba loại danh sách.
- **SC-003** — Ít nhất 9 trong 10 người dùng thử lần đầu sắp xếp đúng một mục ở mỗi loại danh sách trong vòng 60 giây mà không cần hướng dẫn trực tiếp.
- **SC-004** — Trong các lần thử hủy, thả sai phạm vi, mất mục đích và thoát ứng dụng giữa lúc lưu, không có mục nào bị chuyển sang danh sách khác, bị lặp hoặc bị mất vì thao tác sắp xếp. Session và terminal đang chạy tiếp tục hoạt động.

## Assumptions

- “Tab” chỉ các mục trên thanh tab làm việc hiện có của workspace, gồm session, terminal, file và diff. Phạm vi sắp xếp tab file là từng thanh tab của workspace, kể cả khi cùng file hiển thị ở nhiều workspace.
- Thứ tự là tùy chọn hiển thị cục bộ. Đồng bộ giữa các máy, sắp xếp tự động và mở lại các tab đã đóng nằm ngoài phạm vi.
