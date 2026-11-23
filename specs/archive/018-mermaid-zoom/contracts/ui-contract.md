# UI Contract

- Nút `button[aria-label="Zoom diagram"]` trong figcaption của `[data-testid="mermaid"]`; chỉ có khi diagram đã render.
- Viewer: `role="dialog"`, `data-testid="mermaid-viewer"`, chứa SVG, toolbar:
  `Zoom in`, `Zoom out`, `Reset zoom`, nhãn `data-testid="mermaid-zoom-level"` (vd "100%"), `Close`.
- Phím: Esc đóng; `+`/`=` phóng, `-` thu, `0` đặt lại.
- Wheel + Ctrl/Cmd zoom quanh con trỏ; kéo chuột pan.
