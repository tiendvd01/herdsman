# Validation

Run `pnpm test tests/unit/lastSessionClose.test.tsx tests/unit/completionNotification.test.tsx`, `pnpm typecheck` and `cargo test --manifest-path src-tauri/Cargo.toml`.

With Herdsman running, complete two turns in two tabs. Activate one tab and confirm that its green Done indicator becomes Idle while the other stays Done. Restart Herdsman and inspect both tabs. Complete another turn while viewing the tab in the focused window and verify it returns directly to Idle. Complete a turn in a background tab and verify that the green indicator returns. Repeat with keyboard activation and by switching away from and back to the app. Confirm that opening a blocked tab retains its approval indicator and that completion notifications follow settings.
