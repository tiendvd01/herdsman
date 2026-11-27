# Feature Specification: Cô lập môi trường dev và production của Herdsman

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "Triển khai cô lập môi trường production và môi trường dev, để có thể develop app ngay trên herdsman mà không gây conflict"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Phát triển Herdsman ngay trong Herdsman (Priority: P1)

Developer dùng Herdsman production để mở repo Herdsman trong một workspace, giao việc cho agent hoặc chạy lệnh phát triển, rồi mở Herdsman dev trên cùng máy để thử thay đổi. Cả hai bản đều dùng được cùng lúc và developer nhận ra ngay mình đang thao tác ở bản nào.

**Why this priority**: Đây là luồng chính. Developer cần thử bản đang phát triển trong khi vẫn dùng bản ổn định để tiếp tục công việc.

**Independent Test**: Mở repo Herdsman trong production, bắt đầu một phiên agent, khởi chạy bản dev từ terminal của workspace và gửi một yêu cầu trong mỗi bản.

**Acceptance Scenarios**:

1. **Given** production đang mở với một phiên agent hoạt động, **When** developer khởi chạy bản dev từ terminal của workspace Herdsman, **Then** cả hai bản đều mở và nhận thao tác, mỗi bản có dấu hiệu nhận diện môi trường và phiên production vẫn gửi nhận được tin nhắn. (FR-001, FR-002)
2. **Given** dev đã mở, **When** developer mở ứng dụng production đã cài, **Then** cửa sổ production mở đúng môi trường và developer vẫn tương tác được với cửa sổ dev. (FR-001, FR-002)
3. **Given** cả hai bản đã mở, **When** developer thêm cùng repo Herdsman vào bản dev và mở một workspace thử nghiệm, **Then** mỗi bản hiển thị danh sách workspace của môi trường mình và có thể mở thư mục dự án mà người dùng đã chọn. (FR-003, FR-005)
4. **Given** production đang dùng một worktree do production tạo, **When** developer mở thư mục đó như một workspace thử nghiệm trong dev rồi xóa mục workspace khỏi dev, **Then** production vẫn mở được worktree đó và tiếp tục phiên đang làm việc. (FR-005)

---

### User Story 2 - Thử cấu hình và phiên agent trong dev (Priority: P1)

Developer thay đổi cài đặt, thử phiên agent, khởi động lại hoặc gặp sự cố ở bản dev trong khi các phiên production vẫn chạy. Developer có thể xác định phiên, đầu ra và yêu cầu cấp quyền thuộc môi trường nào.

**Why this priority**: Việc thử nghiệm thường xuyên cần bảo vệ lịch sử, cấu hình và quyền điều khiển các phiên đang làm việc.

**Independent Test**: Dùng dữ liệu mẫu khác nhau ở hai bản. Tạo phiên ở mỗi bản, gửi một yêu cầu cần cấp quyền trong dev, đổi cài đặt, dừng bản dev trong lúc có phiên hoạt động và mở lại.

**Acceptance Scenarios**:

1. **Given** production đã có project, workspace, phiên, lịch sử và cài đặt, **When** developer mở dev lần đầu rồi tạo bộ dữ liệu và cài đặt thử riêng, **Then** dev bắt đầu với dữ liệu riêng, production vẫn hiển thị dữ liệu cũ và mỗi bản chỉ thấy dữ liệu thử đã tạo trong môi trường mình. (FR-003)
2. **Given** cả hai bản có agent và terminal đang chạy, **When** developer duyệt một yêu cầu cấp quyền, gửi lệnh và dừng một terminal trong dev, **Then** mỗi thao tác tác động đến đúng phiên hoặc terminal đã chọn, và đầu ra cùng thông báo xuất hiện ở đúng môi trường. (FR-004)
3. **Given** mỗi môi trường có một phiên agent đang chạy độc lập, **When** một cửa sổ bị đóng hoặc bản dev dừng đột ngột rồi mở lại, **Then** phiên ở môi trường còn lại tiếp tục hoạt động và bản được mở lại kết nối đúng phiên của mình. (FR-004, FR-006)
4. **Given** bản dev không thể sử dụng dữ liệu hoặc tài nguyên dành cho mình khi khởi chạy, **When** developer thử mở bản dev, **Then** bản dev báo lỗi kèm tên môi trường và production vẫn dùng được. (FR-007)
5. **Given** đã lưu cấu hình thử nghiệm riêng ở hai bản, **When** developer đổi hoặc xóa thông tin xác thực do Herdsman lưu trong dev rồi mở lại cả hai bản, **Then** dev dùng cấu hình vừa sửa và production tiếp tục dùng cấu hình của mình. (FR-003)

