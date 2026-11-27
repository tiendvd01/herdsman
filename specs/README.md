# Tài liệu tính năng Herdsman

Mỗi module nhóm các feature cùng phạm vi. Tìm feature theo mã hoặc tên bên dưới. Mỗi thư mục feature giữ spec và các tài liệu đi kèm như plan, tasks và contracts.

Khi thêm feature, chọn module và đặt tài liệu tại `specs/<module>/<mã>-<tên-feature>/`. Mã feature được cấp chung cho toàn bộ `specs/`. Với Spec Refine, nêu rõ đường dẫn `spec.md` trong yêu cầu.

Khi chạy script tạo feature trực tiếp, truyền `--module <module>` vào `.specify/scripts/bash/create-new-feature.sh`.

## Project, workspace và worktree

- [028 · Project, workspace và worktree](projects-workspaces/028-projects-workspaces/spec.md)
- [045 · Chọn branch có sẵn cho workspace worktree](projects-workspaces/045-select-worktree-branch/spec.md)
- [052 · Sắp xếp lại tab, workspace và project](projects-workspaces/052-reorder-navigation-items/spec.md)
- [062 · Quản lý skills theo project](projects-workspaces/062-manage-project-skills/spec.md)
- [068 · Đóng workspace khi đóng session cuối](projects-workspaces/068-close-empty-workspace/spec.md)
- [069 · Hiện pull request dưới worktree](projects-workspaces/069-show-worktree-prs/spec.md)
- [070 · Tạo session từ workspace trống](projects-workspaces/070-create-session-empty-workspace/spec.md)
- [071 · Sửa cấp skill và quản lý MCP theo project](projects-workspaces/071-project-skills-mcps/spec.md)
- [072 · Bật tắt mọi MCP server theo project](projects-workspaces/072-project-mcp-toggles/spec.md)
- [084 · Worktree Postscript](projects-workspaces/084-worktree-postscript/spec.md)
- [087 · Chỉnh Worktree Postscript bằng CodeMirror](projects-workspaces/087-edit-postscript-codemirror/spec.md)
- [088 · Khởi tạo CodeGraph theo project](projects-workspaces/088-init-codegraph/spec.md)
- [090 · Dùng skill trong project với Codex](projects-workspaces/090-codex-project-skills/spec.md)

## Phiên agent, trạng thái và thông báo

- [029 · Vòng đời session, quyền và quan sát agent](agent-sessions/029-agent-sessions/spec.md)
- [039 · Sửa đèn báo khi đóng tab Session](agent-sessions/039-fix-session-tab-status/spec.md)
- [040 · Tiếng báo khi agent hoàn thành](agent-sessions/040-agent-completion-chime/spec.md)
- [041 · Cài đặt thông báo hoàn thành](agent-sessions/041-notification-settings/spec.md)
- [048 · Session Codex trong Herdsman](agent-sessions/048-codex-sessions/spec.md)
- [049 · Xác nhận đã xem khi focus tab agent](agent-sessions/049-acknowledge-agent-completion/spec.md)

## Hội thoại và soạn tin

- [030 · Hội thoại và soạn tin](conversation/030-conversation-composer/spec.md)
- [044 · Mở tệp từ Rich Conversation](conversation/044-rich-conversation-file-links/spec.md)
- [078 · Hiện toàn bộ lệnh shell](conversation/078-show-shell-command/spec.md)
- [081 · Mở tệp từ thẻ Read và Write](conversation/081-open-tool-files/spec.md)

- [083 · Mở thêm tệp từ Rich Conversation](conversation/083-expand-file-links/spec.md)

## Lịch sử, tìm session và Command Palette

- [031 · Lịch sử, tìm session và Command Palette](history-search/031-session-history-search/spec.md)
- [063 · Panel History cho phiên agent](history-search/063-session-history-panel/spec.md)
- [091 · Phiên Codex CLI trong History](history-search/091-codex-cli-history/spec.md)

## Duyệt, sửa file và xem Git

