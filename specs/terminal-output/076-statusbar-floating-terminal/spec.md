# Feature Specification: Status bar và terminal nổi

**Feature Branch**: `master`

**Created**: 2026-11-26

**Status**: Implemented

**Refined**: 2026-11-26. Terminal nổi nằm trong cửa sổ chính, kéo được và hỗ trợ nhiều phiên qua các tab và nút **+** trên thanh đầu panel.

**Input**: User description: "Thêm thanh status bar ở đáy cửa sổ, chứa trạng thái hc connected và một mục mở terminal nổi để chạy lệnh."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem trạng thái hc ở đáy cửa sổ (Priority: P1)

Developer nhìn xuống đáy cửa sổ để biết hc đã kết nối và có thể dùng terminal hay chưa, kể cả khi sidebar đang thu gọn.

**Why this priority**. Trạng thái kết nối cho biết có thể mở terminal để chạy lệnh ngay hay cần khôi phục kết nối trước.

**Independent Test**. Mở app, thu gọn sidebar, lần lượt kiểm tra khi hc kết nối, mất kết nối và chưa được cài.

**Acceptance Scenarios**.

1. **Given** hc đã kết nối, **When** developer chuyển màn hình chính hoặc thu gọn sidebar, **Then** status bar vẫn ở đáy, trải ngang cửa sổ chính và hiển thị `hc connected`. Sidebar thu gọn hay mở rộng đều chỉ có một chỉ báo kết nối.
2. **Given** hc đang kết nối, **When** app phát hiện mất kết nối rồi kết nối lại, **Then** nhãn đổi sang `hc not connected` rồi trở lại `hc connected`. Khi app xác định hc chưa được cài, nhãn là `hc not installed`.

### User Story 2 - Chạy lệnh trong terminal nổi (Priority: P1)

Developer mở **Terminal** từ status bar để nhập lệnh và xem output ngay trong một panel nổi trong cửa sổ chính, giữ màn hình chính ở vị trí đang làm việc.

**Why this priority**. Developer có thể chạy một lệnh nhanh từ bất kỳ màn hình chính nào mà không phải mở tab terminal của workspace.

**Independent Test**. Từ workspace đang mở, kích hoạt **Terminal** bằng bàn phím, kiểm tra thư mục làm việc rồi chạy một lệnh in văn bản và một lệnh trả lỗi. Quan sát output và chạy tiếp lệnh khác trong cùng cửa sổ.

**Acceptance Scenarios**.

1. **Given** hc đã kết nối và một workspace đang mở, **When** developer kích hoạt **Terminal**, **Then** panel nổi và chỉ mục hiện ra. Developer chọn **New terminal** để tạo phiên trong thư mục workspace đó, với focus ở dấu nhắc lệnh. Developer nhập và chạy lệnh bằng bàn phím, xem output thường hoặc lỗi và có thể nhập lệnh tiếp theo khi dấu nhắc trở lại.
2. **Given** panel terminal đang mở, **When** developer kích hoạt **Terminal** lần nữa, **Then** panel và chỉ mục được ẩn. Bật lại hoặc chọn một số trong chỉ mục cho phép tiếp tục phiên tương ứng.
3. **Given** lệnh đang chạy trong terminal nổi, **When** developer ẩn panel nổi hoặc thoát app, **Then** lệnh vẫn tiếp tục. Khi mở lại **Terminal**, developer có thể chọn lại phiên cũ nếu phiên còn khả dụng.
4. **Given** chưa có workspace hoạt động, **When** developer mở một phiên terminal nổi mới, **Then** phiên bắt đầu trong thư mục project đang chọn hoặc thư mục người dùng nếu chưa chọn project.
5. **Given** hc chưa sẵn sàng hoặc việc mở terminal thất bại, **When** developer chọn **Terminal**, **Then** app hiện lý do, giữ màn hình hiện tại và cho phép thử lại khi hc sẵn sàng.

### Edge Cases

