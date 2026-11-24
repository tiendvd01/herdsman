# Feature Specification: Tìm file trong cây thư mục

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Triển khai tính năng search file trong file tree"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tìm file trong project (Priority: P1)

Người dùng nhập tên file hoặc một phần đường dẫn ngay trong bảng Files để tìm file mà không cần mở từng thư mục.

**Lý do ưu tiên.** Đây là thao tác chính giúp người dùng tìm nhanh file khi chưa biết vị trí chính xác.

**Kiểm thử độc lập.** Trong một project có file ở nhiều cấp, giữ các thư mục ở trạng thái thu gọn và tìm file theo tên và đường dẫn.

1. **Given** file `src/components/Sidebar.tsx` nằm trong thư mục đang thu gọn, **When** người dùng nhập `sidebar`, **Then** file xuất hiện trong kết quả cùng vị trí tương đối trong project.
2. **Given** project có `src/index.ts` và `tests/index.ts`, **When** người dùng nhập `index.ts`, **Then** cả hai file xuất hiện với đường dẫn phân biệt được. **When** truy vấn đổi thành `src/index`, **Then** chỉ file dưới `src` còn khớp.
3. **Given** bảng Files đang tìm kiếm, **When** người dùng chuyển sang project khác, **Then** bảng Files của project mới mở ở chế độ duyệt cây và không hiển thị kết quả của project trước.
4. **Given** một file bị loại khỏi phạm vi duyệt của cây file hiện tại, **When** người dùng tìm đúng tên file đó, **Then** file không xuất hiện trong kết quả.

### User Story 2 - Mở file và quay lại cây thư mục (Priority: P2)

Người dùng mở file từ kết quả, sau đó có thể xóa truy vấn để tiếp tục duyệt cây ở các thư mục đã mở trước đó.

**Lý do ưu tiên.** Việc mở đúng file hoàn thành thao tác tìm kiếm. Giữ trạng thái cây giúp người dùng tiếp tục công việc đang làm.

**Kiểm thử độc lập.** Mở một thư mục, tìm một file ở thư mục khác, mở file từ kết quả rồi xóa truy vấn.

1. **Given** có kết quả tìm kiếm, **When** người dùng nhấp vào kết quả hoặc di chuyển đến kết quả bằng bàn phím và nhấn Enter, **Then** file tương ứng mở trong trình xem/chỉnh sửa hiện tại. Nếu file đã mở, tab đó được kích hoạt.
2. **Given** cây có các thư mục đã mở trước khi tìm, **When** người dùng xóa truy vấn hoặc chỉ nhập khoảng trắng, **Then** bảng Files trở về cây với đúng các thư mục đã mở trước đó và file vừa mở vẫn nằm trong tab hiện tại.
3. **Given** có một file văn bản hợp lệ ngoài project, **When** người dùng nhập đường dẫn tuyệt đối và nhấn Enter hoặc chọn hàng file trong kết quả, **Then** đúng file đó mở ở chế độ chỉ đọc. Đường dẫn tuyệt đối trực tiếp bên trong project mở qua tab file của project.

### Edge Cases

