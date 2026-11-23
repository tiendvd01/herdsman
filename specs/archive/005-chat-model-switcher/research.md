# Research: Đổi model ngay trong khung chat

## R1. Nguồn danh sách model

- **Decision**: Lấy từ engine qua lệnh socket mới `list_models`. Engine Claude gọi `Query.supportedModels()` của Agent SDK (0.3.329), trả `ModelInfo[]` gồm `value`, `displayName`, `description`, `resolvedModel?`. Nếu chưa có `Query` (session chưa gửi lượt nào hoặc query đã kết thúc), engine khởi động query với hàng đợi input rỗng (như khi gửi prompt đầu tiên, chỉ là chưa đẩy tin nào). `supportedModels()` sẽ chờ bước initialize rồi trả kết quả. Kết quả được cache trong bộ nhớ sidecar.
- **Rationale**: Không hard-code model trong app (constitution V, giả định trong spec). SDK đã lọc theo `availableModels` của settings user/project. Khởi động query sớm không tốn token vì chưa có tin nhắn nào.
- **Alternatives**: Hard-code danh sách trong UI: bị loại vì phải sửa app mỗi khi có model mới. Gọi API Anthropic `/models`: vi phạm constitution V (không gọi model API trực tiếp) và không biết alias của Claude Code.

## R2. Áp dụng model mới

- **Decision**: Lệnh `set_model{model}` (đã có) được làm chặt hơn: kiểm tra chuỗi khác rỗng; nếu trùng model hiện tại thì chỉ ack, không ghi event. Ngược lại gọi `engine.setModel` (`Query.setModel` khi có query; nếu chưa có thì lưu lại cho lần `start()` sau qua `options.model`), lưu `meta.model`, rồi ghi event `model_changed{model, previous}` vào log. Lỗi thì trả `{type:"error"}` và không ghi event.
- **Rationale**: `setModel` của SDK đổi model cho "subsequent responses", không ngắt lượt đang chạy và không đụng `canUseTool` đang chờ, đúng FR-005. Ghi event giúp FR-012 (biết từ lượt nào model đổi) và giúp app khôi phục khi phát lại log.
- **Lưu ý**: nếu đổi giữa lúc agent đang chạy một lượt nhiều bước tool, các lời gọi model *sau* thời điểm đổi trong cùng lượt có thể đã dùng model mới. Lượt không bị ngắt; spec chỉ yêu cầu không ngắt và lượt kế tiếp dùng model mới, nên chấp nhận được.

## R3. Lưu bền và khôi phục

- **Decision**: Có ba nơi lưu, đều đã có sẵn: `meta.json` của sidecar (`meta.model`), cột `sessions.model` trong SQLite, và event `model_changed` trong log. Lệnh Tauri `session_set_model` ghi DB ngay sau khi sidecar ack. `run_view` cũng cập nhật DB khi gặp `model_changed` mới (seq > last_seen), để phòng trường hợp app tắt ngay sau ack. Khi resume, sidecar đọc `meta.model` (app không truyền `--model`), nên agent dùng đúng model đã chọn.
- **Trả lời Constitution I** (app tắt giữa chừng): sidecar đã đổi model và ghi meta + log trước khi ack. App tắt thì agent vẫn dùng model mới; app mở lại thì phát log và cập nhật DB. Nếu app tắt *trước* khi lệnh tới sidecar thì không có gì thay đổi, nút vẫn hiện model cũ (đúng FR-004).

## R4. Agent cũ (chạy từ bản app trước) không biết `list_models`

- **Decision**: Sidecar cũ trả `unknown_command`. UI coi đó là "không đổi được": nút bị vô hiệu, tooltip ghi "Restart this session to switch models". PROTO giữ nguyên 1, vì thêm lệnh là thay đổi tương thích ngược.
- **Rationale**: Agent sống qua các lần nâng cấp app (constitution I), nên trường hợp này chắc chắn sẽ xảy ra. Không cần tăng PROTO, vì tăng PROTO sẽ làm mọi agent cũ mất kết nối.

## R5. Tên hiển thị

- **Decision**: Hàm thuần `modelLabel(model, models?)` trong `src/lib/model.ts`: nếu khớp `value` hoặc `resolvedModel` của một mục trong danh sách thì lấy `displayName`; nếu không thì dùng quy tắc `formatModel` hiện có (`claude-opus-5-5` → "Opus 5.5"); còn lại hiện nguyên văn. Null → "Default". Header và nút trong composer dùng chung hàm này.
- **Rationale**: Alias (`sonnet`, `opus[1m]`) và id đầy đủ đều hiện đúng; FR-002 và FR-008 khớp nhau.

## R6. Xác minh lượt dùng model mới (SC-003)

- **Decision**: Engine Claude ghi `model` của assistant message cuối cùng vào `turn_end.model` (trường tuỳ chọn, tương thích ngược). Engine Echo ghi model hiện tại vào câu trả lời và vào `turn_end.model`.
- **Rationale**: Test và quickstart kiểm tra được mà không cần đọc transcript gốc.

## R7. Engine Echo

- **Decision**: Echo trả danh sách giả `echo` ("Echo") và `echo-fast` ("Echo Fast"), đổi model ngay lập tức. Contract test và `?mock` dùng danh sách này.
- **Rationale**: Echo sinh ra để demo và test không tốn API; thiếu model giả thì không test được luồng chính.

## R8. Lấy danh sách phía UI

- **Decision**: TanStack Query key `['models', sessionId]`, chỉ fetch khi mở menu lần đầu (`enabled` theo trạng thái mở), `staleTime: Infinity`, retry 1. Đổi model là mutation: chờ ack, sau đó invalidate `sessions`. Không cập nhật lạc quan; trong lúc chờ, nút hiện spinner (FR-004: chỉ hiện model mới khi agent đã áp dụng).
- **Alternatives**: Fetch ngay khi mở session: bị loại vì với Claude, việc này khởi động query sớm cho mọi session dù người dùng không mở menu.
