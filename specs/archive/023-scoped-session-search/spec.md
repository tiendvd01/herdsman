# Feature Specification: Tìm session theo phạm vi và menu lệnh

**Feature Branch** `master` (nhánh hiện tại)

**Created** 2026-11-23

**Status** Draft

**Input** Tìm trong mọi session, trong project hoặc workspace hiện tại, và chọn lệnh qua các tab như ảnh tham chiếu.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tìm session theo phạm vi (Priority: P1)

Tôi muốn tìm lại một hội thoại bằng tiêu đề hoặc nội dung, rồi giới hạn kết quả theo project hoặc workspace đang làm việc.

**Why this priority** Việc thu hẹp phạm vi giúp phân biệt các hội thoại dùng chung từ khóa.

**Independent Test** Tạo ba session cùng khớp một từ khóa, lần lượt ở workspace hiện tại, workspace khác cùng project và project khác. Chuyển qua ba phạm vi và mở một kết quả.

**Acceptance Scenarios**

1. **Given** ba session cùng khớp từ khóa ở ba vị trí trên, **When** tôi tìm ở phạm vi toàn bộ, **Then** cả ba session xuất hiện kèm tên project và workspace.
2. **Given** truy vấn trên, **When** tôi chuyển sang phạm vi project rồi workspace, **Then** truy vấn được giữ nguyên và danh sách còn lần lượt hai rồi một session.
3. **Given** một kết quả thuộc workspace đã lưu trữ, **When** tôi chọn kết quả, **Then** Herdsman mở đúng hội thoại bằng luồng mở lại session hiện có.

---

### User Story 2 - Điều hướng và chạy lệnh qua các tab (Priority: P2)

Tôi muốn mở nhanh project, workspace, thao tác hoặc cài đặt từ cùng một menu tìm kiếm.

**Why this priority** Các tab giúp thu hẹp danh sách khi tôi đã biết mình đang tìm loại mục nào.

**Independent Test** Mở menu bằng ⌘K, duyệt các tab, mở một workspace và chạy một lệnh bằng bàn phím.

**Acceptance Scenarios**

1. **Given** menu vừa mở và ô tìm kiếm trống, **When** tôi xem tab All, **Then** menu hiển thị nhóm workspace gần đây nếu có và các mục khả dụng theo nhóm.
2. **Given** một project và một workspace có cùng tên, **When** tôi nhập tên đó rồi lần lượt chọn Projects và Workspaces, **Then** mỗi tab chỉ hiện mục đúng loại và chọn mục sẽ mở đúng đích.
3. **Given** một từ khóa khớp lệnh thao tác và mục cài đặt, **When** tôi đổi giữa Actions và Settings, **Then** mỗi tab chỉ hiện kết quả thuộc nhóm tương ứng.
4. **Given** một lệnh khả dụng đang được chọn bằng phím mũi tên, **When** tôi nhấn Enter, **Then** menu kích hoạt lệnh một lần theo hành vi và xác nhận vốn có của lệnh. Nhấn Escape đóng menu mà không kích hoạt mục đang chọn.

### Edge Cases

