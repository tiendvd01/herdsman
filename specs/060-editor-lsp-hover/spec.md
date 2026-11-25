# Feature Specification — Editor LSP Hover

**Feature Branch** — `master`

**Created** — 2026-11-25

**Status** — Ready for planning

**Input** — Tích hợp LSP cho code editor để rê chuột xem kiểu dữ liệu và chữ ký hàm.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem kiểu ngay tại chỗ (Priority: P1)

Khi đọc hoặc sửa code trong File Editor, tôi muốn rê chuột lên biến, hàm hoặc tên đã import để xem kiểu và chữ ký ngay tại vị trí đang đọc.

**Why this priority** — Người dùng có thể hiểu cách dùng một tên trong code mà vẫn giữ nguyên vị trí đọc.

**Independent Test** — Mở một dự án TypeScript có biến suy luận kiểu và hàm import từ file khác. Rê chuột lên mỗi tên và đối chiếu thông tin với code.

**Acceptance Scenarios**

1. **Given** file TypeScript hoặc JavaScript được hỗ trợ, **When** người dùng rê chuột và dừng trên một tên có thông tin kiểu, **Then** tooltip hiển thị kiểu hoặc chữ ký tương ứng và mô tả nếu có.
2. **Given** người dùng đổi kiểu của biến trong bản nháp chưa lưu, **When** người dùng rê chuột lên biến, **Then** tooltip thể hiện kiểu theo bản nháp hiện tại.
3. **Given** một tooltip đang mở hoặc đang chờ kết quả, **When** người dùng rời tên, đổi file hoặc đổi workspace, **Then** tooltip cũ biến mất và kết quả đến muộn không xuất hiện trên mục mới.

### User Story 2 - Tiếp tục chỉnh sửa khi thiếu thông tin kiểu (Priority: P2)

Khi dịch vụ phân tích chưa sẵn sàng, tôi vẫn muốn đọc, sửa và lưu file bình thường, đồng thời biết khi nào tính năng hover có thể sử dụng lại.

**Why this priority** — Hover là thao tác hỗ trợ đọc code. Editor cần tiếp tục phục vụ công việc khi phân tích kiểu chưa khả dụng.

**Independent Test** — Mở một file được hỗ trợ khi dịch vụ không khả dụng, sửa và lưu file, rồi khôi phục dịch vụ và mở lại file.

**Acceptance Scenarios**

1. **Given** dịch vụ phân tích của ngôn ngữ được hỗ trợ chưa khả dụng, **When** người dùng mở file, **Then** editor vẫn đọc, sửa, lưu và tô màu cú pháp được, đồng thời có chỉ báo ngắn về trạng thái hover.
2. **Given** dịch vụ đã hoạt động lại, **When** người dùng mở lại file, **Then** hover hoạt động trở lại.
3. **Given** file ngoài phạm vi hỗ trợ hoặc vị trí không có thông tin kiểu, **When** người dùng rê chuột, **Then** editor tiếp tục hoạt động bình thường và không hiện tooltip kiểu rỗng.

### Edge Cases

- Hai workspace có cùng đường dẫn tương đối nhưng khác nội dung phải cho kết quả tương ứng với workspace đang xem.
- Khi người dùng gõ tiếp hoặc cuộn khỏi vị trí đang xem, thông tin đã lỗi thời phải biến mất.
- Nếu dự án chưa sẵn sàng để phân tích phụ thuộc, người dùng vẫn sửa được file và thấy chỉ báo khi hover không khả dụng.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** File Editor phải hiển thị tooltip khi người dùng dừng chuột trên tên có thông tin phân tích. Tooltip phải có kiểu hoặc chữ ký và kèm mô tả nếu có.
- **FR-002** Phải hỗ trợ dự án TypeScript và JavaScript, kể cả thông tin từ file được import trong cùng dự án.
- **FR-003** Kết quả phải tương ứng với tài liệu đang mở, phiên bản bản nháp hiện tại và workspace chứa file. Kết quả cũ phải bị bỏ khi người dùng đổi ngữ cảnh.
- **FR-004** Khi dịch vụ thiếu, chưa sẵn sàng hoặc mất kết nối, editor phải giữ các thao tác chỉnh sửa, lưu và tô màu. Với file thuộc phạm vi hỗ trợ, trạng thái hover không khả dụng phải dễ nhận biết và mở lại file phải thử kết nối lại.
- **FR-005** Chỉ mở tooltip khi có nội dung phù hợp. Tooltip phải đóng khi người dùng rời tên, nhấn Escape hoặc đổi ngữ cảnh. Nhãn và trạng thái do Herdsman cung cấp phải dùng tiếng Anh và đọc được ở theme sáng và tối.

### Key Entities

- **Tài liệu đang mở** — File thuộc một workspace, có nội dung đang hiển thị và có thể chứa chỉnh sửa chưa lưu.
- **Thông tin hover** — Kiểu, chữ ký hoặc mô tả gắn với vị trí cụ thể trong phiên bản tài liệu đang được xem.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** Sau khi dịch vụ sẵn sàng, ít nhất 19 trong 20 lần hover trên các tên có kiểu trong dự án mẫu hiển thị thông tin đúng trong vòng 1 giây kể từ lúc dừng chuột.
- **SC-002** Trong bộ đối chiếu có biến suy luận kiểu, hàm import và chỉnh sửa chưa lưu, 100% tooltip hiển thị đúng kiểu hoặc chữ ký theo tài liệu hiện tại.
- **SC-003** Trong 10 lần đổi file hoặc workspace liên tiếp khi đang chờ hover, có 0 tooltip xuất hiện trên tài liệu sai. Trong ca dịch vụ không khả dụng, người dùng vẫn hoàn tất mở, sửa và lưu file.

## Assumptions

- Bản đầu tiên ưu tiên hover cho TypeScript và JavaScript. Tự động hoàn thành, báo lỗi trong editor, nhảy tới định nghĩa và đổi tên ký hiệu nằm ngoài phạm vi đợt này.
- Phạm vi là File Editor của workspace cục bộ. Tính khả dụng của phân tích phụ thuộc vào dịch vụ ngôn ngữ và cấu hình dự án.
