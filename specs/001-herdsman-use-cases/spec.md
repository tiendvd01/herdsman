# Feature Specification: Herdsman — GUI quản lý agent theo Project → Workspace → Session

**Feature Branch**: `001-herdsman-use-cases`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Tách BR trong specs/business-requirement/BR-001.md (Herdsman, F1–F11, NFR, tiêu chí chấp nhận) thành các use case / user story có ưu tiên P1/P2/P3, test độc lập được. Viết spec bằng tiếng Việt."

**Nguồn**: [BR-001](../business-requirement/BR-001.md) · Thiết kế UI: [shadcn/ui minimal](https://claude.ai/artifact/G5Po8nsNnNB5taxkrSwRkQ#play-Shadcn)

## Clarifications

### Session 2026-11-21

- Q: Khi xong việc, developer kết thúc một workspace như thế nào? → A: Có cả archive và xoá. Archive ẩn workspace khỏi sidebar, giữ lịch sử, vẫn tìm và mở lại được, có tuỳ chọn xoá worktree. Xoá hẳn thì bỏ workspace khỏi app, không xoá thư mục project. Worktree còn thay đổi chưa commit thì phải hỏi trước khi xoá.
- Q: Developer chọn được những chế độ duyệt quyền nào cho mỗi session? → A: 3 chế độ: Hỏi mọi lần (mặc định); Tự cho phép sửa file trong thư mục làm việc; Bỏ qua mọi duyệt (phải xác nhận rõ, có badge cảnh báo trên tab).
- Q: Xoá một project đang có session hoặc background task chạy thì xử lý thế nào? → A: Hộp xác nhận liệt kê session/task đang chạy; đồng ý thì dừng hết rồi xoá project khỏi app; thư mục và transcript gốc giữ nguyên.
- Q: Tìm kiếm theo nội dung hội thoại tìm trong phạm vi nào? → A: Mặc định trong workspace đang mở (ô tìm trong popup lịch sử), có nút mở rộng ra mọi project; gồm cả workspace đã archive.
- Q: Các ngưỡng hiệu năng tự đặt (SC-006 đến SC-010) có giữ làm tiêu chí nghiệm thu không? → A: Giữ nguyên, đo trên máy Mac Apple Silicon cấu hình phổ thông.

## User Scenarios & Testing *(mandatory)*

> Tác nhân duy nhất: **Developer**, người chạy nhiều agent (Claude, Codex) song song trên nhiều repo.
> Bảng dưới cho biết mỗi user story (use case) đến từ chức năng nào trong BR.

| Story | Tên | Ưu tiên | Chức năng BR |
|---|---|---|---|
| US1 | Mở session agent và xem hội thoại dạng GUI | P1 | F2, F3, F4 |
| US2 | Agent vẫn chạy khi tắt app, mở lại thấy đầy đủ | P1 | F2, NFR Persistence / Không mất dữ liệu |
| US3 | Duyệt quyền tool của agent | P1 | F6 |
| US4 | Quản lý project | P1 | F1 |
| US5 | Tạo workspace kèm session đầu tiên | P1 | F11 |
| US6 | Theo dõi trạng thái và nhận thông báo | P2 | F5 |
| US7 | Workspace trên worktree riêng, chạy song song | P2 | F11 |
| US8 | Lịch sử session, mở lại và tìm kiếm | P2 | F10 |
| US9 | Xem Log terminal của session | P2 | F7 |
| US10 | Background task của project | P3 | F9 |
| US11 | Cây multi-agent | P3 | F8 |
| US12 | Tương thích với Herdr / `hc` / CLI | P3 | NFR Tương thích |

---

### User Story 1 - Mở session agent và xem hội thoại dạng GUI (Priority: P1)

Developer mở một session Claude hoặc Codex trong một workspace, gửi tin nhắn (có thể dán ảnh, dùng slash command), rồi xem agent trả lời theo thời gian thực. Nội dung hiện thành giao diện đồ hoạ: markdown, code có tô màu, bảng, sơ đồ Mermaid, biểu đồ, công thức toán. Mỗi lần agent dùng tool hiện thành một card thu gọn được; sửa hoặc ghi file thì hiện diff. Developer có thể ngắt lượt trả lời bất cứ lúc nào.

**Why this priority**: Đây là lý do Herdsman tồn tại. Herdr chỉ có giao diện terminal nên không hiện được sơ đồ, bảng hay biểu đồ. Chỉ cần story này là đã thay được việc đọc agent trong terminal.

**Independent Test**: Mở một session trong thư mục project, gửi prompt yêu cầu agent trả lời có bảng, khối Mermaid và khối chart. Kiểm tra từng loại nội dung hiện đúng dạng đồ hoạ, chữ hiện dần trong lúc agent đang trả lời.

**Acceptance Scenarios**:

1. **Given** một workspace đang mở, **When** developer tạo session Claude và gửi prompt, **Then** câu trả lời hiện dần theo thời gian thực, kể cả đoạn chữ chưa xong.
2. **Given** agent trả lời có khối Mermaid, **When** khối đó hiện trên màn hình, **Then** GUI vẽ thành sơ đồ, không hiện mã nguồn.
3. **Given** agent trả lời có khối ` ```chart `, **When** khối đó hiện, **Then** GUI vẽ thành biểu đồ.
4. **Given** agent gọi tool `Edit`, **When** card tool hiện ra, **Then** card thu gọn được và có diff của thay đổi.
5. **Given** agent đang trả lời, **When** developer bấm ngắt (interrupt), **Then** lượt trả lời dừng và developer gửi được tin nhắn mới.
6. **Given** ô chat, **When** developer dán ảnh rồi gửi, **Then** ảnh đi kèm tin nhắn và hiện trong hội thoại.
7. **Given** một khối Mermaid hoặc chart bị lỗi cú pháp, **When** khối đó hiện, **Then** GUI hiện lại mã nguồn của khối, phần còn lại của hội thoại không bị ảnh hưởng.

---

### User Story 2 - Agent vẫn chạy khi tắt app, mở lại thấy đầy đủ (Priority: P1)

Developer giao việc cho agent rồi tắt app (hoặc app bị crash, được update). Agent vẫn làm tiếp. Khi mở lại app, developer thấy toàn bộ hội thoại, kể cả phần agent viết trong lúc app tắt, và session đang chạy tiếp với đúng trạng thái.

**Why this priority**: Đây là điểm mạnh giữ lại từ Herdr và là nguyên tắc không thương lượng của dự án. Nếu agent dừng khi tắt app thì Herdsman không hơn một cửa sổ chat thông thường.

**Independent Test**: Gửi một task dài cho agent, tắt app, đợi 10 phút rồi mở lại. Kiểm tra hội thoại đầy đủ, không thiếu tin nhắn, agent vẫn chạy hoặc đã xong và trạng thái hiện đúng.

**Acceptance Scenarios**:

1. **Given** agent đang chạy, **When** developer tắt app 10 phút rồi mở lại, **Then** hội thoại đầy đủ, agent vẫn tiếp tục và trạng thái đúng.
2. **Given** agent đã xong trong lúc app tắt, **When** mở lại app, **Then** session hiện trạng thái done và có đủ câu trả lời cuối.
3. **Given** app vừa mở lại, **When** app kết nối lại với các session đang chạy, **Then** developer không phải thao tác gì thêm.
4. **Given** tiến trình agent đã chết, **When** developer mở lại session, **Then** session được khôi phục (resume) từ transcript gốc, không mất lịch sử.

---

### User Story 3 - Duyệt quyền tool của agent (Priority: P1)

Khi agent xin dùng một tool cần quyền (sửa file, chạy lệnh…), GUI hiện hộp Allow/Deny kèm nội dung cụ thể: diff cho sửa/ghi file, lệnh đầy đủ cho lệnh shell. Developer chọn Allow thì agent chạy tiếp, Deny thì agent nhận kết quả bị từ chối. Nếu app đang tắt, agent đứng chờ cho tới khi developer mở app và duyệt.

**Why this priority**: Developer chỉ dám để agent chạy lâu khi chắc chắn không có thay đổi nào lọt qua mà mình không thấy. Thiếu story này thì US1 và US2 không an toàn để dùng thật.

**Independent Test**: Cho agent một prompt bắt buộc phải sửa file. Kiểm tra hộp duyệt có diff; bấm Allow thì file được sửa và agent chạy tiếp; lặp lại với Deny thì file không đổi.

**Acceptance Scenarios**:

1. **Given** agent xin quyền `Edit`, **When** hộp duyệt hiện ra, **Then** hộp có diff của thay đổi; bấm Allow thì agent chạy tiếp.
2. **Given** agent xin chạy lệnh shell, **When** hộp duyệt hiện ra, **Then** hộp có lệnh đầy đủ sẽ chạy.
3. **Given** developer bấm Deny, **When** agent nhận kết quả, **Then** tool không được thực thi và agent tiếp tục với kết quả bị từ chối.
4. **Given** app đang tắt, **When** agent xin quyền, **Then** session ở trạng thái blocked; khi mở lại app, hộp duyệt vẫn còn đó, không tự hết hạn hay tự từ chối.
5. **Given** session ở chế độ Tự cho phép sửa file, **When** agent sửa file trong thư mục làm việc, **Then** không có hộp duyệt; **When** agent chạy lệnh shell, **Then** vẫn hiện hộp duyệt.
6. **Given** developer chọn chế độ Bỏ qua mọi duyệt, **When** xác nhận, **Then** tab session hiện badge cảnh báo; huỷ xác nhận thì chế độ không đổi.

---

### User Story 4 - Quản lý project (Priority: P1)

Developer thêm project bằng cách chọn một thư mục trên máy (nút **+ Project mới** ở đầu sidebar), đổi tên hoặc xoá project. Sidebar liệt kê project và các workspace bên dưới.

**Why this priority**: Project là điểm vào của mọi thao tác khác (workspace, session, background task). Đây là phần nền, làm nhanh nhưng bắt buộc.

**Independent Test**: Thêm hai project từ hai thư mục khác nhau, đổi tên một project, xoá một project. Kiểm tra sidebar cập nhật đúng và thông tin còn nguyên sau khi khởi động lại app.

**Acceptance Scenarios**:

1. **Given** sidebar, **When** developer bấm + Project mới và chọn một thư mục, **Then** project hiện trong sidebar với tên mặc định là tên thư mục.
2. **Given** một project, **When** developer đổi tên, **Then** tên mới hiện trong sidebar và trên hàng workspace.
3. **Given** một project có session hoặc background task đang chạy, **When** developer xoá project, **Then** hộp xác nhận liệt kê các session/task đó; đồng ý thì chúng bị dừng và project bị bỏ khỏi app, thư mục trên đĩa không bị đụng tới; huỷ thì không có gì thay đổi.
4. **Given** một thư mục đã là project, **When** developer thêm lại đúng thư mục đó, **Then** app báo project đã tồn tại, không tạo bản trùng.

---

### User Story 5 - Tạo workspace kèm session đầu tiên (Priority: P1)

Developer bấm **+** cạnh tên project để tạo workspace: nhập tên (không bắt buộc), chọn thư mục làm việc (thư mục project hoặc worktree mới). Workspace mới luôn có sẵn một session trống đang chờ prompt đầu tiên. Nếu để trống tên, workspace lấy prompt đầu tiên làm tên. Developer thêm session vào workspace bằng nút **+** cạnh hàng tab; các session hiện thành tab phía trên hội thoại.

**Why this priority**: Workspace là cách gom các session cùng làm một việc (ví dụ một issue). Session nào cũng thuộc một workspace, nên muốn mở session (US1) phải có workspace.

**Independent Test**: Bấm + cạnh project, để trống tên, chọn thư mục project, gửi prompt đầu tiên. Kiểm tra workspace có một session, session chạy, workspace đổi tên theo prompt. Bấm + cạnh hàng tab để thêm session thứ hai.

**Acceptance Scenarios**:

1. **Given** một project, **When** developer tạo workspace và để trống tên, **Then** workspace có sẵn một session trống, màn chờ prompt đầu tiên hiện ra.
2. **Given** workspace vừa tạo không có tên, **When** developer gửi prompt đầu tiên, **Then** session bắt đầu chạy và workspace lấy prompt làm tên (rút gọn nếu dài).
3. **Given** một workspace, **When** developer bấm + cạnh hàng tab, **Then** session mới được thêm thành tab và chạy trong cùng thư mục làm việc của workspace.
4. **Given** hàng tab, **When** một session đã xong và developer chuyển sang tab khác, **Then** tab session đã xong được ẩn khỏi hàng tab (vẫn tìm được trong lịch sử).
5. **Given** một workspace đã xong việc, **When** developer archive nó, **Then** workspace ẩn khỏi sidebar nhưng vẫn tìm thấy và mở lại được với đầy đủ lịch sử.
6. **Given** một workspace, **When** developer xoá nó, **Then** workspace biến mất khỏi app, thư mục project không bị đụng tới.

---

### User Story 6 - Theo dõi trạng thái và nhận thông báo (Priority: P2)

Developer nhìn qua là biết session nào đang chạy, đang chờ, đã xong hay lỗi: chấm màu trên tab session thể hiện idle / working / blocked / done / error; workspace có session đang chờ (blocked hoặc error) hiện chấm vàng cạnh tên ở sidebar. Khi agent xong hoặc cần duyệt, hệ điều hành gửi thông báo.

**Why this priority**: Khi chạy nhiều agent song song, developer cần biết chỗ nào cần mình mà không phải mở từng session. Có giá trị cao nhưng sản phẩm vẫn dùng được khi chưa có.

**Independent Test**: Chạy hai session ở hai workspace, một session xin quyền. Kiểm tra chấm trạng thái trên tab, chấm vàng ở sidebar, và thông báo hệ điều hành xuất hiện khi app không ở tiền cảnh.

**Acceptance Scenarios**:

1. **Given** session đang chạy, **When** trạng thái đổi (working → blocked → done), **Then** chấm màu trên tab đổi theo trong vòng 1 giây.
2. **Given** một session trong workspace bị blocked, **When** nhìn sidebar, **Then** workspace đó có chấm vàng; khi hết session chờ thì chấm biến mất.
3. **Given** app chạy nền, **When** agent xong hoặc cần duyệt, **Then** hệ điều hành hiện thông báo; bấm vào thông báo mở đúng session.

---

### User Story 7 - Workspace trên worktree riêng, chạy song song (Priority: P2)

Khi tạo workspace, developer chọn "worktree mới": app tạo một bản checkout riêng trên branch mới từ base branch. Mọi session trong workspace dùng chung worktree này. Hai workspace dùng worktree trong cùng project sửa file mà không đè lên nhau.

**Why this priority**: Đây là cách để chạy nhiều việc song song trên cùng repo. Có thể dùng thư mục project (US5) trong lúc chưa có story này.

**Independent Test**: Tạo hai workspace dùng worktree trên cùng project, cho mỗi agent sửa cùng một file theo cách khác nhau. Kiểm tra hai thay đổi nằm ở hai branch riêng, thư mục project gốc không đổi.

**Acceptance Scenarios**:

1. **Given** form tạo workspace, **When** developer chọn worktree mới và base branch, **Then** app tạo branch mới và worktree riêng; hàng workspace hiện chip tên branch; sidebar hiện icon branch.
2. **Given** hai workspace dùng worktree trong cùng project, **When** hai agent sửa cùng một file, **Then** thay đổi không đè lên nhau.
3. **Given** base branch không tồn tại hoặc tên branch mới đã có, **When** developer tạo workspace, **Then** app báo lỗi rõ ràng và không tạo workspace nửa vời.
4. **Given** workspace dùng thư mục project, **When** xem sidebar và hàng workspace, **Then** hiện icon ô vuông và chip "thư mục project".

---

### User Story 8 - Lịch sử session, mở lại và tìm kiếm (Priority: P2)

Developer bấm icon lịch sử cuối hàng tab để xem mọi session của workspace (mới nhất ở trên), bấm một session để mở lại. Session đã xong mở thành tab tạm. Developer tìm session theo nội dung hội thoại.

**Why this priority**: Cần để quay lại việc cũ, nhưng ngày đầu dùng app thì chưa có nhiều lịch sử.

**Independent Test**: Tạo ba session trong một workspace, cho một session xong. Mở lịch sử, kiểm tra thứ tự, mở lại session đã xong, tìm một câu đã gõ trong hội thoại.

**Acceptance Scenarios**:

1. **Given** workspace có nhiều session, **When** developer mở lịch sử, **Then** danh sách hiện mọi session, mới nhất ở trên, kèm trạng thái.
2. **Given** một session đã xong, **When** developer bấm vào nó, **Then** session mở thành tab tạm; gửi tin nhắn mới thì session được resume và chạy tiếp.
3. **Given** ô tìm kiếm, **When** developer gõ một cụm từ có trong hội thoại, **Then** kết quả hiện session chứa cụm từ đó và đoạn trích.
4. **Given** cụm từ chỉ có trong session của project khác (hoặc workspace đã archive), **When** developer mở rộng phạm vi ra mọi project, **Then** kết quả hiện session đó kèm tên project/workspace; bấm vào thì mở đúng session.

---

### User Story 9 - Xem Log terminal của session (Priority: P2)

Mỗi session có tab "Log" hiện màn hình terminal thật của tiến trình agent để debug khi GUI không cho thấy đủ.

**Why this priority**: Là đường lui khi có lỗi; không phải luồng dùng hằng ngày.

**Independent Test**: Mở một session đang chạy, chuyển sang tab Log, kiểm tra màn hình terminal hiện và cập nhật theo thời gian thực.

**Acceptance Scenarios**:

1. **Given** session đang chạy, **When** developer mở tab Log, **Then** hiện màn hình terminal của tiến trình agent, cập nhật theo thời gian thực.
2. **Given** session lỗi, **When** developer mở tab Log, **Then** thấy được thông báo lỗi cuối của tiến trình.

---

### User Story 10 - Background task của project (Priority: P3)

Developer chạy server, test, build như background task gắn với project, xem log và trạng thái, kill hoặc dọn task đã xong. Task cũng sống qua việc tắt app như session.

**Why this priority**: Hữu ích nhưng developer vẫn làm được bằng terminal riêng.

**Independent Test**: Chạy một lệnh server từ panel Background tasks, xem log, tắt rồi mở app, kiểm tra task vẫn chạy, sau đó kill.

**Acceptance Scenarios**:

1. **Given** một project, **When** developer chạy một lệnh như background task, **Then** task hiện trong panel với trạng thái đang chạy và log.
2. **Given** task đang chạy, **When** developer tắt rồi mở lại app, **Then** task vẫn chạy và log còn nguyên.
3. **Given** task đang chạy, **When** developer bấm kill, **Then** task dừng; task đã dừng có thể dọn khỏi danh sách.

---

### User Story 11 - Cây multi-agent (Priority: P3)

Khi agent giao việc cho agent con, panel Agents hiện cây cha → con và tiến độ của từng con. Không hiện tin nhắn trao đổi giữa các agent.

**Why this priority**: Chỉ cần khi dùng nhiều agent phối hợp, là trường hợp nâng cao.

**Independent Test**: Cho agent một task tự giao việc cho hai agent con. Kiểm tra cây hiện đúng quan hệ và trạng thái của từng con.

**Acceptance Scenarios**:

1. **Given** agent cha giao việc cho agent con, **When** mở panel Agents, **Then** cây hiện cha → con kèm trạng thái/tiến độ từng con.
2. **Given** một agent con xong, **When** xem cây, **Then** trạng thái con cập nhật thành done.

---

### User Story 12 - Tương thích với Herdr / `hc` / CLI (Priority: P3)

Session do Herdsman tạo hiện trong danh sách session của Herdr/`hc` với đúng trạng thái; agent khác giao việc được cho session; session Claude mở lại được bằng CLI của Claude.

**Why this priority**: Giữ quy trình quen thuộc của developer, nhưng app vẫn có giá trị khi chưa kiểm chứng đủ.

**Independent Test**: Tạo một session trong Herdsman, kiểm tra nó có trong danh sách session của `hc` với đúng trạng thái, gửi việc vào session từ bên ngoài, resume session bằng CLI Claude.

**Acceptance Scenarios**:

1. **Given** một session Herdsman, **When** liệt kê session từ `hc`/Herdr, **Then** session có mặt với đúng trạng thái.
2. **Given** một session Herdsman, **When** agent khác gửi việc vào session qua `hc`, **Then** tin nhắn hiện trong hội thoại GUI và agent xử lý.
3. **Given** một session Claude đã dừng, **When** developer resume bằng CLI Claude, **Then** CLI mở đúng hội thoại.

---

### Edge Cases

- App mở lại khi `hc` chưa chạy hoặc không kết nối được: sidebar hiện trạng thái `hc` lỗi, app không xoá hay đánh dấu sai session, tự thử kết nối lại.
- Thư mục project bị xoá/di chuyển ngoài app: project hiện cảnh báo, không mở được session mới cho tới khi sửa đường dẫn hoặc xoá project.
- Hội thoại trên 5.000 message: vẫn cuộn mượt; sơ đồ/biểu đồ chỉ vẽ khi cuộn tới.
- Nội dung agent chứa HTML/script: hiện an toàn, không chạy script.
- Nhiều yêu cầu duyệt quyền cùng lúc trong nhiều session: mỗi session giữ hộp duyệt của mình, không lẫn sang session khác.
- Archive hoặc xoá workspace có worktree còn thay đổi chưa commit: app cảnh báo và chờ xác nhận trước khi xoá worktree.
- Tiến trình agent chết giữa chừng: session chuyển error, developer resume được từ transcript gốc.
- Prompt đầu tiên rất dài hoặc nhiều dòng: tên workspace tự đặt được rút gọn còn một dòng.

## Requirements *(mandatory)*

### Functional Requirements

**Project (F1)**
- **FR-001**: Developer MUST thêm được project bằng cách chọn thư mục local; sửa tên và xoá project.
- **FR-002**: Hệ thống MUST NOT tạo hai project trùng một thư mục.
- **FR-002a**: Xoá project MUST qua hộp xác nhận liệt kê mọi session và background task đang chạy của project; khi đồng ý, hệ thống MUST dừng hết các tiến trình đó rồi mới bỏ project khỏi app, không để tiến trình chạy tiếp mà app không quản lý. Thư mục project và transcript gốc giữ nguyên.
- **FR-003**: Sidebar MUST liệt kê project → workspace; không có khái niệm space.

**Workspace (F11)**
- **FR-004**: Tạo workspace MUST luôn sinh một workspace mới kèm một session trống chờ prompt đầu tiên.
- **FR-005**: Form tạo workspace MUST có: tên (không bắt buộc), thư mục làm việc (thư mục project hoặc worktree mới từ base branch).
- **FR-006**: Workspace không có tên MUST lấy prompt đầu tiên (rút gọn) làm tên.
- **FR-007**: Mọi session của workspace MUST chạy trong cùng thư mục làm việc của workspace.
- **FR-008**: Workspace dùng worktree MUST có branch và bản checkout riêng, không ảnh hưởng thư mục project gốc và workspace khác.
- **FR-008a**: Developer MUST archive được workspace: workspace ẩn khỏi sidebar, lịch sử session giữ nguyên, vẫn tìm thấy và mở lại (bỏ archive) được; khi archive có tuỳ chọn xoá worktree.
- **FR-008b**: Developer MUST xoá được workspace: bỏ workspace và session của nó khỏi app, không xoá thư mục project; transcript gốc của engine giữ nguyên.
- **FR-008c**: Trước khi xoá worktree (khi archive hoặc xoá workspace), nếu worktree còn thay đổi chưa commit, hệ thống MUST cảnh báo và chờ developer xác nhận.

**Session & hội thoại (F2, F3, F4)**
- **FR-009**: Developer MUST mở được session Claude hoặc Codex trong một workspace; session hiện thành tab trên hàng tab.
- **FR-010**: Session MUST tiếp tục chạy khi app tắt, crash, update hoặc khởi động lại; app MUST tự kết nối lại khi mở.
- **FR-011**: Hội thoại MUST hiện theo thời gian thực, kể cả đoạn chữ đang viết dở.
- **FR-012**: Hội thoại MUST hiện được markdown đầy đủ, code có tô màu, bảng, Mermaid, khối ` ```chart `, công thức toán và ảnh.
- **FR-013**: Tool call MUST hiện thành card thu gọn được; sửa/ghi file MUST hiện diff.
- **FR-014**: Khối sơ đồ/biểu đồ lỗi MUST hiện lại mã nguồn, không làm hỏng phần còn lại.
- **FR-015**: Nội dung từ agent MUST được hiện an toàn (không chạy script hay HTML không tin cậy).
- **FR-016**: Ô chat MUST cho gửi tin nhắn, dán ảnh, ngắt lượt và dùng slash command.
- **FR-017**: Mỗi session MUST có lịch sử sự kiện riêng để dựng lại hội thoại; transcript gốc của engine MUST được giữ nguyên để resume.

**Trạng thái & thông báo (F5)**
- **FR-018**: Mỗi session MUST hiện trạng thái idle / working / blocked / done / error bằng chấm màu trên tab.
- **FR-019**: Workspace có session blocked hoặc error MUST có chấm vàng ở sidebar.
- **FR-020**: Hệ thống MUST gửi thông báo hệ điều hành khi agent xong hoặc cần duyệt; bấm thông báo mở đúng session.

**Duyệt quyền (F6)**
- **FR-021**: Mọi tool cần quyền MUST hiện hộp Allow/Deny với diff (sửa/ghi file) hoặc lệnh đầy đủ (lệnh shell) trước khi chạy.
- **FR-022**: Hệ thống MUST NOT tự cho phép thay developer, ngoài chế độ quyền developer đã chọn rõ cho session.
- **FR-022a**: Mỗi session MUST có một trong ba chế độ quyền, đổi được trong lúc session chạy: **Hỏi mọi lần** (mặc định cho session mới); **Tự cho phép sửa file** (sửa/ghi file trong thư mục làm việc của workspace không cần hỏi; lệnh shell và file ngoài thư mục làm việc vẫn phải hỏi); **Bỏ qua mọi duyệt** (không hỏi gì).
- **FR-022b**: Chọn chế độ Bỏ qua mọi duyệt MUST qua một bước xác nhận riêng; session ở chế độ này MUST có badge cảnh báo trên tab cho tới khi đổi chế độ.
- **FR-023**: Yêu cầu quyền khi app tắt MUST chờ (blocked) tới khi developer duyệt; không tự hết hạn hay tự từ chối.

**Log, multi-agent, background task (F7, F8, F9)**
- **FR-024**: Mỗi session MUST có tab Log hiện màn hình terminal của tiến trình agent.
- **FR-025**: Panel Agents MUST hiện cây agent cha → con và trạng thái/tiến độ từng con; không hiện tin nhắn giữa agent.
- **FR-026**: Developer MUST chạy được background task gắn project, xem log/trạng thái, kill và dọn task; task sống qua việc tắt app.

**Lịch sử & tìm kiếm (F10)**
- **FR-027**: Icon lịch sử MUST liệt kê mọi session của workspace, mới nhất ở trên; bấm để mở lại; session đã xong mở thành tab tạm.
- **FR-028**: Developer MUST tìm được session theo nội dung hội thoại. Ô tìm nằm trong popup lịch sử, mặc định tìm trong workspace đang mở, có lựa chọn mở rộng ra mọi project; kết quả gồm cả session của workspace đã archive và ghi rõ project/workspace của từng kết quả.
- **FR-029**: Hàng tab MUST chỉ hiện session chưa xong và session đang xem.

**Tương thích (NFR)**
- **FR-030**: Session MUST hiện trong danh sách session của `hc`/Herdr với đúng trạng thái và nhận được việc gửi từ agent khác.
- **FR-031**: Session Claude MUST resume được bằng CLI Claude.

**Giao diện (BR 3.1, 3.2)**
- **FR-032**: Bố cục MUST gồm sidebar trái (project → workspace, trạng thái `hc`, Settings), khung giữa (hàng workspace, hàng tab session, hội thoại + ô nhập), sidebar phải (Agents, Background tasks, Files, Log).
- **FR-033**: Giao diện MUST theo phong cách shadcn/ui minimal trong artifact thiết kế, có theme Light và Dark đổi được từ sidebar.

### Key Entities *(include if feature involves data)*

- **Project**: một thư mục trên máy local. Thuộc tính: tên hiển thị, đường dẫn. Có nhiều Workspace và Background task.
- **Workspace**: nhóm session cùng làm một việc. Thuộc tính: tên (có thể tự đặt), trạng thái (đang dùng / đã archive), kiểu thư mục làm việc (thư mục project / worktree), branch và base branch (nếu worktree). Thuộc một Project, có nhiều Session.
- **Session**: một hội thoại với agent. Thuộc tính: engine (Claude/Codex), trạng thái, chế độ quyền, model, mức dùng context, thời điểm tạo/cập nhật. Thuộc một Workspace; có lịch sử sự kiện, có thể có agent con.
- **Sự kiện hội thoại**: một mục trong lịch sử của session (tin nhắn, đoạn stream, tool call, yêu cầu quyền, kết quả), có thứ tự tăng dần.
- **Yêu cầu quyền**: tool, nội dung (diff/lệnh), trạng thái (chờ / cho phép / từ chối). Thuộc một Session.
- **Agent con**: agent được giao việc từ một session; có trạng thái/tiến độ; tạo thành cây.
- **Background task**: lệnh chạy nền gắn với Project; có trạng thái và log.

## Success Criteria *(mandatory)*

### Measurable Outcomes

> Các ngưỡng thời gian và hiệu năng đo trên máy Mac Apple Silicon cấu hình phổ thông.


- **SC-001**: Tắt app trong lúc agent chạy, mở lại sau 10 phút: 100% tin nhắn có mặt, agent vẫn tiếp tục, trạng thái đúng.
- **SC-002**: 100% khối Mermaid và ` ```chart ` hợp lệ hiện thành sơ đồ/biểu đồ; khối lỗi hiện lại mã nguồn.
- **SC-003**: Yêu cầu quyền `Edit` luôn hiện diff; sau khi bấm Allow agent chạy tiếp trong vòng 2 giây.
- **SC-004**: Developer tạo xong workspace (để trống tên) và gửi prompt đầu tiên trong dưới 30 giây; workspace tự lấy prompt làm tên.
- **SC-005**: Hai workspace dùng worktree trong cùng project chạy song song, 0 lần thay đổi file đè lên nhau.
- **SC-006**: Hội thoại trên 5.000 message cuộn mượt (không tụt dưới 60 khung hình/giây khi cuộn); chữ stream hiện chậm không quá 200 ms so với agent.
- **SC-007**: Đổi trạng thái session hiện trên tab và sidebar trong vòng 1 giây; thông báo hệ điều hành hiện trong vòng 2 giây.
- **SC-008**: Mở lại app với 10 session đang chạy: hiện đầy đủ trạng thái trong dưới 5 giây.
- **SC-009**: 100% session Herdsman hiện trong danh sách session của `hc` với đúng trạng thái.
- **SC-010**: Tìm kiếm theo nội dung trả kết quả trong dưới 1 giây với 1.000 session.

## Assumptions

- Một người dùng, một máy; chỉ project local (remote machine, cloud sync, đa người dùng ngoài phạm vi v1).
- Developer đã cài `hc` (herdr-core) và có tài khoản/credential cho Claude và/hoặc Codex.
- Ưu tiên macOS, sau đó Linux.
- Không tự viết engine agent hay gọi model API trực tiếp; Mods ngoài phạm vi v1.
- Xoá project hoặc workspace chỉ xoá khỏi app, không xoá thư mục trên đĩa; xoá worktree cần developer xác nhận.
- Tên workspace tự đặt lấy dòng đầu của prompt, cắt khoảng 40 ký tự.
- Theme mặc định theo hệ điều hành.
- Ngưỡng hiệu năng SC-006 đến SC-010 không có trong BR; đã chốt giữ làm tiêu chí nghiệm thu v1 (Clarifications 2026-11-21).
- Mô hình Project → Workspace → Session khớp constitution v1.1.0 (nguyên tắc VI).
