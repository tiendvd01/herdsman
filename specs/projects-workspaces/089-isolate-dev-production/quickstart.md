# Quickstart

Prerequisites are macOS, installed Herdsman, Node, pnpm, Rust and hc. Use a disposable repo and a test credential for the validation.

1. In production, add the repo, open a workspace, start a session, and run `pnpm tauri dev` in the Herdsman source workspace. Check both apps in the app switcher and their status bars. Repeat with dev opened first. Covers SC-001.
2. In dev, add the disposable repo, open a workspace and create a floating terminal. Compare workspace and terminal lists, change a setting and test credential, then remove the dev reference to a production checkout. Both apps should keep their own configuration. Covers SC-002.
3. While a production session is active, open a dev session and leave a test permission request pending. Close and relaunch dev, repeat with a forced stop, and approve only from dev. Confirm both agents and their terminals route to their original apps during the run of at least one minute. Covers SC-003.
4. Repeat startup with a disposable pre-change production profile containing projects, settings and a live session, opening dev first. Verify the old session reconnects and each stored item appears once after two production launches. Covers SC-004.
5. With dev stopped, temporarily make its test data directory unavailable and launch dev. Check the startup error includes the environment, and use an already-open production session to send and receive a message. Covers SC-005.
6. Run `pnpm typecheck`, `pnpm test`, `pnpm --dir sidecar test`, and `cargo test --manifest-path src-tauri/Cargo.toml`.

## Verification record

- macOS LaunchServices reported both `Herdsman` (`app.herdsman`) and `Herdsman Development` (`app.herdsman.dev`) after launching development first and after restarting development with production open. Both databases passed a read-only SQLite integrity check.
- In the final macOS smoke run, production kept the same process for at least three minutes. Development reconnected to hc after a normal quit and again after a forced stop. The development test instance was closed at the end of the run.
- The hc integration exercised two concurrent echo sessions, a pending permission in each profile, development state teardown and reopen, rejection of cross-profile approval, and successful approval in the owning environments. The terminal test also rejected cross-profile access to floating terminals.
- The Rust suite checked production profile continuity, development startup failure handling, and worktree discovery and cleanup eligibility for a shared repo. The frontend suite checked environment labels and development notification titles.
- A native development launch with an overlapping data path exited and named the environment in its error. The existing production instance stayed open.
- Type checking, Vitest, sidecar tests, Rust tests, and `pnpm tauri build --debug --no-bundle` passed. The upgrade regression used a disposable profile. The credential checks verified the legacy and development Keychain service identifiers. The installed production app was used for the coexistence smoke test.
