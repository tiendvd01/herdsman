# UI Interaction Contract

## Tabs and close outcomes — FR-001, FR-002

- Tab enters at the selected trigger. Left/Right and Home/End move focus within the row. Enter/Space selects the focused tab. Expose the selected trigger and its associated content panel to assistive technology.
- File and session triggers share focus and selection treatment. File draft state and session view behavior survive ordinary switches.
- Close controls have distinct names and sit outside tab triggers. Successful close activates and focuses the next surviving tab, then the previous one, then New session or the right-panel toggle when the row is empty. Cancel or failure preserves the tab and restores focus to the initiating control when the dialog exits.
- Files remains the first right-panel tab. Existing panel selection keys stay compatible.

## Command Palette and choice groups — FR-003, FR-004

- The search field exposes the result popup and its current option to assistive technology. Up/Down keep focus in the field and update the option. Enter uses that same option. An empty list exposes no active option or Enter target.
- Theme, Working directory and Search scope expose group names and checked values. Arrow keys move and select within enabled choices. Tab leaves each group.

## Feedback and theme — FR-005 through FR-007

- Copy code is visible on hover and keyboard focus. Pending, successful and failed clipboard writes have distinct feedback. Errors allow retry.
- Agents, Tasks, Git and Log use the Files-style Empty for missing context and successful empty responses, with distinct loading and failure feedback. Git diff and terminal loading/error states also remain explicit.
- Match current shadcn/ui New York tokens and shared controls in light and dark themes. App-owned labels and feedback are in English.
