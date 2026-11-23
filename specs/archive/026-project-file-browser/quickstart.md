# Quickstart

Run `pnpm tauri dev` in a checkout with the app prerequisites installed. Open two disposable projects with identically named text files containing different text.

1. Select a project, open Files in the right panel and navigate nested folders by mouse and keyboard. Check active file, focus and long names in light and dark themes.
2. Open one file repeatedly before and after load. Check a single tab. Open the same relative path in the other project and check its content.
3. Edit, switch to a session, return to the file and save. Reopen it and inspect the diff in Git.
4. Try closing or quitting with a draft. Exercise Cancel, Discard and Save. Modify the file externally while drafting and verify that Save reports a conflict and preserves the draft.
5. Run `pnpm typecheck`, `pnpm test` and `cargo test --manifest-path src-tauri/Cargo.toml --lib`.
