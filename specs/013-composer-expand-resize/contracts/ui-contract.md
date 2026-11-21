# UI contract: tay nắm resize của ô chat

| Thuộc tính | Giá trị |
|---|---|
| Hiện khi | `expanded === true` (không hiện ở chế độ thường) |
| Vị trí | cạnh trên khung ô chat, chiều ngang toàn khung, vùng bắt ~8px |
| Role | `separator`, `aria-orientation="horizontal"`, `aria-label="Resize editor"`, `aria-valuenow/min/max` = chiều cao hiệu lực / min / max hiệu lực, `tabIndex=0` |
| Con trỏ | `row-resize`; không có đường kẻ khi hover/kéo; chỉ hiện đường kẻ `ring` khi focus bàn phím |
| Chuột | kéo lên = cao thêm, kéo xuống = thấp đi; kẹp min..max; nhả chuột/mất pointer capture kết thúc kéo |
| Bàn phím | ↑ +16px, ↓ −16px, Home = min, End = max, Enter = reset 300 |
| Double-click | reset 300 |
| Mặc định | 300px khi chưa từng kéo |
