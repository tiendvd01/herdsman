# Quickstart

Chạy `pnpm test tests/unit/lastSessionClose.test.tsx` và `pnpm typecheck` từ thư mục gốc. Bộ kiểm thử đưa sự kiện `Done` tới trước kết quả đóng và kiểm tra chỉ báo trong lúc chờ, đồng thời đối chiếu các trường hợp hủy, lỗi và hoàn thành tự nhiên.

Trong app desktop đang kết nối runtime, mở một Session đang làm việc, chọn **Stop and close** và quan sát tới khi tab biến mất. Lặp lại theo [SC-001](spec.md#measurable-outcomes). Trong mỗi theme thực hiện 10 lần với Session đang làm việc và 10 lần với Session chờ phê duyệt. Mỗi nhóm cần ít nhất một phản hồi chậm có kiểm soát. Ghi số lần đèn nháy xanh theo từng nhóm.

Để bổ sung bằng chứng SC-002 cho lượt bị ngắt, bắt đầu một lượt đủ dài, chờ đèn hiện `Working`, rồi chọn **Interrupt**. Quan sát tab khi lượt kết thúc và xác nhận đèn không chuyển sang `Done`.

## Kết quả xác minh

- FR-001 — Kiểm thử mô phỏng `Done` đến sớm cho Session đang làm việc và đang chờ duyệt. Tab được chọn và tab nền đều hiển thị spinner trung tính trong lúc chờ.
- FR-002 và FR-003 — Kiểm thử xác nhận tab biến mất khi thành công, giữ trạng thái khi hủy, và giữ tab cùng thông báo lỗi nếu thao tác thất bại.
- FR-004 — Kiểm thử xác nhận đèn trên tab khác cập nhật độc lập và lượt hoàn thành tự nhiên vẫn hiện đèn `Done`. Tab đã hiện `Done` trước thao tác đóng giữ chỉ báo đó trong lúc chờ.
- `pnpm test` đạt 217/217. Chuỗi 40 lượt kiểm tra trực quan của SC-001 trên app desktop ở hai theme vẫn cần được xác nhận.
- Kiểm thử FR-004 dùng tín hiệu hoàn thành lượt từ sidecar qua runtime và kiểm tra tab vẫn mở, đèn chuyển sang `Done` rồi trở về `Working` ở lượt tiếp theo.