- [032 · Duyệt, sửa file và xem Git](files-git/032-project-files-git/spec.md)
- [034 · Đồng bộ giao diện Git với Files](files-git/034-align-git-files/spec.md)
- [035 · Icon Material và màu trạng thái Git](files-git/035-file-icons-git-colors/spec.md)
- [037 · Đồng bộ icon file trong Git Changes](files-git/037-sync-git-file-icons/spec.md)
- [038 · Chế độ cây cho Git Changes](files-git/038-git-changes-tree/spec.md)
- [042 · Tìm file trong cây thư mục](files-git/042-search-file-tree/spec.md)
- [043 · Xem trước và tải tệp Markdown](files-git/043-markdown-preview/spec.md)
- [054 · Làm mờ tệp bị Git bỏ qua trong cây tệp](files-git/054-dim-gitignored-files/spec.md)
- [056 · Git Graph có thể đổi chiều cao](files-git/056-resizable-git-graph/spec.md)
- [058 · Git Graph Lane Colors](files-git/058-color-git-graph/spec.md)
- [059 · Inspect Commit Changes](files-git/059-inspect-commit-changes/spec.md)
- [060 · Editor LSP Hover](files-git/060-editor-lsp-hover/spec.md)
- [064 · Theo dõi pull request theo project](files-git/064-track-pull-requests/spec.md)
- [066 · Tinh chỉnh giao diện Pull Requests](files-git/066-refine-pull-requests/spec.md)
- [067 · Mở rộng trang chi tiết Pull Request](files-git/067-expand-pr-details/spec.md)
- [073 · Quay lại danh sách từ chi tiết PR](files-git/073-pr-detail-back/spec.md)
- [074 · Đánh dấu tất cả thông báo PR là chưa đọc](files-git/074-mark-notifications-unread/spec.md)
- [075 · Phân biệt loại thông báo PR](files-git/075-classify-pr-notifications/spec.md)

- [082 · Mở đường dẫn thư mục ẩn](files-git/082-access-hidden-paths/spec.md)

- [085 · Đồng bộ bố cục Pull Requests](files-git/085-align-pull-request-layout/spec.md)

- [086 · Mở chi tiết PR từ thông báo](files-git/086-open-notification-pr/spec.md)

## Giao diện, khả năng tiếp cận và phím tắt

- [033 · Giao diện, bố cục và khả năng tiếp cận](appearance-shortcuts/033-app-shell-appearance/spec.md)
- [036 · Chỉnh cỡ chữ code trong Settings](appearance-shortcuts/036-code-font-settings/spec.md)
- [038 · Đổi giao diện nút chỉnh cỡ chữ code](appearance-shortcuts/038-restyle-size-stepper/spec.md)
- [055 · Theme Preview Picker](appearance-shortcuts/055-theme-preview-picker/spec.md)
- [057 · Quản lý phím tắt](appearance-shortcuts/057-manage-keyboard-shortcuts/spec.md)
- [061 · Theme Git-Ignored Text](appearance-shortcuts/061-theme-git-ignored-text/spec.md)
- [065 · Sidebar danh sách project cho Pull Requests và Skills](appearance-shortcuts/065-add-project-sidebar/spec.md)
- [080 · Rút gọn đường dẫn thư mục cá nhân](appearance-shortcuts/080-shorten-home-paths/spec.md)

## Terminal và cửa sổ output

- [046 · Workspace session picker and terminal](terminal-output/046-workspace-terminal/spec.md)
- [047 · Terminal Appearance](terminal-output/047-terminal-appearance/spec.md)
- [050 · Đóng tab terminal bằng một thao tác](terminal-output/050-close-terminal-tab/spec.md)
- [051 · Xem output shell của Claude khi lệnh đang chạy](terminal-output/051-live-claude-shell-output/spec.md)
- [053 · Cửa sổ nổi xem output của tiến trình hc](terminal-output/053-floating-hc-output/spec.md)
- [076 · Status bar và terminal nổi](terminal-output/076-statusbar-floating-terminal/spec.md)
- [079 · Hạn mức 7 ngày trên thanh trạng thái](terminal-output/079-statusbar-weekly-usage/spec.md)

## Tài liệu chung

[Kiến trúc kỹ thuật](technical.md) và [yêu cầu kinh doanh](business-requirement/BR-001.md) cung cấp bối cảnh toàn app.

[Kho lưu trữ](archive/) giữ các spec, plan, tasks, quickstart và contract trước khi gộp. Mã FR và task ID trong đó thuộc từng spec cũ. Đường dẫn ghi trong bản lưu trữ phản ánh cấu trúc tại thời điểm viết. Các spec hiện hành ghi lại yêu cầu của sản phẩm; hãy kiểm tra code và test khi cần xác nhận mức độ triển khai.
