# Research

## Creation boundary

Run after the shared successful return path for both checkout modes in `workspace_create`. Imported worktrees and session creation have separate entry points. Triggering from the frontend would risk runs being dropped or repeated during navigation.

## Configuration and results

Use project settings owned by Herdsman and an exclusive SQLite row per workspace. Reading an executable file from the checkout would let branch contents change which command runs. Use the local shell with the checkout as working directory so the configured command can include multiple lines.

## Process lifecycle

Keep the command outside the agent runtime. Persist a running record before launch and mark unresolved records interrupted at app startup. Bound displayed output and present it as text. Reusing agent sessions would add an unrelated conversation and change their runtime contract.
