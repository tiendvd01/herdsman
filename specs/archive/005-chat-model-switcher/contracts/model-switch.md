# Contract: Đổi model

Bổ sung cho `specs/001-herdsman-use-cases/contracts/sidecar-socket.md` và `tauri-commands.md`. PROTO giữ nguyên `1` (chỉ thêm, tương thích ngược).

## Socket app → sidecar

| Lệnh | Tham số | Trả về |
|---|---|---|
| `list_models` | `{}` | `{type:"models", models: ModelOption[], current: string\|null}`, hoặc `{type:"error", code:"unsupported"}` nếu engine không có danh sách. Sidecar cũ trả `code:"unknown_command"`. |
| `set_model` | `{model: string}` | `{type:"ack"}` + event `model_changed` (chỉ khi model khác model hiện tại). `{type:"error", code:"bad_model"}` nếu `model` rỗng hoặc không phải string; `code:"engine"` nếu engine từ chối. |

`ModelOption` = `{value, display_name, description, resolved_model?}`.

## Event sidecar → app

| `type` | Ghi log | Trường |
|---|---|---|
| `model_changed` | ✓ | `model, previous` |
| `turn_end` | ✓ | thêm `model?` |

## Lệnh Tauri

| Lệnh | Tham số | Trả về / lỗi |
|---|---|---|
| `session_list_models` | `{id}` | `{models: ModelOption[], current: string\|null}`. Lỗi `unsupported` (gồm cả khi sidecar trả `unknown_command`), `sidecar_closed`, `timeout`. |
| `session_set_model` | `{id, model}` | `()`. Ghi `sessions.model` sau ack. Lỗi `bad_model`, `engine`, `sidecar_closed`, `timeout`. |

## Contract test bắt buộc (`sidecar/test/model.contract.test.mjs`)

1. Echo: `list_models` trả ≥ 2 model và `current` khớp model của session.
2. `set_model` sang model khác → ack, event `model_changed{model, previous}` có seq; lượt kế tiếp có `turn_end.model` = model mới.
3. `set_model` trùng model hiện tại → ack, không có event `model_changed`.
4. `set_model{model:""}` → `error bad_model`, không có event.
5. Đổi model rồi kill sidecar, chạy lại cùng data-dir → `session_started.model` = model đã chọn.
6. Đổi model khi đang chạy lượt `slow` → lượt đó vẫn kết thúc với `interrupted:false`.
