# Contract — Socket app ↔ `herdsman-agent`

Mỗi session một Unix socket: `<app data>/sock/<sid>.sock`. Khung tin: NDJSON (một JSON mỗi dòng, UTF-8).
Phiên bản giao thức: `proto: 1` trong `hello`. Thay đổi không tương thích ngược MUST tăng `proto` (constitution II).

## App → sidecar

| Lệnh | Payload | Phản hồi |
|---|---|---|
| `hello` | `{proto: 1}` | `{type:"hello", proto, session_id, engine, last_seq}` |
| `subscribe` | `{from_seq}` | phát lại event có `seq > from_seq`, rồi `{type:"live"}`, rồi stream trực tiếp |
| `prompt` | `{text, images?: [{media_type, data_b64}]}` | `{type:"ack"}` |
| `interrupt` | `{}` | `{type:"ack"}`; engine dừng lượt, event `turn_end{interrupted:true}` |
| `permission_response` | `{id, decision: "allow"\|"deny", updated_input?}` | `{type:"ack"}` hoặc `{type:"error", code:"unknown_request"}` |
| `set_permission_mode` | `{mode: "ask"\|"accept_edits"\|"bypass"}` | `{type:"ack"}` + event `permission_mode_changed` |
| `list_models` | `{}` | `{type:"models", models: [{value, display_name, description, resolved_model?}], current}` hoặc `error unsupported` (specs/005) |
| `set_model` | `{model}` (chuỗi khác rỗng) | `{type:"ack"}` + event `model_changed` khi model đổi; `error bad_model` / `engine` (specs/005) |
| `shutdown` | `{}` | đóng input, sidecar thoát; terminal `hc` → `finished` |

## Sidecar → app: `AgentEvent`

Mọi event ghi log có `{seq, ts, type, ...}`. `seq` tăng dần, không reset khi resume.

| `type` | Ghi log | Trường chính |
|---|---|---|
| `session_started` | ✓ | `engine, model, cwd, permission_mode, resumed: bool` |
| `user_message` | ✓ | `text, images?, source: "app"\|"hc_send"` |
| `delta` | ✗ (chỉ live) | `message_id, text` |
| `assistant_message` | ✓ | `message_id, blocks: [{kind:"text"\|"thinking", text}]` |
| `tool_use` | ✓ | `tool_use_id, tool, input, parent_tool_use_id?` |
| `tool_result` | ✓ | `tool_use_id, is_error, content` |
| `permission_request` | ✓ | `id, tool, input, cwd` |
| `permission_resolved` | ✓ | `id, decision, by: "user"\|"mode"` |
| `permission_mode_changed` | ✓ | `mode` |
| `model_changed` | ✓ | `model, previous` (specs/005) |
| `status` | ✓ | `state: idle\|working\|blocked\|done\|error, kind?, msg?` |
| `turn_end` | ✓ | `usage {input_tokens, output_tokens, ctx_pct}, interrupted, model?` |
| `error` | ✓ | `code, message, recoverable` |

Quy tắc:
- `permission_request` không hết hạn; sau khi app nối lại, request chưa có `permission_resolved` là còn treo.
- Nội dung text/markdown là dữ liệu không tin cậy; app MUST render an toàn (FR-015).

## Contract test bắt buộc

1. `subscribe{from_seq: n}` trả đúng các event `seq > n`, không trùng, không thiếu, rồi `live`.
2. Ngắt kết nối giữa chừng, nối lại với `last_seen_seq` → không mất event.
3. `permission_request` khi không có app nối → sidecar chờ; nối lại → nhận request; `allow` → engine chạy tiếp.
4. Resume sau khi sidecar chết: `seq` tiếp tục từ giá trị cũ + 1.
5. `proto` khác → sidecar trả `{type:"error", code:"proto_mismatch"}` và đóng kết nối.