---

### User Story 3 - Tiếp tục công việc sau khi nâng cấp production (Priority: P1)

Người đang dùng Herdsman production cài bản phát hành có hỗ trợ cô lập và tiếp tục công việc từ dữ liệu đã có, kể cả khi mở dev trước lần đầu mở production sau nâng cấp.

**Why this priority**: Developer cần tin tưởng rằng việc đưa bản dev vào quy trình không làm gián đoạn công việc đang chạy hoặc mất lịch sử.

**Independent Test**: Chuẩn bị bản production cũ với project, workspace, phiên đang chạy, phiên đã kết thúc, lịch sử, cài đặt và thông tin xác thực thử nghiệm. Nâng cấp, mở dev trước production rồi xác nhận dữ liệu và phiên cũ trong production.

**Acceptance Scenarios**:

1. **Given** bản production cũ có dữ liệu và một phiên đang chạy, **When** người dùng nâng cấp, mở dev rồi mở production, **Then** production hiển thị lại project, workspace, lịch sử và cài đặt đã lưu, dùng được thông tin xác thực sẵn có và kết nối lại đúng phiên đang chạy. (FR-008)
2. **Given** production đã mở thành công sau nâng cấp, **When** người dùng đóng và mở lại production, **Then** mỗi project, workspace và phiên hiện có xuất hiện đúng một lần, và cài đặt vẫn dùng được. (FR-008)

### Edge Cases

- Hai bản cùng tham chiếu một thư mục dự án. Các tệp trong thư mục đó phản ánh thao tác tệp có chủ đích của người dùng hoặc agent được cấp quyền. Việc mở project hoặc workspace vẫn giữ metadata riêng theo môi trường.
- Người dùng khởi động lại dev nhiều lần trong lúc một phiên production chờ cấp quyền. Yêu cầu chờ vẫn nằm ở production và chỉ được xử lý từ đúng phiên.
- Tài nguyên của môi trường hiện tại bị thiếu hoặc không dùng được. Lỗi phải xác định môi trường gặp sự cố, và bản còn lại phải tiếp tục hoạt động.
- Người dùng đã từng chạy bản dev cũ dùng chung dữ liệu với production. Dữ liệu dùng chung hiện có được quy về production để giữ lịch sử đang sử dụng.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Herdsman phải cho phép bản production đã cài và bản dev của một workspace chạy đồng thời trên cùng máy macOS, theo cả hai thứ tự khởi chạy. Khởi chạy từ terminal của workspace phải mở đúng bản dev của workspace đó.
- **FR-002**: Tên ứng dụng khi chuyển cửa sổ và dấu hiệu luôn thấy trong cửa sổ phải giúp người dùng xác định đúng `Development` hoặc `Production` mà không cần mở cài đặt.
- **FR-003**: Mỗi môi trường phải lưu và mở lại riêng các project, workspace, phiên, lịch sử, cài đặt, trạng thái giao diện và thông tin xác thực do Herdsman quản lý. Dev phải khởi tạo dữ liệu riêng trong lần đầu sử dụng. Các thao tác tạo, sửa hoặc xóa dữ liệu do app quản lý chỉ được áp dụng trong môi trường hiện tại.
- **FR-004**: Herdsman phải định tuyến thao tác quản lý agent, terminal và tác vụ nền tới đúng môi trường. Đầu ra, trạng thái phiên, thông báo và yêu cầu cấp quyền do Herdsman hiển thị phải thuộc môi trường tạo ra chúng.
- **FR-005**: Người dùng phải có thể thêm cùng một repo vào cả hai môi trường và chọn thư mục làm việc hoặc worktree theo luồng workspace hiện có. Việc đăng ký repo chỉ tạo mục trong môi trường hiện tại. Thao tác dọn dẹp tự động khi xóa workspace phải giữ lại worktree do môi trường kia quản lý.
- **FR-006**: Phiên agent đang chạy độc lập phải tiếp tục hoạt động khi cửa sổ bị đóng hoặc bản dev dừng đột ngột. Khi mở lại, bản tương ứng phải kết nối lại với đúng phiên và khôi phục trạng thái cùng các yêu cầu cấp quyền đang chờ của mình.
- **FR-007**: Khi môi trường hiện tại không thể dùng tài nguyên riêng cần thiết để khởi chạy, Herdsman phải báo lỗi có tên môi trường, giữ nguyên dữ liệu hiện có và tránh dùng tài nguyên của môi trường kia để khởi chạy thay thế.
- **FR-008**: Production phải giữ khả năng mở dữ liệu, sử dụng cấu hình đã lưu và kết nối lại phiên production đang chạy khi nâng cấp từ bản phát hành cũ. Việc mở dev trước hoặc mở production lại nhiều lần phải giữ đúng một bản ghi cho mỗi project, workspace và phiên đã có.

