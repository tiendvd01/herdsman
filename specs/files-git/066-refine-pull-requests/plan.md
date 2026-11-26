# Implementation Plan: Tinh chỉnh giao diện Pull Requests

**Branch**: `master` | **Date**: 2026-11-26 | **Spec**: [Spec 066](spec.md)

**Input**: `specs/files-git/066-refine-pull-requests/spec.md`

## Summary

Đổi dropdown thành thanh tab có số đếm, dùng hàng PR gọn và mở chi tiết chỉ đọc trong màn hiện tại. Dùng cùng dữ liệu cho danh sách và chi tiết. Giữ lựa chọn project trong sidebar và mở chi tiết từ thông báo. Khi quay lại danh sách, khôi phục vị trí và focus.

## Technical Context

- **Language/Version** — TypeScript 5.8 và Rust theo toolchain hiện có.
- **Primary Dependencies** — React 18, shadcn/ui, TanStack Query, Tauri 2 và GitHub CLI.
- **Storage** — Dùng snapshot hiện có. Hai trường thông tin bổ sung cho phép đọc snapshot cũ.
- **Testing** — Vitest, Cargo tests và kiểm tra giao diện bằng trình duyệt.
- **Target Platform** — Desktop macOS trước. Kiểm tra bố cục ở hai kích thước và theme theo spec.
- **Project Type** — Desktop app.
- **Performance Goals** — Giữ danh sách có quyền đọc khi làm mới. Khôi phục vị trí đọc khi quay lại.
- **Constraints** — Giữ phạm vi dữ liệu theo project và tài khoản. Nhãn tiếng Anh và token theme hiện có.
- **Scale/Scope** — Màn Pull Requests, truy vấn chi tiết PR và các bài kiểm thử tích hợp màn hình.

## Constitution Check

- **I–III** — Thay đổi chỉ đọc PR. Đóng app giữa lúc xem chi tiết để các tiến trình agent tiếp tục theo vòng đời hiện có. Nhật ký hội thoại và quyền agent nằm ngoài luồng PR.
- **IV** — Làm mới trong nền, giữ vùng cuộn độc lập và trình bày dữ liệu từ GitHub dưới dạng văn bản React.
- **V–VI** — Dùng tích hợp GitHub hiện tại và scope project của Herdsman. Dùng state cục bộ cho điều hướng chi tiết. Không cần thêm dependency hay store.
- **Giao diện** — Dùng Tabs, Button, Badge, Alert, Empty và token sáng/tối hiện có. Mọi nhãn của app dùng tiếng Anh.

Đối chiếu lại sau thiết kế đạt cả sáu nguyên tắc. Luồng đọc snapshot cũ và xác minh tài khoản được kiểm tra bằng test.

## Project Structure

### Documentation (this feature)

- `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/pull-requests.md`, `quickstart.md`, `tasks.md`.

### Source Code (repository root)

- `src/components/layout/PullRequests.tsx` — Điều hướng, phạm vi và trạng thái từ snapshot.
- `src/components/layout/PullRequestDetails.tsx` — Chi tiết và cách trình bày các trạng thái chung.
- `src-tauri/src/pull_requests.rs` — Bổ sung metadata từ truy vấn đang dùng và đọc tương thích snapshot.
- `tests/unit/pullRequests.test.tsx` — Kiểm thử qua AppShell.

**Structure Decision** — Dùng cùng đường dẫn từ thanh điều hướng, sidebar và toast. Đưa phần hiển thị tiến độ sang component cùng thư mục để giữ luồng điều hướng tập trung.

## Complexity Tracking

Thiết kế đáp ứng kiểm tra constitution.
