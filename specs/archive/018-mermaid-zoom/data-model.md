# Data Model

Không có dữ liệu lưu trữ. Trạng thái UI tạm thời trong `MermaidViewer`:

| Trường | Kiểu | Ghi chú |
|---|---|---|
| open | boolean | state ở `Mermaid` |
| scale | number | 0,25–8 × mức vừa khít |
| tx, ty | number (px) | dịch chuyển |
| fitScale | number | tính từ kích thước SVG và khung |

Chuyển trạng thái: mở → fit (scale = 1×fit, căn giữa); zoom/pan thay đổi; "Đặt lại" → fit; đóng → bỏ toàn bộ.
Quy tắc: scale luôn clamp [0,25; 8]; zoom quanh điểm giữ nguyên điểm dưới con trỏ.
