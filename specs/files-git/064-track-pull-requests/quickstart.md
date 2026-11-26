# Validate Pull Requests

1. Sign into GitHub CLI and use two Herdsman projects with GitHub origins. Use an open authored PR and a direct review request on each repository.
2. Run `pnpm tauri dev`. Open Pull Requests from the left vertical rail using the keyboard. Check that the project sidebar, workspace and right panel are replaced. Try individual projects and All projects, then switch between Overview, Authored by Me, Review Requested and Notifications. Return to the workspace and verify the original project, workspace and layout.
3. With a second account or collaborator, produce comments, reviews, approvals, review requests and failed CI runs. Put an authored PR in a state that requires a base update.
4. With the panel closed, check that the badge updates within two minutes. Open notifications from multiple projects individually and verify the number falls to zero and hides.
5. Restart and verify existing updates do not duplicate. Verify reconnect, re-request, and loss of repository access. Compare light and dark themes.
6. Run `pnpm test`, `pnpm typecheck` and `cargo test --manifest-path src-tauri/Cargo.toml pull_requests`.
