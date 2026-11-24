# File status contracts

## Project status IPC

`project_files_changed({ projectId: string }) → ChangedFile[]`, với mỗi `ChangedFile` gồm `path: string` và `status: string`. Dùng project ID đã đăng ký để resolve đường dẫn ở backend. Path đầu ra là slash-separated, tương đối với thư mục project và nằm trong phạm vi cây. Repo sạch hoặc project ngoài Git trả `[]`. Project ID sai và lỗi đọc Git thật trả lỗi theo cơ chế hiện hữu.

`files_changed({ workspaceId })`, `project_files_list({ projectId, path })` và `file_diff({ workspaceId, path })` giữ nguyên shape và định tuyến.

## UI

| Trạng thái | Màu tên file | Ký hiệu |
|---|---|---|
| Untracked hoặc added | Xanh lá | `U` cho untracked, mã Git cho added |
| Modified | Vàng hổ phách | Mã Git |
| Deleted | Đỏ | Mã Git |
| Renamed hoặc copied | Xanh dương | Mã Git |
| Unmerged `DD/AU/UD/UA/DU/AA/UU` | Đỏ | Mã xung đột, nhãn có “Conflict” |
| Chưa phân loại | Trung tính | Mã Git |
| Sạch | Mặc định | Không có ký hiệu |

Cả hai panel hiển thị ký hiệu chữ màu ở mép phải dòng, không có nền hay đường viền. Ký hiệu dùng cùng màu với tên file. Tên truy cập bao gồm tên file và ý nghĩa trạng thái. Cây chỉ tô các file tồn tại trong listing, với tên file giữ màu trạng thái khi hover hoặc được chọn. Dấu hiệu focus và selection vẫn quan sát được. Git Changes giữ thao tác mở diff, File Tree giữ mở file và đóng/mở thư mục.
