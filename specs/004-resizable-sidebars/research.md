# Research: Kéo đổi độ rộng hai sidebar

## R1. Tự viết thanh kéo hay thêm thư viện

- **Decision**: Tự viết một component `ResizeHandle` nhỏ (Pointer Events + pointer capture), không thêm dependency.
- **Rationale**: Bố cục chỉ có hai cột cố định quanh một cột co giãn; cần ~100 dòng. Thư viện panel (react-resizable-panels…) quản lý kích thước theo phần trăm và tự lưu storage, chồng chéo với store Zustand đang lưu tuỳ chọn giao diện, và constitution VI yêu cầu giải thích mọi dependency mới.
- **Alternatives considered**: `react-resizable-panels` (mạnh nhưng dùng %, phải bọc lại toàn bộ AppShell); CSS `resize: horizontal` (không có giới hạn động, không có bàn phím/nhấp đúp, giao diện xấu).

## R2. Bắt chuột khi kéo ra ngoài cửa sổ / qua iframe, xterm

- **Decision**: `setPointerCapture` trên handle lúc `pointerdown`; kết thúc ở `pointerup`, `pointercancel` và `lostpointercapture`. Khi đang kéo, gắn class lên `<body>` để đặt `cursor: col-resize` và `user-select: none` toàn trang.
- **Rationale**: Pointer capture gửi mọi `pointermove` về handle kể cả khi chuột đi qua terminal (xterm) hay ra ngoài cửa sổ, nên không bôi đen chữ, không bấm nhầm nút (FR-005) và không "dính" trạng thái kéo (edge case thả ngoài cửa sổ). `lostpointercapture` bảo đảm luôn dọn trạng thái.
- **Alternatives considered**: lắng nghe `mousemove` trên `window` + overlay phủ màn hình (nhiều code hơn, dễ sót khi chuột rời WebView).

## R3. Không làm di chuyển cửa sổ (Tauri drag region)

- **Decision**: Handle là phần tử riêng, không có `data-tauri-drag-region`, `z-index` cao hơn nội dung sidebar.
- **Rationale**: Tauri chỉ kéo cửa sổ khi phần tử nhận `mousedown` có thuộc tính `data-tauri-drag-region`. Handle nằm đè lên mép nên nhận sự kiện thay cho vùng tiêu đề ở đoạn mép đó; phần còn lại của thanh tiêu đề vẫn kéo cửa sổ như cũ.

## R4. Giữ hiệu năng khi kéo (SC-002)

- **Decision**: Độ rộng đặt bằng inline `style.width` trên `<aside>`; cập nhật store tối đa một lần mỗi frame (`requestAnimationFrame`). Chỉ `Sidebar`, `RightPanel` và hook bố cục đọc độ rộng; vùng hội thoại là `flex-1` nên không re-render.
- **Rationale**: Hội thoại dùng virtual list và có thể đang stream; tránh re-render nó khi kéo. Ghi localStorage của `persist` mỗi frame là JSON nhỏ, chấp nhận được.
- **Alternatives considered**: chỉ lưu khi `pointerup` (thêm state nháp, không cần thiết ở quy mô này).

## R5. Cửa sổ hẹp và vùng hội thoại tối thiểu (FR-004)

- **Decision**: Tách **độ rộng lưu** (ý muốn của người dùng) và **độ rộng hiển thị** (sau khi giới hạn theo cửa sổ). Hàm thuần `layoutWidths({ left, right, leftOpen, rightOpen, viewport })` trả độ rộng hiển thị: nếu thiếu chỗ cho 400px hội thoại thì co side panel phải trước, rồi tới sidebar trái, không dưới mức nhỏ nhất. Khi kéo, giá trị mới cũng bị chặn bởi chỗ còn lại cho phép.
- **Rationale**: Cửa sổ tối thiểu 960px (tauri.conf.json): 200 + 280 + 400 = 880 ≤ 960 nên luôn xếp được ở mức nhỏ nhất. Không ghi đè độ rộng lưu khi cửa sổ tạm hẹp (edge case). Co panel phải trước vì sidebar trái là điều hướng chính.
- **Alternatives considered**: co theo tỉ lệ cả hai (khó đoán với người dùng).

## R6. Nút widen/narrow của side panel và dữ liệu cũ `rightWide`

- **Decision**: Thay `rightWide: boolean` bằng `rightWidth: number`. Nút: nếu `rightWidth > 340` → "Narrow" đặt 340, ngược lại "Widen" đặt 560. Bump `version` của persist lên 1, `migrate`: `rightWide === true` → `rightWidth = 560`, ngược lại 340; `sidebarWidth = 256`.
- **Rationale**: Giữ thao tác quen thuộc (FR-008), không để lại hai nguồn sự thật cho cùng một độ rộng, người dùng cũ không bị nhảy độ rộng sau khi cập nhật.

## R7. Bàn phím và a11y (FR-009)

- **Decision**: Handle có `role="separator"`, `aria-orientation="vertical"`, `aria-label` ("Resize sidebar" / "Resize side panel"), `aria-valuenow/min/max`, `tabIndex=0`. Mũi tên trái/phải: ±16px (với panel phải, mũi tên trái làm **rộng ra** vì mép nằm bên trái). Home/End: về min/max. Enter hoặc nhấp đúp: về mặc định.
- **Rationale**: Theo mẫu WAI-ARIA "Window Splitter".
