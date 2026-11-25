# Data Model

- A Claude Bash call keeps its existing tool-use ID and display command. The SDK task ID identifies the output source within that Claude query.
- A shell snapshot contains output text, an indication that preceding output was truncated, and whether the read failed. A snapshot replaces the earlier window for that call. The SDK bounds each live window to its latest 8 KiB.
- Task lifecycle moves from pending to running to success, failure or interruption. Unknown means execution started but its outcome is unavailable. An approval denial keeps the command from entering running state.
- A legacy tool result remains readable. An available final foreground tool result can provide earlier lines outside the live window.
