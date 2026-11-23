# Data Model: Thanh cuộn mảnh theo theme

Không có dữ liệu lưu trữ. Chỉ có token màu CSS:

| Token | Light (`:root`) | Dark (`.dark`) | Nền tối cố định (`.bg-term-bg`) |
|-------|-----------------|----------------|-------------------------------|
| `--scrollbar-thumb` | `#909098` | `#63636b` | `#63636b` |
| `--scrollbar-thumb-hover` | `#71717a` | `#8b8b93` | `#8b8b93` |

Quy tắc: thumb phải đạt ≥ 3:1 với nền của vùng chứa (`--background`, `--surface`, `--term-bg`).
