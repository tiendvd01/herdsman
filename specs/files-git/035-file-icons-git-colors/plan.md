# Implementation Plan: Icon Material và màu trạng thái Git

**Git branch** — `master`
**Spec Kit feature** — `035-file-icons-git-colors`
**Date** — 2026-11-24
**Spec** — [spec.md](spec.md)

## Summary

File Tree dùng SVG từ Material Icon Theme theo tên và loại file. Git Changes và File Tree dùng chung quy tắc hiển thị trạng thái. Git Changes tiếp tục đọc workspace hiện hành. File Tree đọc trạng thái từ đường dẫn project do ứng dụng lưu và ghép vào các dòng theo đường dẫn tương đối.

## Technical Context

| Mục | Thiết kế |
|---|---|
| Language/Version | TypeScript 5.8, React 18 và Rust theo toolchain repo |
| Primary Dependencies | Tauri 2, TanStack Query, Git CLI, shadcn/ui và một tập SVG Material Icon Theme đã ghim nguồn |
| Storage | Đọc project và workspace hiện có. Trạng thái Git chỉ nằm trong cache truy vấn. |
| Testing | Rust Git tests, Vitest cho quy tắc hiện trạng và UI, kiểm tra trực quan trên app Tauri |
| Target Platform | Desktop macOS, tương thích Linux |
| Project Type | Ứng dụng desktop Tauri |
| Performance Goals | Một truy vấn trạng thái cho toàn cây đang mở. Mỗi dòng tra cứu bằng map dùng chung, kể cả khi bung thêm thư mục. |
| Constraints | Asset có sẵn offline. Giữ thao tác bàn phím, chọn dòng, mở file và mở diff. |
| Scale/Scope | File Tree và Git Changes của project hoặc workspace đang mở. |

## Constitution Check

| Nguyên tắc | Trước nghiên cứu và sau thiết kế |
|---|---|
| I. Agent sống độc lập | Đạt. Luồng mới đọc metadata file. Đóng app giữa lần đọc chỉ hủy kết quả UI, agent tiếp tục chạy. |
| II. Dữ liệu hội thoại | Đạt. Luồng hội thoại, transcript và event log nằm ngoài phạm vi. |
| III. Quyền kiểm soát agent | Đạt. IPC mới chỉ đọc trạng thái của project đã đăng ký. Không thay đổi quyền hoặc agent tool calls. |
| IV. Hiển thị và hiệu năng | Đạt. Asset cục bộ, một map theo snapshot và trạng thái tải độc lập với khả năng duyệt cây. |
| V. Tương thích hệ sinh thái | Đạt. Giữ hợp đồng với agent engine, Herdr và API diff. |
| VI. Tổ chức theo project | Đạt. Trạng thái project và workspace dùng khóa truy vấn riêng trong cache hiện có. |
| Giao diện và kiểm thử | Đạt. Tái sử dụng Button, token theme và nhãn UI tiếng Anh. Quickstart kiểm tra theme sáng và tối. |

## Project Structure

### Documentation (this feature)

- [research.md](research.md)
- [data-model.md](data-model.md)
- [contracts/file-status.md](contracts/file-status.md)
- [quickstart.md](quickstart.md)

### Source Code (repository root)

- `src/components/files/` chứa File Tree, bộ chọn icon và quy tắc hiển thị trạng thái dùng chung.
- `src/components/panels/RightPanel.tsx` áp dụng màu cho Git Changes và làm mới trạng thái liên quan.
- `src/assets/material-icons/` chứa SVG cục bộ và thông tin nguồn.
- `src/lib/{api,queries,devMock}.ts` kết nối IPC, khóa cache và browser mock.
- `src-tauri/src/{commands,git,lib}.rs` đăng ký và phục vụ truy vấn trạng thái project.
- `src/theme/` chứa vai trò màu nếu cần bổ sung.
- `tests/unit/` và test Rust kiểm tra các trường hợp hồi quy.

**Structure Decision** — Tái sử dụng parser Git và cơ chế cache hiện có. Truy vấn project độc lập với truy vấn workspace để cây hoạt động cả khi chưa chọn workspace.

## Complexity Tracking

Truy vấn IPC chỉ đọc bổ sung là cần thiết vì API hiện tại chỉ nhận workspace. Một tập icon cục bộ có giới hạn đáp ứng nhận diện file với chi phí đóng gói nhỏ.
