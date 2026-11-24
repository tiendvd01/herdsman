# Implementation Plan — Chỉnh cỡ chữ code trong Settings

**Branch** `master` · [Spec](spec.md)

- Dùng hai nút shadcn quanh giá trị hiện tại trong Appearance, cạnh bộ chọn họ font code.
- Thêm `codeFontSize` vào tùy chọn Zustand hiện có, với `null` cho Default. Khôi phục và chuẩn hóa cùng dữ liệu hiện tại.
- Áp dụng token CSS khi khởi động và khi chọn cỡ. Dùng chung token cho code block, editor, diff và Log. Code nội tuyến có fallback theo cỡ chữ văn bản như trước.
- Kiểm tra chọn cỡ, khôi phục, Default, CSS production và tính độc lập với cỡ chữ nội dung.

## Constitution Check

Tùy chọn chỉ điều chỉnh hiển thị cục bộ. Phiên agent tiếp tục khi app đóng. Giao diện dùng Button chung và nhãn tiếng Anh. Triển khai giữ cơ chế lưu hiện có và có kiểm thử khôi phục sau khi lưu.

[Research](research.md) · [Data model](data-model.md) · [UI contract](contracts/code-font.md) · [Quickstart](quickstart.md)
