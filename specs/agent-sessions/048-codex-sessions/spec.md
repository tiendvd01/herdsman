# Feature Specification: Session Codex trong Herdsman

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "codex có sdk không, cài sdk để xài session của codex trên herdsman luôn"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tạo và sử dụng session Codex (Priority: P1)

Developer chọn Codex khi tạo session để giao việc, theo dõi phản hồi và quản lý phiên ngay trong workspace hiện có.

**Why this priority**: Đây là luồng cơ bản để dùng Codex trong Herdsman cùng các agent khác.

**Independent Test**: Chọn Codex trong workspace có thư mục làm việc, gửi hai yêu cầu liên tiếp và kiểm tra phản hồi cùng ngữ cảnh trong một tab.

**Acceptance Scenarios**

1. **Given** Codex đã sẵn sàng và workspace đang mở, **When** người dùng tạo session Codex và gửi yêu cầu, **Then** Codex làm việc trong thư mục của workspace và phản hồi xuất hiện dần trong Rich Conversation.
2. **Given** một lượt đã hoàn tất, **When** người dùng gửi tiếp yêu cầu có tham chiếu lượt trước, **Then** Codex tiếp tục đúng session và giao diện giữ lịch sử các lượt.
3. **Given** Codex chưa có sẵn, chưa xác thực hoặc không tương thích, **When** người dùng chọn Codex, **Then** Herdsman nêu tình trạng và cách khắc phục. Các engine khác vẫn khả dụng theo luồng hiện có.

### User Story 2 - Tiếp tục phiên đã có từ Codex CLI (Priority: P2)

Developer chọn một phiên Codex CLI đã lưu cho workspace đang mở để đọc ngữ cảnh cũ và tiếp tục công việc từ Herdsman.

**Why this priority**: Developer có thể chuyển công việc đang làm từ CLI sang Herdsman và giữ cùng lịch sử Codex.

**Independent Test**: Tạo một phiên từ Codex CLI trong thư mục workspace, kết thúc lượt đang chạy, rồi mở phiên đó trong Herdsman và gửi yêu cầu nối tiếp.

**Acceptance Scenarios**

1. **Given** tài khoản Codex đang dùng có một phiên CLI đã lưu cho thư mục workspace hiện tại, **When** người dùng chọn phiên đó, **Then** Herdsman hiển thị lịch sử hiện có và gửi lượt mới vào cùng định danh phiên.
2. **Given** một phiên đã được liên kết trong workspace, **When** người dùng chọn lại, **Then** Herdsman mở lại session đã liên kết.
3. **Given** phiên không còn truy cập được, thuộc thư mục khác hoặc Codex từ chối tiếp tục, **When** người dùng thử mở, **Then** Herdsman giải thích lý do và giữ nguyên lịch sử đã có.

### User Story 3 - Kiểm soát và kết nối lại session (Priority: P2)

Developer có thể duyệt thao tác cần quyền, ngắt lượt đang chạy và mở lại Herdsman để tiếp tục theo dõi công việc.

**Why this priority**: Người dùng cần giữ quyền kiểm soát khi dùng Codex trong giao diện và khi rời ứng dụng.

**Independent Test**: Gửi yêu cầu tạo một thao tác cần duyệt trong project thử nghiệm. Đóng Herdsman khi đang chờ, mở lại, từ chối và kiểm tra kết quả. Sau đó thử ngắt một lượt đang chạy.

**Acceptance Scenarios**

1. **Given** Codex yêu cầu quyền chạy lệnh hoặc sửa tệp, **When** Herdsman nhận yêu cầu, **Then** giao diện hiển thị lệnh hoặc diff cụ thể và gửi đúng quyết định Allow hoặc Deny của người dùng.
2. **Given** session đang chạy hoặc đang chờ duyệt, **When** ứng dụng đóng rồi mở lại, **Then** agent tiếp tục hoặc giữ yêu cầu chờ, ứng dụng tự kết nối lại và hiển thị đúng trạng thái cùng lịch sử.
3. **Given** session đang chạy, **When** người dùng chọn Interrupt hoặc Stop, **Then** đúng lượt hoặc session được dừng theo thao tác đã chọn. Log và nội dung hội thoại vẫn xem được.

### Edge Cases

