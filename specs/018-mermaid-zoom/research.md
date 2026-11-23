# Research: Mermaid zoom

## Quyết định
1. **Khung phóng to**: dùng `Dialog` Radix có sẵn (`ui/dialog.tsx`) với class override gần toàn màn hình. Lý do: có sẵn Esc, click nền, focus trap, aria. Thay thế: overlay tự viết (phải tự làm focus/Esc) — loại.
2. **Nguồn SVG**: truyền chuỗi `svg` đã render từ `Mermaid` vào viewer, không render lại. Lý do: nhanh, cùng theme, không trùng id. Đổi theme khi đang mở: `Mermaid` re-render svg mới → viewer nhận prop mới.
3. **Zoom/pan**: CSS `transform: translate() scale()` trên wrapper, `transform-origin: 0 0`; SVG vector nên sắc nét. Thay thế: thư viện pan-zoom — loại (thêm dependency không cần).
4. **Kích thước vừa khít**: đọc `viewBox`/kích thước SVG, scale = min(khungW/svgW, khungH/svgH) có đệm; tính lại khi khung đổi kích thước (ResizeObserver). Mức % hiển thị tương đối so với mức vừa khít = 100%.
5. **Giới hạn zoom**: 25%–800% so với vừa khít; bước nút ×1,25.
6. **Input**: wheel chỉ zoom khi có Ctrl/Cmd (pinch trackpad phát wheel với ctrlKey); wheel thường để pan. Kéo bằng pointer events với pointer capture. Bàn phím: `+`/`-`/`0`, phím mũi tên pan.
7. **Nút phóng to**: đặt trong figcaption cạnh nút Source, chỉ hiện khi có `svg`; ẩn khi đang xem source không cần thiết vẫn hiện.
8. **i18n/nhãn**: app dùng nhãn tiếng Anh trong Mermaid.tsx → dùng aria-label tiếng Anh ("Zoom diagram", "Zoom in", "Zoom out", "Reset zoom", "Close").
