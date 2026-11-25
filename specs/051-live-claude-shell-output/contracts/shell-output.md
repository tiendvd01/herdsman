# Shell Output Event Contract

The existing `tool_use` event may include `live_shell: true` on a Claude Bash call. The additive `shell_update` event uses the same `tool_use_id` and sequence envelope. It carries optional `status`, `output`, `truncated`, `unavailable` and `background` fields. Status values are `running`, `success`, `failed`, `interrupted` and `unknown`. An omitted field preserves its previous value. Each output value is the current SDK window, with earlier text omitted when `truncated` is true.

The standard `tool_result` still carries the Claude result. A running background task can return a tool result acknowledging launch, while its eventual task notification sets the outcome. Older events without the live marker use the existing result display.
