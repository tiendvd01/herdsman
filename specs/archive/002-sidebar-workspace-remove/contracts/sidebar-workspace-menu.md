# UI Contract: menu workspace ở sidebar

## Nút trigger

| Thuộc tính | Giá trị |
|---|---|
| Vị trí | Cuối dòng workspace trong sidebar, trước số session đang chạy |
| Hiện | khi hover dòng, khi nút được focus bằng bàn phím, khi menu đang mở |
| `aria-label` | `Options for workspace <tên workspace>` (tên rỗng → `New workspace`) |
| Bấm | mở menu; KHÔNG chọn workspace |

## Mục trong menu

| Mục | Kiểu | Kết quả |
|---|---|---|
| Rename | thường | mở hộp "Rename workspace" |
| Archive | thường | mở hộp xác nhận "Archive workspace?" |
| — | separator | |
| Delete workspace | nguy hiểm (màu destructive) | mở hộp xác nhận "Delete workspace?" |

## Hộp xác nhận (dùng chung với header)

- Archive: "The workspace is hidden from the sidebar; its conversation history is kept and still searchable. Running sessions will stop."
- Delete: "The workspace and its session history are removed from Herdsman. Running sessions will stop. The project folder and the engine’s original transcripts are not deleted."
- Workspace dùng worktree còn tồn tại: checkbox "Also delete worktree <branch>" (mặc định bật khi Delete, tắt khi Archive); nếu bật và worktree bẩn → khung cảnh báo liệt kê file.

## Lệnh backend dùng (không đổi)

`workspace_rename(id, name)`, `workspace_archive(id, removeWorktreeDir, confirmDirty)`, `workspace_delete(id, removeWorktreeDir, confirmDirty)`, `workspace_dirty_check(id)` — xem [contracts tauri-commands của 001](../../001-herdsman-use-cases/contracts/tauri-commands.md).
