# Implementation Plan: Cô lập môi trường dev và production

**Branch**: `master` | **Date**: 2026-11-27 | **Spec**: [spec.md](spec.md)

## Summary

`pnpm tauri dev` áp dụng cấu hình Tauri của Herdsman Development. Bản cài dùng định danh production hiện tại. Tiến trình backend lấy môi trường từ loại bản dựng, kiểm tra định danh, cô lập dữ liệu cục bộ, Keychain và tài nguyên Herdsman trong hc. Production tiếp tục dùng cùng cơ sở dữ liệu, socket, khóa Keychain và nhãn hc để mở lại phiên cũ.

## Technical Context

- Rust, Tauri 2, SQLite, macOS Keychain, React và TypeScript. Sidecar Node dùng giao thức hiện tại.
- Kiểm thử bằng Cargo, Vitest, contract tests sidecar và smoke test desktop macOS với dữ liệu thử.
- Một bản production và một bản dev song song. Dữ liệu do công cụ ngoài Herdsman quản lý tiếp tục theo cấu hình của từng công cụ.

## Constitution Check

1. Tiến trình agent vẫn chạy trong hc và sống qua vòng đời cửa sổ. Giữ nguyên giao thức phục hồi.
2. Giữ log và transcript đã lưu. Dev mở cơ sở dữ liệu riêng. Dữ liệu cũ tiếp tục thuộc production.
3. Yêu cầu cấp quyền chỉ nối tới sidecar của phiên tương ứng. Kiểm thử đóng và mở lại app trong khi có yêu cầu chờ.
4. Môi trường hiển thị bằng chữ tiếng Anh trên status bar qua token hiện tại, đủ tương phản ở cả hai theme. Không thêm màu báo trạng thái.
5. Giữ engine hiện tại và hc, tách tài nguyên bằng nhãn app trên terminal.
6. Tái sử dụng Project → Workspace → Session. Phân tách worktree do dev tạo để tránh tự động nhập hoặc xóa chéo.

Thiết kế đạt sáu nguyên tắc cho phạm vi thay đổi. Worktree Postscript hiện lưu kết quả theo workspace và không thay đổi vòng đời hiện có trong tính năng này.

## Project Structure

- `package.json`, `scripts/tauri.mjs`, `scripts/tauri-dev-macos.mjs` và `src-tauri/tauri.dev.conf.json` thiết lập lệnh launch và danh tính macOS.
- `src-tauri/src/environment.rs`, `lib.rs`, `state.rs`, `secrets.rs` xác định môi trường và dữ liệu.
- `src-tauri/src/{agent,workspace_terminal,hc_output,project_codegraph}.rs` và `src-tauri/src/commands/` áp dụng phạm vi terminal, worktree và phiên.
- `src/components/layout/StatusBar.tsx` và `src/lib/types.ts` hiển thị tên môi trường.
- [Research](research.md), [Data model](data-model.md), [Launch and runtime contract](contracts/environment.md), [Quickstart](quickstart.md), [Tasks](tasks.md).
