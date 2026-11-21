# Research: Vòng quay "đang chạy"

## 1. Biểu tượng vòng quay
- **Decision**: Component `Spinner` bọc `Loader2` của lucide-react với `animate-spin`, màu `text-st-working`.
- **Rationale**: `Loader2` + `animate-spin` đã được dùng ở `ModelSwitcher`/`RightPanel`, nên đồng bộ hình ảnh và không thêm dependency.
- **Alternatives**: CSS border-spinner tự viết (thêm CSS, lệch phong cách); thay luôn `hs-pulse` (không phải vòng quay, không đáp ứng yêu cầu).

## 2. Nguồn trạng thái "đang chạy"
- **Decision**: Dùng `useUiStore.statuses[sessionId].state === 'working'`, giống `statusOf` ở `WorkspaceView`; workspace chạy khi ∃ phiên có `workspace_id` khớp và `state === 'working'`.
- **Rationale**: Đã realtime, đã dùng để vẽ chấm và đếm số phiên. `blocked`/`error` bị loại theo FR-004 (Sidebar hiện đếm `blocked` như "running" ở chân trang; không đổi, ngoài phạm vi).
- **Alternatives**: Truy vấn server (thừa); tính theo `s.status` tĩnh (không realtime).

## 3. Phạm vi `StatusDot`
- **Decision**: Thêm prop `spin?: boolean`. Khi `spin && status==='working'` hiện Spinner, còn lại giữ chấm. Tab bật `spin`.
- **Rationale**: Spec giới hạn ở thanh tab và thanh bên; các chỗ khác (CommandDialog, HistoryPopover, RightPanel) giữ chấm để không đổi ngoài yêu cầu.
- **Alternatives**: Đổi toàn cục (vượt phạm vi, mâu thuẫn Assumptions).

## 4. Không dịch bố cục
- **Decision**: Spinner kích thước `size-3` trong ô cố định `size-3` (chấm 6px căn giữa trong cùng ô) cho tab; hàng workspace dành sẵn ô cố định khi cần.
- **Rationale**: FR-008, SC-005.
- **Alternatives**: Để Spinner tự do (tab nhảy ~6px mỗi lần đổi trạng thái).

## 5. Giảm chuyển động
- **Decision**: Dùng biến thể Tailwind `motion-reduce:animate-none`; chỉ dừng xoay, icon vẫn phân biệt được với chấm.
- **Rationale**: FR-007.
- **Alternatives**: Ẩn hẳn spinner (mất tín hiệu).

## 6. Truy cập
- **Decision**: Spinner có `role="img"` và `aria-label="Working"` (dùng `STATUS_LABEL.working`) thay cho chấm; hàng workspace dùng nhãn "Agent running" để không trùng với tên tab.
- **Rationale**: FR-006; giữ nguyên truy vấn test hiện có theo aria-label "Working".
