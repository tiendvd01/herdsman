# Research

## Read live output from Claude tasks

**Decision**. Use `task_started` for `local_bash` and poll `getTaskOutput(task_id)`. A real foreground command returned its first stdout line during the sleep. Claude sent its terminal task notification and tool result when the command exited. The CLI can finish short foreground commands before registering a task. Those commands display the tool result. A registered command can have already emitted output before the first poll.

**Rationale**. Claude keeps control of launching, approving, cancelling and sandboxing the command. Reading via the SDK also avoids discovering local temporary paths.

**Alternatives considered**. `tool_progress` has elapsed time and no output. Wrapping Bash commands would change their execution semantics and sandbox behavior.

## Replay

**Decision**. Persist changed snapshots and task state in the existing sequence of conversation events.

**Rationale**. The existing sidecar keeps running with the app closed and subscribers can replay from their last sequence.

**Alternatives considered**. App-side polling would pause whenever the app closes. A separate log would add another recovery path.
