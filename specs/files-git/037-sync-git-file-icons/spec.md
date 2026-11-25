# Feature Specification: Đồng bộ icon file trong Git Changes

**Feature Branch**: `master` (nhánh hiện tại)
**Created**: 2026-11-24
**Status**: Draft
**Input**: Update icon git đồng bộ với file tree.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nhận diện file trong Git Changes (Priority: P1)

Khi duyệt Git Changes, người dùng nhận ra loại file qua cùng icon Material đã quen thuộc trong File Tree.

**Independent Test** — Tạo thay đổi cho `src/main.ts`, `README.md`, `package.json`, `Dockerfile` và một file đuôi lạ. Đối chiếu icon của từng file trong hai panel rồi mở diff từ Git Changes.

**Acceptance Scenarios**

1. **Given** cùng file xuất hiện trong hai panel, **When** người dùng chuyển giữa Git Changes và File Tree, **Then** cả hai dòng hiển thị cùng icon cho file đó.
2. **Given** một file trong thư mục con hoặc có tên đặc biệt như `Dockerfile`, **When** file xuất hiện trong Git Changes, **Then** icon khớp với cách File Tree nhận diện tên file đó.
3. **Given** Git Changes liệt kê file đã xóa hoặc đổi tên, **When** người dùng nhìn dòng thay đổi, **Then** icon tương ứng với tên file đang hiển thị, kể cả khi file đã xóa khỏi cây.
4. **Given** một dòng có icon Material, **When** người dùng chọn dòng bằng chuột hoặc bàn phím, **Then** diff mở như trước và ký hiệu trạng thái vẫn đọc được.

### Edge Cases

- Tên file chưa được nhận diện dùng icon file mặc định giống File Tree.
- Với file đổi tên sang loại khác, icon theo tên đích đang hiển thị trong Git Changes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Mỗi dòng file trong Git Changes MUST dùng cùng bộ icon Material và cùng quy tắc nhận diện theo tên file như File Tree, kể cả icon mặc định.
- **FR-002** — Git Changes MUST chọn icon theo tên file của dòng đang hiển thị, kể cả file thuộc thư mục con, file đã xóa và đích đổi tên.
- **FR-003** — Icon MUST là phần trang trí. Tên truy cập của dòng vẫn mô tả file và trạng thái Git. Dòng vẫn mở được diff bằng chuột hoặc bàn phím và giữ màu cùng ký hiệu Git hiện có.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Cả 5 file mẫu trong kịch bản kiểm tra độc lập hiển thị đúng icon tương ứng ở hai panel, gồm icon theo phần mở rộng, theo tên đặc biệt và icon mặc định.
- **SC-002** — File đã xóa và file đổi tên trong mẫu kiểm thử đều có icon đúng theo tên hiển thị. Người kiểm thử mở được diff bằng chuột và bàn phím, đồng thời đọc được ký hiệu trạng thái trong cả theme sáng và tối.

## Assumptions

- “Icon git” chỉ icon loại file ở đầu mỗi dòng Git Changes. Biểu tượng nhánh ở tiêu đề Git và ký hiệu trạng thái ở cuối dòng giữ vai trò hiện tại.
- File Tree là chuẩn đối chiếu về bộ icon và cách nhận diện tên file.
