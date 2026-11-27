# Feature Specification: Rút gọn đường dẫn thư mục cá nhân

**Feature Branch**: `master`  
**Created**: 2026-11-26  
**Status**: Draft  
**Input**: “Trong app dùng link ~/ thay vì /User/tiendvd”, kèm ảnh tiêu đề thẻ Write.

## User Scenarios & Testing

### User Story 1 - Đọc đường dẫn trên giao diện (Priority: P1)

Khi xem agent vừa ghi tệp nào, người dùng muốn thấy ngay phần đường dẫn giúp nhận ra worktree và tệp. Đây là ưu tiên chính vì phần tên tài khoản đang chiếm chỗ trong tiêu đề hẹp.

**Independent Test**: Xem cùng một tệp trên thẻ Write và ở một vị trí khác có hiển thị đường dẫn tuyệt đối do Herdsman tạo.

**Acceptance Scenarios**

1. Với thư mục cá nhân `/Users/tiendvd`, khi Write ghi vào `/Users/tiendvd/.herdr/worktrees/demo/src/App.tsx`, cả hai vị trí hiển thị `~/.herdr/worktrees/demo/src/App.tsx` khi đủ chỗ.
2. Khi tiêu đề hẹp, quy tắc cắt ngắn hiện có áp dụng lên nhãn đã rút gọn. Khi mở lại hội thoại cũ, người dùng thấy cùng cách viết như trong phiên mới.
3. Khi một người dùng khác xem đường dẫn thuộc thư mục cá nhân của họ, nhãn cũng bắt đầu bằng `~/`.

### User Story 2 - Mở đúng tệp qua liên kết (Priority: P2)

Người dùng bấm vào liên kết đã rút gọn để xem tệp đang được nhắc tới. Thao tác này cần chính xác kể cả khi nhiều worktree chứa các tệp trùng tên.

**Independent Test**: Tạo hai worktree có tệp cùng tên nhưng nội dung khác nhau. Bấm lần lượt vào liên kết của từng tệp và đối chiếu nội dung được mở.

### Edge Cases

- Nhãn trỏ tới chính thư mục cá nhân hiển thị `~`.
- Với thư mục cá nhân `/Users/tiendvd`, các đường dẫn `/Users/tiendvd-backup/a` và `/Volumes/data/a` hiển thị đầy đủ.
- Đường dẫn tương đối và nhãn đã bắt đầu bằng `~/` giữ nguyên dạng. Khi chưa xác định được thư mục cá nhân, giao diện hiển thị đường dẫn gốc.

## Requirements

### Functional Requirements

- **FR-001** — Mọi nhãn đường dẫn tuyệt đối do Herdsman hiển thị cho tệp hoặc thư mục nằm trong thư mục cá nhân hiện tại phải dùng `~/` cùng đầy đủ phần đường dẫn bên dưới. Chính thư mục cá nhân hiển thị là `~`.
- **FR-002** — Chỉ rút gọn khi xác định được thư mục cá nhân và khớp toàn bộ tên thư mục ở đầu đường dẫn.
- **FR-003** — Áp dụng cách viết này trước khi cắt nhãn theo chiều rộng, kể cả khi xem lại phiên đã lưu.
- **FR-004** — Bấm vào liên kết đã rút gọn phải mở đúng đích ban đầu.

### Key Entities

- **Thư mục cá nhân** thuộc tài khoản đang chạy Herdsman.
- **Nhãn đường dẫn** là phần chữ Herdsman dựng để hiển thị vị trí của một tệp hoặc thư mục.

## Success Criteria

### Measurable Outcomes

- **SC-001** — Trong 100% tình huống hiển thị và trường hợp biên ở trên, phần nhãn nhìn thấy khớp cách viết mong đợi.
- **SC-002** — Người dùng mở đúng cả hai tệp trùng tên ở lần bấm đầu tiên trong phép thử hai worktree.

## Assumptions

Phạm vi là nhãn đường dẫn trên toàn giao diện, bao gồm tiêu đề Write trong ảnh. Nội dung nguyên văn như mã nguồn, diff, lệnh shell và văn bản người dùng nhập nằm ngoài phạm vi định dạng nhãn.
