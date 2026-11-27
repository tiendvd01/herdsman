# Feature Specification: Chỉnh Worktree Postscript bằng CodeMirror

**Feature Branch**: `master`

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "Worktree post script cho dùng code mirror để edit code"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chỉnh script nhiều dòng trong cài đặt project (Priority: P1)

Developer mở Worktree Postscript để đọc, sửa và lưu script chuẩn bị worktree của project.

**Why this priority** — Số dòng và màu cú pháp giúp đọc và sửa script nhiều dòng ngay trong Herdsman.

**Independent Test** — Mở cấu hình có sẵn, dán script shell nhiều dòng có dòng trống và thụt lề, chỉnh một dòng, hoàn tác rồi làm lại. Lưu và mở lại hộp thoại để đối chiếu nội dung.

**Acceptance Scenarios**

1. Khi mở cấu hình project, trình soạn thảo hiển thị giá trị đã lưu, có số dòng và tô màu cú pháp shell trong cả theme sáng lẫn tối. Cấu hình mới mở trình soạn thảo trống.
2. Khi nhập hoặc dán script nhiều dòng, người dùng có thể sửa, hoàn tác và làm lại bằng bàn phím. Enter xuống dòng trong trình soạn thảo.
3. Khi bấm **Save** rồi mở lại, script đã lưu giữ nguyên thứ tự dòng, dòng trống giữa script và thụt lề. Khi lưu nội dung trống hoặc chỉ có khoảng trắng, postscript của project được tắt.
4. Khi bấm **Cancel**, lần mở tiếp theo hiển thị giá trị đã lưu gần nhất. Khi lưu lỗi, hộp thoại báo lỗi và giữ bản đang sửa để có thể thử lại.
5. Khi mở cài đặt của project khác, trình soạn thảo hiển thị giá trị riêng của project đó. Script đã lưu tiếp tục được dùng theo luồng tạo worktree của đặc tả 084.

### Edge Cases

- Script dài có thể cuộn trong trình soạn thảo, trong khi các nút **Save** và **Cancel** vẫn sử dụng được.
- Thao tác nhập, dán và hoàn tác không tự lưu hoặc chạy script.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Herdsman MUST dùng **CodeMirror** trong hộp thoại Worktree Postscript để hiển thị và chỉnh giá trị theo project, với số dòng và tô màu cú pháp shell trong theme sáng và tối.
- **FR-002** — Trình soạn thảo MUST hỗ trợ nhập và dán nhiều dòng, xuống dòng, hoàn tác, làm lại và cuộn script dài. Người dùng MUST có thể dùng bàn phím để chuyển đến **Save** và **Cancel**.
- **FR-003** — **Save** MUST lưu giá trị cho project hiện tại, giữ dòng trống bên trong script và thụt lề. Giá trị trống hoặc chỉ gồm khoảng trắng MUST tắt postscript.
- **FR-004** — **Cancel** MUST bỏ thay đổi chưa lưu. Lỗi lưu MUST được hiển thị và giữ bản đang sửa để người dùng có thể thử lại.
- **FR-005** — Herdsman MUST tiếp tục dùng cấu hình đã lưu theo quy tắc khởi chạy trong đặc tả 084.

### Key Entities

- **Worktree Postscript** — Script shell tùy chọn đã lưu theo project.
- **Bản đang sửa** — Văn bản trong hộp thoại được lưu khi người dùng xác nhận hoặc bỏ khi hủy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Với một script thử 20 dòng chứa thụt lề và dòng trống, người dùng có thể dán, chỉnh, lưu trong một lần mở hộp thoại. Lần mở lại hiển thị đủ 20 dòng theo đúng thứ tự và thụt lề.
- **SC-002** — Trong cả ba tình huống kiểm thử gồm hủy sửa, lưu lỗi và chuyển giữa hai project, giá trị đã lưu của từng project vẫn đúng theo thao tác người dùng đã xác nhận.
- **SC-003** — Trong cả hai theme, người dùng đọc được số dòng và cú pháp và có thể đi bằng bàn phím từ trình soạn thảo đến nút lưu hoặc hủy.

## Assumptions

- Phạm vi là hộp thoại cấu hình Worktree Postscript của project Git. Luồng khởi chạy và theo dõi kết quả tuân theo [đặc tả Worktree Postscript 084](../084-worktree-postscript/spec.md).
- Các tính năng biên tập được giả định gồm số dòng, tô màu cú pháp shell và hoàn tác/làm lại. Lưu vẫn thực hiện qua nút **Save**.
