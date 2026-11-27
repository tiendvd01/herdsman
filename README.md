# Herdsman

Herdsman is a desktop workspace for developers who use Claude or Codex across Git projects. Keep a coding session, its working tree, and a terminal together so you can follow an agent’s progress and review its changes before moving on to the next task.

## Tech stack

| Area | Technologies | Role in Herdsman |
| --- | --- | --- |
| Desktop | Tauri 2, Rust, Tokio | Host the desktop window and handle native operations such as file access, Git commands, and process management. |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS | Build and style the workspace UI, conversation views, and project navigation. |
| State | Zustand, TanStack Query | Track UI state and fetch and cache data from the Rust backend. |
| Storage | SQLite, rusqlite | Persist project, workspace, and session records locally. |
| Agent integration | Node.js, Claude Agent SDK, Codex CLI | Run Claude and Codex sessions through a dedicated sidecar process. |
| Editor and terminal | CodeMirror 6, xterm.js, portable-pty | Display editable files and diffs, and connect the terminal view to a local shell. |
| Testing | Vitest, React Testing Library, Node.js test runner, Cargo | Test frontend interactions, sidecar behavior, and Rust backend logic. |

When you start a session, the React frontend sends a Tauri command to the Rust backend. Rust manages the workspace and launches the Node.js sidecar, which communicates with the selected agent. Session updates flow back to the UI so you can follow the conversation alongside the files the agent is changing.

## Working with Herdsman

1. **Add a project.** Open a local Git repository and create a workspace. Use a Git worktree when you want to work on another branch in parallel.
2. **Start a session.** Choose Claude or Codex, describe the task, and follow the conversation. You can respond to permission requests as the agent works.
3. **Review the result.** Open changed files, inspect diffs and commit history, or run the project’s tests in the workspace terminal.
4. **Pick up where you left off.** Use the Command Palette to find a project, workspace, or previous session and revisit its conversation history.

## Run from source on macOS

Install Git, Node.js 24, pnpm, Rust, and Xcode Command Line Tools. You can install the command line tools with `xcode-select --install`.

From the repository root, install the dependencies and launch Herdsman Development:

```sh
pnpm install
pnpm tauri dev
```

You can run this command from a workspace terminal in the installed app. Development and Production use separate app data, credentials and managed terminals. Both can open the same repository. Use a separate worktree when you also want to keep source edits separate.

For Claude sessions, configure your Claude account in Herdsman. For Codex sessions during development, install the Codex CLI, make sure `codex` is on your `PATH`, and run `codex login`.

To work on the frontend by itself, run `pnpm dev` and open `http://localhost:1420`.

## Testing and packaging

| Command | Purpose |
| --- | --- |
| `pnpm typecheck` | Check TypeScript types |
| `pnpm test` | Run frontend tests |
| `pnpm --dir sidecar test` | Run sidecar tests |
| `cargo test --manifest-path src-tauri/Cargo.toml` | Run Rust backend tests |
| `pnpm build` | Type-check and build the frontend into `dist/` |
| `pnpm build:installer` | Build the macOS DMG installer |

The DMG installer is written to `src-tauri/target/release/bundle/dmg/`. The packaging process bundles Node.js, the Codex CLI, and the sidecar dependencies with the app.

## Repository structure

| Directory | Contents |
| --- | --- |
| [`src/`](src/) | React and TypeScript frontend, state stores, and Tauri API bindings |
| [`src-tauri/`](src-tauri/) | Rust backend, Tauri configuration, and SQLite migrations |
| [`sidecar/`](sidecar/) | Node.js process that runs agent sessions |
| [`tests/unit/`](tests/unit/) | Frontend tests using Vitest and React Testing Library |
| [`specs/`](specs/README.md) | Feature specifications and implementation notes |
