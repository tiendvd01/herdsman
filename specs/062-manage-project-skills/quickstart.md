# Quickstart — Validate project skills

## Prerequisites

A configured Herdsman dev checkout with Node, pnpm, Rust, Tauri prerequisites, hc and a working Claude account for the live scenarios. Use disposable local projects A and B. Create an initial commit in A before adding a workspace with a worktree.

```sh
pnpm install --frozen-lockfile
pnpm tauri dev
```

Create a local fixture source and point Settings at its printed path.

```sh
fixture_dir=$(mktemp -d)
mkdir -p "$fixture_dir/fixture-greeting"
cat > "$fixture_dir/fixture-greeting/SKILL.md" <<'SKILL'
---
name: fixture-greeting
description: Return the fixture greeting when invoked.
---
Reply with HERDSMAN_FIXTURE_GREETING.
SKILL
printf '%s\n' "$fixture_dir"
```

## End-to-end checks

1. Add the source in A and enable its skill. Search by name and description. Change to B and confirm A's source is absent. Restart Herdsman and confirm A's settings persisted.
2. Create a Claude session on A's main checkout and another as the initial session in a new worktree workspace. Confirm the skill is discoverable in both. Invoke the command using the exact name Claude exposes and expect `HERDSMAN_FIXTURE_GREETING`. In B, the command should be absent.
3. Add a native fixture under A's `.claude/skills`. Verify its Settings entry is read-only. For collision coverage, use the same name as the managed fixture and a different return string. Create sessions where the native skill is available and where it is absent. Account for native worktree fallback as described in [research.md](research.md). Verify the warning and native precedence when both names match. Remove the disposable native fixture before continuing.
4. Disable the skill in A. Create another Claude session and verify the managed command is absent. Confirm the prior session still runs. Re-enable it, move the fixture source aside and create another session. Verify the warning and continued Claude startup. Restore the source and verify the saved selection can apply again. Remove the source in Settings and verify it clears the selection while preserving the source files.
5. Exercise the interruption fixture in the persistence tests during a save, then reopen and confirm the configuration is wholly before or after the mutation. Leave a Claude session running through a desktop app exit, reopen and confirm the same conversation and terminal reconnect. Inspect light and dark themes and navigate Settings with the keyboard.

## Automated checks

Run after implementing the feature tests.

```sh
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
HERDSMAN_SKIP_SMOKE=1 pnpm --dir sidecar test
pnpm --dir sidecar test
```

Use the final command with a working Claude account. The feature smoke coverage must confirm actual plugin discovery and invocation, native collision behavior and that tool use needing permission still reaches the existing approval flow. See [settings and launch contract](contracts/settings-and-launch.md) and [data model](data-model.md) for expected states.