- Danh sách phiên tương thích rỗng có trạng thái trống và vẫn cho tạo phiên mới.
- Mất kết nối tạm thời giữ lịch sử và hiển thị lỗi. Mở lại không nhân đôi lượt hoặc tự gửi lại yêu cầu.
- Phiên đang chạy ở nơi khác chỉ được tiếp tục khi Codex xác nhận có thể mở an toàn. Nếu có xung đột, Herdsman báo lỗi và giữ phiên hiện có.
- Khi Codex từ chối mở phiên do xác thực hoặc cấu hình tài khoản, người dùng nhận hướng dẫn khắc phục theo nguyên nhân.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Herdsman MUST cung cấp lựa chọn Codex khi tạo session trong workspace và kiểm tra điều kiện sẵn sàng, gồm cài đặt tương thích và xác thực Codex. Lỗi MUST có hướng khắc phục. Engine hiện có MUST vẫn sử dụng được.
- **FR-002**: Session Codex MUST thực hiện yêu cầu trong thư mục làm việc của workspace. Herdsman MUST hiển thị lượt gửi, phản hồi đang chạy, lỗi và trạng thái trong giao diện hội thoại hiện có.
- **FR-003**: Người dùng MUST xem và chọn được phiên Codex CLI đã lưu, tương thích và thuộc cùng thư mục workspace. Herdsman MUST hiển thị lịch sử và tiếp tục cùng định danh phiên cho các lượt mới, đồng thời mở lại liên kết đã có khi chọn trùng.
- **FR-004**: Nếu một phiên không truy cập được hoặc có xung đột khi mở, Herdsman MUST báo lý do và giữ lịch sử. Herdsman MUST giữ nguyên bản ghi gốc của Codex khi đọc hoặc liên kết phiên.
- **FR-005**: Với thao tác cần duyệt, Herdsman MUST hiển thị lệnh đầy đủ hoặc diff cụ thể trước khi gửi quyết định của người dùng. Quyền đã cấu hình chỉ được áp dụng trong phạm vi người dùng đã chọn rõ ràng. Yêu cầu đang chờ MUST tiếp tục chờ khi Herdsman đóng.
- **FR-006**: Herdsman MUST hỗ trợ Interrupt, Stop và xem Log cho session Codex theo luồng hiện có. Tắt, crash hoặc mở lại ứng dụng MUST giữ agent chạy độc lập. Khi mở lại, ứng dụng MUST tự kết nối, khôi phục trạng thái và lịch sử mà không nhân đôi lượt hay tự gửi lại yêu cầu.
- **FR-007**: Herdsman MUST sử dụng phiên xác thực Codex tương thích của người dùng cho luồng đã đăng nhập. Dữ liệu xác thực MUST không xuất hiện trong hội thoại, nhật ký ứng dụng hoặc bản ghi phiên của Herdsman.

### Key Entities *(include if feature involves data)*

- **Session Herdsman** thuộc một workspace và mang trạng thái hoạt động cùng lựa chọn engine.
- **Phiên Codex** có định danh, thư mục làm việc và lịch sử do Codex lưu. Một phiên có thể được liên kết với session Herdsman tương ứng.
- **Yêu cầu quyền** gắn với thao tác cụ thể trong một session và mang trạng thái chờ, được duyệt hoặc bị từ chối.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ít nhất 4 trong 5 developer đã xác thực Codex có thể tự tạo session, gửi yêu cầu và tìm thấy phản hồi đầu tiên từ giao diện Herdsman.
- **SC-002**: Trong 3 phiên CLI mẫu có lịch sử, cả 3 phiên tương thích hiển thị được các lượt cũ và nhận lượt mới với cùng định danh. Chọn lại từng phiên giữ đúng một tab liên kết.
- **SC-003**: Trong 3 lần đóng ứng dụng giữa lượt và 3 lần đóng lúc chờ duyệt, cả 6 lần mở lại đều phục hồi đúng session và trạng thái, với 0 lượt trùng hoặc tự gửi lại.
- **SC-004**: Trong bộ kiểm tra có cả lệnh và sửa tệp, 100% thao tác cần quyền hiển thị chi tiết trước quyết định. Từ chối giữ nguyên tệp hoặc ngăn lệnh chạy theo từng kịch bản.

## Assumptions

- Phạm vi ưu tiên Codex cục bộ trên macOS với tài khoản đã đăng nhập và phiên CLI đã lưu trong đúng thư mục workspace. Đồng bộ Codex Cloud hoặc ChatGPT Work và tiếp quản lượt CLI đang chạy ngoài Herdsman nằm ngoài phạm vi ban đầu.
- Tab session, lịch sử, trạng thái, quyền và giao diện Log hiện có của Herdsman là các điểm tích hợp. Thông báo và nhãn do ứng dụng cung cấp dùng tiếng Anh.
- Cách phân phối phiên bản Codex tương thích và cách kết nối với Codex sẽ được xác nhận trong bước lập kế hoạch theo constitution của dự án.
