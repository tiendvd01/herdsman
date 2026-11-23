# Implementation Plan: Tăng kích thước giao diện ở zoom 100%

**Branch** — `master`  
**Date** — 2026-11-23  
**Spec** — [Đặc tả](spec.md)

## Summary

Áp dụng hệ số 1,1 tại điểm chuyển mức zoom đã chọn thành tỷ lệ hiển thị trong `src/lib/uiZoom.ts`. Cả WebView Tauri và bản xem trước trình duyệt dùng cùng phép tính. Mức đã chọn và cỡ chữ nội dung vẫn dùng các giá trị hiện có.

## Technical Context

- Desktop macOS, TypeScript, React và Tauri 2.
- Zustand lưu mức zoom và cỡ chữ nội dung. Điểm khởi động áp dụng cả hai trước khi React render.
- Vitest kiểm tra tỷ lệ hiển thị, nhãn và tùy chọn. Bản xem trước kiểm tra kích thước và bố cục. Tauri xác nhận đường zoom native.
- Giới hạn cửa sổ hiện tại là 960 × 600. Bố cục sidebar dùng không gian còn lại sau khi zoom. Các hộp thoại dùng phần trăm vùng hiển thị để vừa cửa sổ khi CSS zoom được áp dụng. Thanh công cụ soạn thảo xuống hàng khi thiếu chỗ. Giảm chiều rộng tối thiểu dự trữ cho hội thoại từ 400 xuống 396 để sidebar vừa ở 960 × 600 và mức zoom tối đa.

## Constitution Check

Đạt trước nghiên cứu và sau thiết kế.

| Nguyên tắc | Đối chiếu |
| --- | --- |
| I | Thay đổi ở lớp hiển thị. Khi đóng app, agent tiếp tục chạy và cơ chế kết nối lại giữ nguyên. |
| II | Event log và khôi phục hội thoại giữ nguyên. |
| III | Điều khiển agent, duyệt quyền và báo trạng thái giữ nguyên. |
| IV | Nội dung định dạng và danh sách ảo dùng lại luồng render hiện có. Kiểm tra bố cục ở cửa sổ tối thiểu. |
| V | Engine, giao thức và phiên bản SDK giữ nguyên. |
| VI | Cấu trúc Project → Workspace → Session và store hiện có giữ nguyên. |

## Project Structure

- `src/lib/uiZoom.ts` áp dụng tỷ lệ hiển thị.
- `src/main.tsx` và `src/lib/zoomShortcuts.ts` gọi luồng zoom khi khởi động và khi điều chỉnh.
- `src/lib/useLayoutWidths.ts` và `src/components/layout/ResizeHandle.tsx` đọc hệ số CSS thực tế.
- `src/stores/useUiStore.ts` lưu tùy chọn hiện có.
- `tests/unit/uiZoom.test.ts` kiểm tra các đường áp dụng và tùy chọn. `tests/unit/layout.test.ts` kiểm tra sidebar ở mức zoom tối đa.
- [Nghiên cứu](research.md), [mô hình dữ liệu](data-model.md), [hợp đồng UI](contracts/ui-zoom.md), [hướng dẫn xác minh](quickstart.md).
