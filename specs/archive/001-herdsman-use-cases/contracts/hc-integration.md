# Contract — Tích hợp `hc` (herdr-core)

Phiên bản tối thiểu: `hc` 0.1.21, protocol generation 1. Kiểu Rust sinh từ `hc schema`.

## Label (Herdsman gắn cho mọi terminal của mình)

| Label | Giá trị | Có ở |
|---|---|---|
| `herdsman.app` | `1` | mọi terminal |
| `herdsman.kind` | `session` \| `task` | mọi terminal |
| `herdsman.project` | project id | mọi terminal |
| `herdsman.workspace` | workspace id | session |
| `herdsman.session` | session id | session |
| `herdsman.engine` | `claude` \| `codex` | session |

Mất SQLite → dựng lại project/workspace/session tối thiểu từ label (`terminal.list --all`).

## Method dùng

| Method | Dùng cho |
|---|---|
| `hello` | kiểm tra protocol generation |
| `events.subscribe` | status / created / finished / lost (lọc `herdsman.app=1`) |
| `terminal.run` | chạy sidecar (`outlive_parent: true`) và background task |
| `terminal.list` / `terminal.get` | khôi phục khi mở app; cây `parent`/`children` cho Agents |
| `terminal.attach` | Log view (xterm.js) |
| `terminal.kill` / `terminal.rm` | kill session/task, xoá project |
| `terminal.label` | cập nhật label (ví dụ đổi `herdsman.session` khi có id engine) |

## Lệnh chạy sidecar

```text
terminal.run {
  argv: ["<bundled node>", "<Resources>/herdsman-agent.mjs",
         "--session", <sid>, "--cwd", <workspace.work_dir>, "--engine", <engine>,
         "--permission-mode", <mode>, ["--resume"]],
  cwd: <workspace.work_dir>,
  outlive_parent: true,
  env: { CLAUDE_CONFIG_DIR | CODEX_HOME: <account dir> },
  labels: { ...bảng trên }
}
```

`cwd` là **thư mục làm việc của workspace** (khác technical.md §3.1 cũ dùng `project.path`).

## Status

Sidecar báo trạng thái cho `hc` qua OSC 7501 (`working` / `idle` / `done` / `blocked` + `kind` / `error`). Cú pháp byte chưa kiểm chứng (research R10); nếu không làm được, Herdsman vẫn lấy status qua socket, chỉ `hc ls`/Herdr không thấy đúng trạng thái.

## Contract test bắt buộc

1. `terminal.run` với label → `terminal.list` lọc theo `herdsman.app=1` thấy terminal đúng label.
2. Tắt app (đóng mọi kết nối) → terminal vẫn `live`.
3. `events.subscribe` nhận `status` khi sidecar đổi trạng thái (sau khi OSC 7501 được kiểm chứng).
4. `terminal.kill` → event `finished`; `terminal.rm` → biến mất khỏi `terminal.list --all`.
5. Agent con tạo bằng `hc run --bg` từ trong session → có `parent` = terminal của session.
