# Pull Requests Snapshot

Mỗi mục repository trong `pull_requests_refresh` có thể trả thêm `worktreePulls`, gồm các mục `number`, `headRefName`, `state` và `isDraft`. `state` là `OPEN`, `MERGED` hoặc `CLOSED`. Draft tương ứng với `OPEN` và `isDraft: true`. Trường vắng mặt được đọc như danh sách rỗng.

Sidebar mở PR bằng `pull_request_open` với repository và số PR. Danh sách `pulls` và notifications giữ hợp đồng hiện tại.
