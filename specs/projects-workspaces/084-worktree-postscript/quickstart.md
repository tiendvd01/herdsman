# Quickstart

Run `cargo test --manifest-path src-tauri/Cargo.toml`, `pnpm build`, `pnpm test` and `pnpm --dir sidecar test`.

In `pnpm tauri dev`, add a disposable Git project with a commit and an unused local branch. In Project options → Worktree Postscript save `pwd; echo ready >> .postscript-check`. Create worktrees for a new branch and the existing branch and confirm both show success and have one marker line. Open the project-folder workspace and reopen a worktree to confirm no new run.

Change the command to `sleep 30; echo failed >&2; exit 7`. Verify the workspace remains usable during startup, then inspect the error and stderr. Repeat and close the app mid-run. Reopen and check that the run reports an interrupted state or a previously recorded terminal result without another launch. Clear the command and confirm the next worktree has no postscript status. Review labels and keyboard interaction in both themes.

For usability acceptance, observe five users independently saving the command, creating a worktree and finding the outcome. At least four should complete all three steps on their first attempt.
