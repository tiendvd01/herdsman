# Implementation Plan: Tooltip cho chữ bị cắt

**Branch**: `master` | **Date**: 2026-11-23 | **Spec**: [spec.md](spec.md)

## Summary

Dùng tooltip chung để hiện đầy đủ văn bản khi nhãn đang bị cắt theo chiều ngang hoặc giới hạn số dòng.

## Technical Context

- **Language/Version** — TypeScript 5.8 và React 18.
- **Primary Dependencies** — Radix Tooltip và Tailwind CSS hiện có.
- **Testing** — Vitest, kiểm tra bố cục với trình duyệt.
- **Target Platform** — App desktop Tauri, ưu tiên macOS.
- **Performance Goals** — Hiện nội dung trong một giây sau hover. Đo khi có yêu cầu mở tooltip.
- **Scale/Scope** — Các nhãn và đoạn xem trước bị cắt ở giao diện desktop.

## Constitution Check

| Nguyên tắc | Đánh giá |
| --- | --- |
| I. Agent độc lập | Tooltip chỉ tồn tại trong giao diện. Tắt app sẽ đóng tooltip, agent tiếp tục chạy. |
| II. Dữ liệu hội thoại | Chỉ đọc văn bản sẵn có từ nhãn. |
| III. Kiểm soát agent | Giữ thao tác của nút, tab và điều khiển session. |
| IV. Hiển thị | Đo khi người dùng hover. Nội dung được render dưới dạng văn bản hoặc markup sẵn có của nhãn. |
| V. Hệ sinh thái | Dùng lớp tooltip của app. Phạm vi thay đổi ở UI. |
| VI. Tổ chức | Dùng tên hiện tại trong cấu trúc project, workspace và session. |

Cổng kiểm tra đạt trước nghiên cứu và sau thiết kế.

## Project Structure

- `src/components/ui/tooltip.tsx` mở rộng cách điều khiển tooltip hiện có.
- `src/components/ui/truncated-text.tsx` cung cấp nhãn dùng chung.
- `src/components/` dùng nhãn chung tại các vị trí cắt chữ.
- `tests/unit/` xác nhận điều kiện mở và đóng.

## Complexity Tracking

Không có ngoại lệ cần giải trình.