- Khi chưa chọn project hoặc workspace, phạm vi tương ứng bị vô hiệu hóa và có giải thích. Khi không có workspace, mặc định dùng project hiện tại nếu có, nếu không dùng toàn bộ.
- Nếu phạm vi đang áp dụng mất hiệu lực khi menu mở, hiển thị lời nhắc chọn phạm vi hợp lệ trước khi tìm tiếp.
- Truy vấn rỗng hoặc chỉ có khoảng trắng hiển thị các mục duyệt nhanh theo tab. Một truy vấn không có kết quả hiển thị trạng thái rỗng theo tab và phạm vi đã chọn.
- Khi đổi truy vấn hoặc phạm vi nhanh, chỉ hiển thị kết quả thuộc lựa chọn mới nhất. Khi tìm kiếm gặp lỗi, hiển thị trạng thái lỗi riêng.
- Đóng Herdsman khi đang tìm kiếm không làm gián đoạn agent hoặc thay đổi lịch sử hội thoại.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** Menu lệnh hiện có phải mở được bằng ⌘K và nút tìm kiếm ở sidebar. Menu phải có một ô tìm kiếm và hàng tab All, Workspaces, Projects, Actions, Settings với tab đang chọn hiển thị rõ.
- **FR-002** Tab All phải cung cấp ba phạm vi tìm session gồm toàn bộ session, project hiện tại và workspace hiện tại. Phạm vi áp dụng cho kết quả session. Project và workspace hiện tại được xác định theo màn hình đang mở và phải hiện tên khi dùng làm phạm vi. Phạm vi mặc định là workspace hiện tại khi có.
- **FR-003** Tìm kiếm phải khớp tiêu đề hoặc nội dung hội thoại mà Herdsman có quyền hiển thị, gồm session đang chạy, đã kết thúc và session trong workspace đã lưu trữ. Phạm vi project gồm mọi workspace trực thuộc. Phạm vi workspace gồm các session thuộc đúng workspace. Hội thoại Claude có thể tìm được từ trước vẫn truy cập được ở phạm vi toàn bộ và chỉ xuất hiện trong phạm vi hẹp nếu xác định được project hoặc workspace tương ứng.
- **FR-004** Mỗi kết quả session phải hiển thị tiêu đề hoặc nhãn thay thế, vị trí project và workspace nếu xác định được, cùng đoạn trích khi khớp nội dung. Chọn kết quả phải mở đúng hội thoại qua luồng mở hoặc mở lại hiện có.
- **FR-005** All phải hiển thị kết quả theo nhóm và ưu tiên workspace gần đây khi truy vấn rỗng. Workspaces và Projects phải lọc theo tên và mở mục được chọn. Actions phải liệt kê thao tác ứng dụng khả dụng trong ngữ cảnh hiện tại. Settings phải cho phép tìm và mở các mục cài đặt có sẵn. Lệnh và mục cài đặt phải tìm được theo tên.
- **FR-006** Khi đổi tab hoặc phạm vi, menu phải giữ truy vấn đã nhập, cập nhật kết quả theo lựa chọn mới nhất và hiển thị trạng thái đang tìm, không có kết quả hoặc lỗi khi thích hợp.
- **FR-007** Người dùng phải chọn được tab, phạm vi và kết quả bằng chuột hoặc bàn phím. Chỉ thao tác kích hoạt rõ ràng mới được mở đích hoặc chạy lệnh, theo điều kiện và luồng xác nhận hiện có.

### Key Entities *(include if feature involves data)*

- **Phạm vi session** Xác định tập hội thoại theo toàn bộ ứng dụng, project hiện tại hoặc workspace hiện tại.
- **Kết quả session** Gắn với hội thoại nguồn và vị trí của hội thoại nếu xác định được. Có thể có đoạn trích khớp truy vấn.
- **Mục menu lệnh** Project, workspace, thao tác hoặc mục cài đặt có tên hiển thị và đích mở hoặc hành động tương ứng.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** Với ba session cùng khớp từ khóa ở ba vị trí của Story 1, số kết quả tương ứng với ba phạm vi là 3, 2 và 1, với đầy đủ session đúng phạm vi.
- **SC-002** Trong 20 lần tìm liên tiếp trên bộ thử có 1.000 session thuộc ít nhất 3 project, người dùng thấy danh sách kết quả hoặc trạng thái không có kết quả trong vòng 1 giây kể từ khi ngừng nhập ở ít nhất 19 lần.
- **SC-003** Ít nhất 9 trong 10 người thử lần đầu có thể mở đúng một session trong phạm vi được giao và chạy đúng một lệnh có sẵn mà không cần hướng dẫn.

## Assumptions

- Ảnh tham chiếu định hướng bố cục một ô tìm kiếm và một hàng tab. Ba phạm vi tìm session là lựa chọn riêng trong tab All.
- Phạm vi project và workspace lấy từ mục hiện tại. Để tìm trong một project hoặc workspace khác, người dùng mở mục đó trước hoặc tìm ở phạm vi toàn bộ.
- Tính năng áp dụng cho menu ⌘K của Herdsman, dùng dữ liệu hội thoại và các thao tác mà ứng dụng đã cho người dùng truy cập.
