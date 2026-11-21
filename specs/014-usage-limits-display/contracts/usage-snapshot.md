# Contract: `usage_snapshot` và UI chỉ báo

## Event (sidecar → UI)
```json
{ "seq": 42, "ts": 1790000000000, "type": "usage_snapshot",
  "context_pct": 42.3,
  "limits": { "five_hour": { "pct": 30, "resets_at": "2026-11-22T05:00:00Z" },
              "seven_day": { "pct": 12, "resets_at": "2026-11-27T00:00:00Z" } } }
```
- Phát đúng một lần sau mỗi `turn_end`, chỉ khi lấy được ít nhất `context_pct` hoặc `limits`.
- UI cũ gặp type lạ MUST bỏ qua (tương thích ngược).

## UI
- Vị trí: thanh công cụ composer, nhóm bên phải, trước nút gửi/Interrupt.
- Nội dung: `ctx 42%` `5h 30%` `7d 12%`; font mono nhỏ, không progress bar.
- `aria-label` mỗi chỉ số đọc đủ ("Context đã dùng 42 phần trăm"); tooltip hạn mức: "Đặt lại sau 2 giờ 10 phút".
- Màu: muted (<80), cảnh báo (≥80), nguy hiểm (≥95) dùng token màu theme có sẵn, đạt tương phản ở cả sáng/tối.
- Cửa sổ hẹp: thanh công cụ đã `flex-wrap`; chỉ báo có thể xuống dòng, không đẩy nút khác ra ngoài.
