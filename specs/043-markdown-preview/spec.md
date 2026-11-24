# Feature Specification: Xem trước và tải tệp Markdown

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Làm chức năng preview markdown, có thể tải sử dụng rich conversation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem Markdown trong workspace (Priority: P1)

Người dùng mở tệp Markdown từ cây tệp để đọc tài liệu đã định dạng ngay trong tab tệp, với cách hiển thị quen thuộc từ Rich Conversation. Họ có thể quay lại mã nguồn để tiếp tục chỉnh sửa.

**Why this priority**: Người dùng có thể đọc tài liệu và kiểm tra nội dung đang soạn ngay trong workspace.

**Independent Test**: Mở tệp Markdown có bảng, đoạn mã và sơ đồ. Chuyển giữa nguồn và preview. Sửa một tiêu đề, mở lại preview và kiểm tra cả tiêu đề mới lẫn nội dung còn trong trình chỉnh sửa.

**Acceptance Scenarios**

1. **Given** người dùng mở tệp Markdown có nội dung hợp lệ, **When** họ chọn preview, **Then** tab tệp hiển thị nội dung đã định dạng như cùng nội dung trong Rich Conversation.
2. **Given** tệp có thay đổi chưa lưu, **When** người dùng chuyển từ nguồn sang preview rồi quay lại, **Then** preview phản ánh bản đang chỉnh sửa, các thay đổi vẫn còn và tệp trên đĩa giữ nguyên.
3. **Given** một khối nội dung giàu định dạng bị lỗi, **When** người dùng mở preview, **Then** khối lỗi hiển thị dưới dạng nguồn và phần còn lại vẫn đọc được.
4. **Given** tệp chứa HTML có hành vi thực thi, **When** người dùng mở preview, **Then** hành vi đó không chạy và nội dung Markdown còn lại vẫn đọc được.
5. **Given** người dùng đã mở một tệp thuộc định dạng khác, **When** họ xem tab tệp, **Then** các thao tác hiện có vẫn hoạt động và tùy chọn preview Markdown không xuất hiện.
6. **Given** agent đang chạy, **When** người dùng đóng ứng dụng trong lúc xem preview rồi mở lại, **Then** agent tiếp tục chạy độc lập và ứng dụng hiển thị lại trạng thái session theo luồng kết nối lại hiện có.

---

### User Story 2 - Tải bản Markdown đang xem (Priority: P2)

Người dùng có thể lưu một bản sao Markdown của tài liệu đang mở để chia sẻ hoặc mở bằng công cụ khác.

**Why this priority**: Người dùng có thể mang theo đúng nội dung họ vừa kiểm tra trong preview.

**Independent Test**: Chỉnh sửa nội dung, mở preview, tải xuống vị trí khác và mở tệp tải về để đối chiếu với mã nguồn đang chỉnh sửa.

**Acceptance Scenarios**

1. **Given** người dùng đang xem preview của tệp có thay đổi chưa lưu, **When** họ chọn tải và xác nhận vị trí mới, **Then** bản sao có tên mặc định theo tệp nguồn và chứa nguyên văn nội dung đang được xem. Tệp nguồn trên đĩa giữ nguyên.
2. **Given** đích tải đã tồn tại, **When** người dùng chưa xác nhận ghi đè, **Then** tệp đích giữ nguyên.
3. **Given** người dùng hủy lưu hoặc vị trí đích không ghi được, **When** thao tác kết thúc, **Then** preview vẫn mở. Nếu ghi thất bại, ứng dụng báo lỗi và người dùng có thể thử lại.

### Edge Cases

- Tệp rỗng hiển thị trạng thái trống và vẫn tải được bản sao rỗng.
- Nếu tệp nguồn không đọc được và tab chưa có nội dung, ứng dụng hiển thị lỗi đọc và không cung cấp thao tác tải.
- Preview xử lý riêng từng khối Mermaid, biểu đồ hoặc công thức lỗi để phần tài liệu còn lại vẫn hiển thị.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Tab của tệp `.md` hoặc `.markdown` trong workspace MUST cho phép chuyển giữa mã nguồn và preview. Tệp thuộc định dạng khác giữ các thao tác hiện có.
- **FR-002**: Preview MUST hiển thị Markdown theo khả năng hiện có của Rich Conversation, gồm tiêu đề, danh sách, bảng, liên kết, đoạn mã có tô sáng, Mermaid, biểu đồ và công thức toán.
- **FR-003**: Preview MUST phản ánh nội dung đang mở trong trình chỉnh sửa, gồm cả thay đổi chưa lưu. Chuyển chế độ MUST giữ nội dung chỉnh sửa và không ghi vào tệp nguồn.
- **FR-004**: Preview MUST hiển thị mã nguồn của từng khối định dạng lỗi và tiếp tục hiển thị các khối khác. Nội dung tài liệu MUST không được thực thi mã khi xem trước.
- **FR-005**: Từ preview, người dùng MUST chọn được vị trí lưu bản sao Markdown, với tên tệp nguồn được đề xuất. Bản sao MUST chứa nguyên văn mã nguồn của bản đang xem. Ghi đè tệp đã có MUST yêu cầu xác nhận, và thao tác tải MUST không ghi vào tệp nguồn của tab.
- **FR-006**: Khi người dùng hủy lưu hoặc khi thao tác tải thất bại, ứng dụng MUST giữ preview và nội dung đang chỉnh sửa. Khi thao tác thất bại, ứng dụng MUST báo lỗi và cho phép thử lại.
- **FR-007**: Khi tệp rỗng, preview MUST hiển thị trạng thái trống và cho phép tải bản sao rỗng. Nếu mở tệp thất bại và chưa có nội dung, ứng dụng MUST báo lỗi đọc và vô hiệu hóa tải.
- **FR-008**: Việc mở, đóng hoặc tải từ preview MUST không làm gián đoạn agent đang chạy. Nếu ứng dụng đóng khi preview mở, agent MUST tiếp tục và session MUST kết nối lại theo luồng hiện có khi mở ứng dụng.

### Key Entities *(include if feature involves data)*

- **Tệp Markdown** chứa mã nguồn trên đĩa và có thể có bản đang chỉnh sửa trong tab.
- **Bản sao Markdown** là tệp độc lập chứa mã nguồn tương ứng với preview tại thời điểm người dùng yêu cầu tải.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng mở preview trong tối đa hai thao tác từ tab tệp Markdown đang mở.
- **SC-002**: Bộ kiểm tra có ít nhất một mẫu hợp lệ cho mỗi loại nội dung trong FR-002. Tất cả mẫu hiển thị cùng nội dung và cấu trúc tương ứng với Rich Conversation.
- **SC-003**: 100% bản tải thành công trong bộ kiểm tra gồm tệp rỗng, tệp đã lưu và tệp có thay đổi chưa lưu khớp nguyên văn với nguồn của bản đang xem.
- **SC-004**: Ít nhất 4 trong 5 người dùng thử có thể mở preview và tải bản sao về thư mục tự chọn ngay lần đầu mà không cần hướng dẫn.

## Assumptions

- Preview áp dụng cho tệp Markdown mở từ cây tệp của workspace và dựa vào khả năng định dạng hiện có của Rich Conversation. Phạm vi tải là bản sao tệp Markdown, còn xuất HTML, PDF và toàn bộ hội thoại nằm ngoài phạm vi.
- Tab Markdown mở ở chế độ mã nguồn theo mặc định. Nhãn và thông báo của ứng dụng dùng tiếng Anh. Nội dung tài liệu giữ nguyên ngôn ngữ gốc.