- Khi truy vấn hợp lệ không có file khớp, bảng Files hiển thị trạng thái không có kết quả. Project rỗng cũng cho kết quả này khi có truy vấn.
- Khi tìm kiếm đang xử lý, bảng Files hiển thị trạng thái đang tìm. Nếu lần tìm thất bại, bảng Files báo lỗi và cho phép thử lại với cùng truy vấn. Người dùng vẫn có thể xóa truy vấn để về cây.
- Khi người dùng đổi truy vấn liên tiếp, kết quả trả về muộn của truy vấn cũ không ghi đè kết quả của truy vấn mới.
- Nếu file đã bị xóa hoặc không còn đọc được khi người dùng mở từ kết quả, bảng Files dùng thông báo lỗi mở file hiện có và vẫn cho phép tiếp tục tìm.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Bảng Files MUST có ô tìm kiếm dùng được bằng chuột và bàn phím. Truy vấn có hiệu lực khi người dùng nhập, sau khi bỏ khoảng trắng ở hai đầu.
- **FR-002**: Với truy vấn khác rỗng, hệ thống MUST tìm file trong toàn bộ phạm vi duyệt của cây Files thuộc project hiện tại, bao gồm file trong thư mục đang thu gọn và áp dụng các quy tắc hiển thị file hiện có.
- **FR-003**: File MUST khớp nếu truy vấn là một chuỗi con của tên file hoặc đường dẫn tương đối, không phân biệt chữ hoa và chữ thường. Mỗi file khớp chỉ xuất hiện một lần, kèm tên và vị trí tương đối đủ để phân biệt các file trùng tên.
- **FR-004**: Người dùng MUST mở được file khớp bằng chuột hoặc bàn phím. Hệ thống MUST kích hoạt tab hiện có nếu file đã mở và dùng cách báo lỗi mở file hiện có nếu file không còn đọc được.
- **FR-005**: Khi truy vấn rỗng sau khi bỏ khoảng trắng ở hai đầu, hệ thống MUST hiển thị cây Files với trạng thái mở thư mục trước khi tìm và giữ các tab file đang mở.
- **FR-006**: Bảng Files MUST phân biệt các trạng thái đang tìm, không có kết quả và tìm thất bại, đồng thời cho phép thử lại sau lỗi. Các nhãn và thông báo do ứng dụng cung cấp MUST dùng tiếng Anh.
- **FR-007**: Bảng Files MUST chỉ hiển thị kết quả của truy vấn hiện tại trong project đang xem. Chuyển project MUST xóa truy vấn đang dùng và đưa bảng Files về chế độ duyệt cây.
- **FR-008**: Bảng Files MUST cho phép mở file bằng đường dẫn tuyệt đối qua Enter hoặc chọn hàng file trong kết quả. File ngoài project MUST mở ở chế độ chỉ đọc. Đường dẫn không có file khớp MUST hiện trạng thái rỗng. Lỗi truy cập khi tìm hoặc mở MUST hiển thị cho người dùng.
- **FR-009**: Khi nhận đường dẫn tuyệt đối tới thư mục, bảng Files MUST hiển thị các file ở cấp đầu của thư mục đó. Khi người dùng thêm `/<truy vấn>` mà đường dẫn chưa khớp chính xác, hệ thống MUST tìm theo tên hoặc đường dẫn bên trong thư mục cha, bao gồm các thư mục con.

### Key Entities *(include if feature involves data)*

- **Truy vấn tìm file** — Văn bản người dùng nhập trong bảng Files của project hiện tại.
- **Kết quả tìm file** — File trong phạm vi duyệt của cây, được nhận diện theo đường dẫn tương đối trong project và có thể mở từ bảng Files.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong một project thử nghiệm có 5.000 file thuộc phạm vi cây, ít nhất 95% trong 30 lượt tìm theo tên hoặc đường dẫn hiển thị được kết quả hoặc trạng thái không có kết quả trong vòng 1 giây kể từ ký tự cuối, trên macOS.
- **SC-002**: Ít nhất 9 trong 10 người dùng thử tìm và mở đúng file mục tiêu trong 15 giây ở lần đầu, tính từ lúc bảng Files đã mở và người dùng được cung cấp một phần tên file cùng thư mục chứa file. Bộ dữ liệu có ít nhất hai file trùng tên ở các thư mục khác nhau.
- **SC-003**: Tất cả 10 lượt thử xóa truy vấn sau khi tìm đều khôi phục đúng trạng thái mở thư mục và giữ các tab file đang mở.

## Assumptions

- Tìm theo tên hoặc đường dẫn tương đối chỉ xét cây Files đang xem. Đường dẫn tuyệt đối mở đúng file đã chỉ định. Tìm nội dung, tìm riêng thư mục, tìm gần đúng và tìm xuyên project nằm ngoài phạm vi.
- Tính năng dựa trên cùng phạm vi file và trình xem/chỉnh sửa mà bảng Files đang dùng. Truy vấn chỉ phục vụ thao tác hiện tại và không lưu qua lần khởi động lại ứng dụng.
- Nếu ứng dụng đóng trong lúc tìm, trạng thái tìm kiếm kết thúc cùng bảng Files. Các agent và session đang chạy tiếp tục hoạt động.
