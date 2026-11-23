# Research

## Tab behavior

- **Decision**: Use controlled Radix Tabs with manual activation for the right panel. Keep its active-only mounting and existing keys (`project-files` for Files and `files` for Git). For closable workspace tabs, capture the rendered mixed order before closing, keep the session view mounted behind the file editor, and restore focus only after the actual close outcome is known. A close completing after navigation must leave focus in the newly selected context.
- **Rationale**: Radix already handles keyboard navigation and the trigger-panel relationship for a simple tab list. Workspace close can require confirmation, an asynchronous session operation or saving a draft. That outcome must drive the next selection and focus.
- **Alternatives considered**: Use a single Radix wrapper for both surfaces if it can represent auxiliary controls and preserve the mounted session view. Reuse the current segmented markup with ARIA attributes alone would leave focus behavior to implement twice.
- **References**: [Radix Tabs](https://www.radix-ui.com/primitives/docs/components/tabs) · [ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

## Command Palette

- **Decision**: Retain the existing dialog, result order, scoped queries and debounce. Associate the focused search input with a listbox and its current option. Use a stable result key to derive the active option, visual highlight and Enter target from the same visible array.
- **Rationale**: The input already handles arrows and Enter. Explicit relationships expose the selection to screen readers and prevent a stale result from remaining actionable.
- **Alternatives considered**: Adopt cmdk for this change. Its own filtering and selection would require revalidating existing scoped and asynchronous result behavior.
- **Reference**: [ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

## Choice groups

- **Decision**: Use controlled Radix Radio Group for Theme, Working directory and Search scope. Preserve their values and presentation context.
- **Rationale**: One primitive handles checked state, roving keyboard focus and disabled options.
- **Alternatives considered**: Extend each button group independently.
- **Reference**: [Radix Radio Group](https://www.radix-ui.com/primitives/docs/components/radio-group)

## Feedback

- **Decision**: Base copy feedback on the awaited clipboard result. Show Copy on focus and hover. Use existing feedback components to distinguish missing context, loading, error and successful empty responses.
- **Rationale**: Failed queries and pending queries can currently look like empty arrays. Branch on query status before evaluating the result count, while retaining usable data during background refresh.
- **Alternatives considered**: Add a new notification stack or panel state store. The current Button, Alert, Empty, Spinner and toast facilities cover the interaction.