- Trong lúc kiểm tra kết nối ban đầu, status bar hiển thị `Checking hc…`.
- Khi mất kết nối giữa lúc chạy lệnh, terminal nổi giữ output đã hiển thị, báo mất kết nối và tiếp tục phiên cũ khi phiên còn khả dụng.
- Nếu phiên cũ đã kết thúc hoặc bị dọn, phiên đó rời khỏi chỉ mục. Developer có thể chọn phiên còn hoạt động hoặc tạo phiên mới.
- Khi cửa sổ chính ở kích thước tối thiểu được hỗ trợ, trạng thái kết nối và nút **Terminal** vẫn nhìn thấy và sử dụng được.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**. App MUST hiển thị status bar ngang ở đáy cửa sổ chính trên mọi màn hình chính, kể cả khi sidebar thu gọn. Chỉ báo kết nối hc MUST được chuyển từ footer sidebar vào status bar.
- **FR-002**. Status bar MUST phản ánh trạng thái đang kiểm tra, đã kết nối, mất kết nối và chưa cài hc bằng nhãn tiếng Anh. Người dùng MUST phân biệt được các trạng thái bằng chữ ở cả theme sáng và tối.
- **FR-003**. Status bar MUST có mục **Terminal** kích hoạt được bằng chuột và bàn phím. Khi hc sẵn sàng, mục này MUST bật hoặc tắt panel cùng các tab trên thanh đầu panel. Thanh đầu panel MUST có tab đánh số và nút **+** để tạo phiên mới. Nút **×** trên tab MUST kết thúc phiên của tab đó. Nút **−** ở góc MUST thu nhỏ panel và giữ các phiên đang chạy. Panel MUST kéo được trong cửa sổ chính và chuyển focus vào shell khi gắn phiên.
- **FR-004**. Terminal nổi MUST cho phép developer nhập và chạy trực tiếp lệnh shell, xem output và tiếp tục nhập lệnh. Mở hoặc khôi phục panel MUST giữ quyền khởi chạy lệnh ở người dùng.
- **FR-005**. Phiên mới MUST bắt đầu trong thư mục workspace đang hoạt động, hoặc thư mục project đang chọn khi không có workspace, hoặc thư mục người dùng khi không có cả hai. Phiên đã mở MUST giữ thư mục hiện tại khi developer chuyển màn hình, project hoặc workspace.
- **FR-006**. App MUST giữ phiên terminal nổi và các lệnh đang chạy khi chỉ ẩn panel nổi hoặc thoát app. Mở lại MUST khôi phục phiên cũ và output còn khả dụng khi phiên vẫn tồn tại. Người dùng MUST có thể ngắt lệnh hoặc kết thúc phiên từ terminal.
- **FR-007**. App MUST hiển thị phản hồi tiếng Anh khi hc chưa sẵn sàng, khi tạo phiên thất bại hoặc khi kết nối bị gián đoạn. Khi kết nối trở lại, developer MUST có thể tiếp tục phiên còn tồn tại hoặc mở phiên mới.
- **FR-008**. Mở terminal nổi MUST giữ màn hình chính có thể sử dụng và giữ nguyên project, workspace, session và tab terminal đang được chọn.

### Key Entities *(include if feature involves data)*

- **Trạng thái kết nối hc**. Trạng thái hiện tại được hiển thị trên status bar của cửa sổ chính.
- **Phiên terminal nổi**. Phiên tương tác có thư mục làm việc, output còn khả dụng và vòng đời riêng với cửa sổ hiển thị.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**. Trong bốn trạng thái kết nối đã nêu, status bar hiển thị đúng nhãn sau khi app xác định trạng thái, cả khi sidebar mở lẫn khi sidebar thu gọn.
- **SC-002**. Với hc đã kết nối, developer từ ba màn hình chính khác nhau bật terminal, chọn hoặc tạo phiên, nhập lệnh in dấu nhận diện và đọc được output trong vòng 15 giây mỗi lượt.
- **SC-003**. Ba lượt thử với workspace hoạt động, chỉ có project được chọn và chưa chọn project đều bắt đầu phiên mới trong đúng thư mục mong đợi.
- **SC-004**. Trong một lượt ẩn panel nổi và một lượt thoát app khi lệnh vẫn chạy, cả hai lệnh đều hoàn thành. Khi phiên còn tồn tại, mở lại terminal hiển thị được dấu nhận diện mà lệnh in trong lúc panel bị ẩn.

## Assumptions

- Status bar thuộc cửa sổ chính của app desktop. Terminal nổi là panel trong cửa sổ chính và có thể mở ở mọi màn hình chính.
- Có thể mở nhiều phiên terminal nổi trong cửa sổ chính. Chỉ mục hiển thị theo thứ tự tạo của các phiên còn hoạt động. Terminal workspace và cửa sổ **Open Output** của thẻ lệnh vẫn phục vụ luồng riêng.
- Terminal nổi phụ thuộc vào kết nối hc cục bộ. Khôi phục output phụ thuộc vào phiên và lịch sử còn khả dụng, và không yêu cầu lưu lịch sử riêng.
