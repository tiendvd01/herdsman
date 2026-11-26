# Repository Guidelines

## Project Structure

Herdsman is a Tauri desktop app. The React and TypeScript frontend lives in `src/`. Feature components are under `src/components/`, shared primitives under `src/components/ui/`, state under `src/stores/`, and frontend API bindings in `src/lib/api.ts`. The Rust backend lives in `src-tauri/src/`, with SQLite migrations in `src-tauri/migrations/`. The Node.js agent sidecar lives in `sidecar/src/`. Static web assets are in `public/`, and feature specs and implementation notes are in `specs/`.

## Build and Development

Install workspace dependencies with `pnpm install`.

- `pnpm dev` starts the Vite frontend.
- `pnpm tauri dev` runs the desktop app with the Rust backend.
- `pnpm typecheck` checks TypeScript. `pnpm build` checks TypeScript and builds the frontend.
- `pnpm build:installer` bundles the macOS DMG.

## Coding Style

Use two-space indentation in TypeScript and JavaScript and follow the surrounding Rust style. Name React component files in PascalCase, hooks with a `use` prefix, and Rust modules and functions in snake_case. Use the existing `@/` frontend import alias and shared UI primitives. Keep Tauri command signatures and their frontend bindings in sync when changing the API.

## Testing

Run `pnpm test` for Vitest and React Testing Library tests in `tests/unit/`. Use `*.test.ts` or `*.test.tsx` filenames. Run `pnpm --dir sidecar test` for Node.js tests in `sidecar/test/`, including `*.contract.test.mjs` files. Run `cargo test --manifest-path src-tauri/Cargo.toml` for Rust tests. Cover the behavior your change affects, including regressions at the frontend, backend, or sidecar boundary as applicable.

## Commits and Pull Requests

Use short imperative commit subjects, such as “Add session history side panel.” In pull requests, explain the user-facing change and list the checks you ran. Link related issues or specs when available and include screenshots for visible UI changes.

## Code Navigation

If `.codegraph/` exists at the repository root, use `codegraph_explore` or `codegraph explore "<symbol or question>"` before text search or file reads when locating or understanding code. If the index is absent, use normal repository search.