### Key Entities *(include if feature involves data)*

- **Môi trường ứng dụng** — Production hoặc Development. Xác định dữ liệu và các phiên, terminal, tác vụ do bản đang chạy quản lý.
- **Dữ liệu do Herdsman quản lý** — Project, workspace, phiên, lịch sử, trạng thái giao diện, cài đặt và thông tin xác thực được người dùng lưu trong Herdsman. Mỗi mục thuộc một môi trường.
- **Thư mục làm việc** — Thư mục repo hoặc worktree mà người dùng chọn trong workspace. Hai môi trường có thể trỏ đến cùng thư mục, mỗi môi trường quản lý thông tin workspace của mình.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong cả 2 thứ tự khởi chạy trên cùng máy, developer mở và thao tác được trong cả 2 bản, đồng thời xác định đúng môi trường từ cửa sổ và từ giao diện chuyển ứng dụng.
- **SC-002**: 100% thao tác thử tạo, sửa hoặc xóa project thử nghiệm, workspace, phiên, cài đặt và thông tin xác thực do Herdsman quản lý chỉ làm thay đổi bản đang thao tác. Hai bản có thể cùng mở một repo. Sau khi xóa mục workspace thử nghiệm trong dev, developer vẫn mở được worktree tương ứng do production quản lý.
- **SC-003**: Trong một lượt thử ít nhất 1 phút với phiên production đang hoạt động, developer có thể thử dev, đóng và mở lại dev, rồi thử dừng đột ngột và mở lại dev. Ghi nhận 0 lần gián đoạn hoặc định tuyến nhầm lệnh, đầu ra hay yêu cầu cấp quyền giữa hai bản. Dev mở lại và khôi phục đúng phiên thử nghiệm sau cả hai lần.
- **SC-004**: Sau khi nâng cấp từ bản production cũ với dữ liệu mẫu, 100% project, workspace và phiên đã lưu xuất hiện đúng một lần trong production. Lịch sử, cài đặt và xác thực mẫu dùng được, phiên production đang chạy vẫn tiếp tục, kể cả khi dev được mở trước.
- **SC-005**: Trong thử nghiệm mà dev không truy cập được một tài nguyên riêng cần thiết, bản dev hiển thị lỗi chỉ rõ môi trường. Developer tiếp tục gửi và nhận tin nhắn trong phiên production đang mở.

## Assumptions

- Phạm vi đầu tiên là một bản production đã cài và một bản dev từ mã nguồn, chạy bằng cùng tài khoản trên một máy macOS. Chạy nhiều bản dev đồng thời nằm ngoài phạm vi.
- Developer đã có repo và công cụ phát triển Herdsman trên máy. Cả hai môi trường có thể tham chiếu cùng repo. Developer có thể chọn worktree riêng khi cần tách các thay đổi trên tệp nguồn.
- Dữ liệu ứng dụng đang có trước khi tính năng này ra mắt thuộc production. Dev bắt đầu với dữ liệu riêng, kể cả khi máy từng chạy bản dev dùng chung dữ liệu.
- Tài khoản, hạn mức và dữ liệu do công cụ bên ngoài Herdsman quản lý theo cấu hình riêng của từng công cụ. Phạm vi cô lập bao gồm thông tin xác thực do Herdsman lưu và hoạt động do Herdsman quản lý.
