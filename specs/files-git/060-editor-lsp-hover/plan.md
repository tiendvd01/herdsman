# Implementation Plan — Editor LSP Hover

## Summary

Connect the File Editor to a local TypeScript and JavaScript language server and show hover information through CodeMirror.

## Technical Context

The user installs `typescript-language-server` and TypeScript locally. The app resolves the installed executable and exchanges LSP messages over standard I/O. The server serves the active editor, and the editor syncs its current draft before requesting hover.

## Constitution Check

1. The editor helper serves interactive requests for the open file. App closure ends the editor helper and leaves independent agent sessions running.
2. Conversation logs remain outside this feature.
3. The app runs a locally installed language server for code analysis. Hover requests do not modify files or grant agent tool permissions.
4. Hover requests have bounded waits. Typing, highlighting and saving stay available independently.
5. Agent engines and their integration remain outside this feature.
6. File resolution uses the project or worktree that owns the open document.

The tooltip uses existing theme tokens and English status text.

## Project Structure

- `src-tauri/src/editor_lsp.rs` owns the LSP session and message framing.
- `src-tauri/src/commands.rs` resolves the backing file and exposes hover commands.
- `src/components/files/FileEditor.tsx` and `editorHover.ts` own interaction and presentation.

## Complexity Tracking

One supervised editor connection handles initialization, document synchronization and hover. The transport serves this limited request set. Servers and browser IPC are outside agent runtimes.
