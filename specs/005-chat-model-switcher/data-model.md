# Data Model: Đổi model ngay trong khung chat

Không thêm bảng hay cột. Tính năng dùng lại trường đã có và thêm một loại event.

## Session (đã có)

| Trường | Nơi lưu | Thay đổi |
|---|---|---|
| `model` | `sessions.model` (SQLite), `meta.json` của sidecar | Giờ người dùng đổi được. Giá trị là `value` engine chấp nhận: alias (`sonnet`) hoặc id đầy đủ (`claude-opus-5-5`). `null` = mặc định của engine. |

Quy tắc:
- Chỉ đổi sau khi sidecar ack `set_model` (FR-004).
- Event `engine_session` (lúc engine khởi động) có thể ghi đè bằng id đã resolve. Đây là cùng một model, `modelLabel` khớp được qua `resolvedModel`.

## ModelOption (mới, không lưu bền)

Do engine trả về qua `list_models`, sidecar cache trong bộ nhớ, UI cache theo session.

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `value` | string | Mã gửi lại trong `set_model` |
| `display_name` | string | Tên hiển thị |
| `description` | string | Có thể rỗng |
| `resolved_model` | string? | Id đầy đủ mà alias trỏ tới |

## Event `model_changed` (mới, ghi log)

`{seq, ts, type: "model_changed", model: string, previous: string | null}`

- Chỉ ghi khi model thực sự đổi (khác model hiện tại).
- Phát lại: UI đặt `view.model = model` và chèn notice "Switched model to …". `run_view` cập nhật `sessions.model` nếu `seq > last_seen_seq`.

## `turn_end` (đã có, thêm trường tuỳ chọn)

`model?: string`: model engine báo đã dùng cho lượt đó.

## Trạng thái của điều khiển chọn model (UI)

```
idle ──mở menu──► loading ──ok──► ready ──chọn khác──► applying ──ack──► idle (model mới)
                     │                                     └─error──► idle (model cũ) + toast
                     └─error: unsupported / unknown_command ──► disabled (tooltip)
                     └─error khác ──► error (nút Retry trong menu)
```
