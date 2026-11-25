# Validate Editor LSP Hover

Install TypeScript and its language server on the local machine with `npm install -g typescript typescript-language-server`. Ensure the language server is visible in the login shell.

Open a TypeScript or JavaScript file in the File Editor. Hover over a variable and an imported function. Change a variable's type without saving and hover again. Switch tabs during an outstanding hover. Repeat with the server unavailable and verify that editing and saving still work.

Run `pnpm typecheck`, `pnpm test` and `cargo test --manifest-path src-tauri/Cargo.toml --lib editor_lsp::tests`.

With a server installed, run the live protocol check with `HERDSMAN_LSP_TEST_BIN="$(command -v typescript-language-server)" cargo test --manifest-path src-tauri/Cargo.toml --lib editor_lsp::tests -- --include-ignored`.
