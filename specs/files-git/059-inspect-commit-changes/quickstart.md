# Validate Commit Changes

Run `pnpm test`, `pnpm typecheck` and `cargo test --manifest-path src-tauri/Cargo.toml --lib git::tests`.

In the Git tab, expand a commit with file changes. Confirm status markers, directory labels, and continuous lanes. Open a file twice and check the same tab is activated. Open the same file from a different commit and from Changes and check that each has its own diff. Test a merge, root commit and renamed file. Repeat expansion in Light and Dark.
