# Feature Specification: Terminal Appearance

**Feature Branch**: `master`
**Created**: 2026-11-24
**Status**: Draft
**Input**: Add a small inset to the workspace terminal shown in the reference and use the existing Code font preference for terminal text.

## User Scenarios & Testing

### User Story 1 - Read terminal output comfortably (Priority: P1)

A developer opens a workspace terminal and sees a small inset between the text area and the panel edges.

**Why this priority**: The inset keeps the prompt and its icons clear of the panel border.

**Independent Test**: Open a terminal, run a command, and resize the window while viewing its output.

1. Given a workspace terminal, when the prompt and command output appear, then the text area has an 8-pixel inset on each side in both light and dark themes.
2. Given a terminal running a full-screen program, when the window resizes, then the program fits the remaining area inside the inset and its last visible row and column remain reachable.

### User Story 2 - Choose a terminal font (Priority: P2)

Workspace terminals use **Settings → Appearance → Code font**, including installed monospace families such as Nerd Fonts.

**Why this priority**: Developers can match their shell prompts and glyphs to the font they use for terminal work.

**Independent Test**: With two terminal tabs open, choose an installed monospace font, verify both tabs, relaunch the app and reset the preference.

1. Given a running terminal, when the developer selects a font, then existing and newly opened terminal tabs display it. The active shell, output history and ability to continue typing are preserved.
2. Given a saved font, when the app is relaunched, then the font is still selected and applied to workspace terminals.
3. Given a custom Code font, when the developer resets Code font, workspace terminals return to the default code family.

### Edge Cases

- If a saved font is unavailable, the terminal uses the Code font fallback and remains usable. The developer can choose a replacement in Appearance.
- When the selected font has different character dimensions, the terminal recalculates available rows and columns within the inset.

## Requirements

### Functional Requirements

- **FR-001** — Workspace terminals MUST show a fixed 8-pixel inset on all four sides at default zoom, using the terminal background throughout the inset.
- **FR-002** — The terminal MUST fit its visible grid to the padded area when its panel or font dimensions change.
- **FR-003** — Workspace terminals MUST use the family and size selected in **Settings → Appearance** under **Code font** and **Code font size**. Resetting the size follows the current default Code font size.
- **FR-004** — The preference MUST apply to workspace terminal tabs across projects, persist after relaunch, using the existing Code font preference.
- **FR-005** — Font family and size changes MUST apply to an open terminal without restarting its shell, clearing its output history, or requiring a tab switch.
- **FR-006** — If the saved Code font is unavailable, terminal text MUST use the existing Code font fallback.

### Key Entities

- **Code font preference** — The existing application-wide choice shared by workspace terminals and other code surfaces.

## Success Criteria

### Measurable Outcomes

- **SC-001** — At default zoom, the inset measures 8 pixels on all four edges in light and dark themes. At two tested window sizes, a full-screen terminal program can use its last visible row and column.
- **SC-002** — In an already open terminal, selecting a loaded font visibly applies it within one second. A command running before the change continues and prior output remains available.
- **SC-003** — One selection applies to terminals in two different workspaces and survives one relaunch. Resetting Code font restores the default code family.

## Assumptions

- The 8-pixel inset is the default interpretation of “a little padding.”
- The terminal shares the existing Code font family and size settings. Font weight and line spacing are outside this feature’s scope.
