# Feature Specification: Workspace session picker and terminal

**Feature Branch**: `master`
**Created**: 2026-11-24
**Status**: Draft
**Input**: The workspace tab bar's plus button opens a picker for agent sessions and an integrated terminal.

## User Scenarios & Testing

### User Story 1 - Choose what to open (Priority: P1)

A developer can use the plus button to choose Terminal or a supported agent in the current workspace.

**Independent Test**: Open and dismiss the menu with the keyboard, then create an agent session through it.

1. Given a workspace, when the developer activates plus, then the menu lists Terminal and agent choices with clear availability.
2. Given the menu, when the developer selects Claude Code, then one new Claude session opens in the current workspace.
3. Given the menu, when the developer presses Escape, then it closes and focus returns to the button without creating a tab.

### User Story 2 - Run commands alongside agents (Priority: P2)

A developer can open and use a shell as a workspace tab while an agent conversation stays open.

**Independent Test**: Open Terminal in a worktree, run `pwd`, then switch away and back while a command is running.

1. Given a project or worktree workspace, when Terminal is chosen, then the shell opens inside that workspace's working directory.
2. Given a running terminal, when the developer switches tabs or closes and reopens the desktop app, then they can return to the same live shell.
3. Given multiple terminals, when the developer explicitly stops one, then only the selected terminal ends.
4. Given an interactive command, when the developer sends input, presses Ctrl+C, or resizes the view, then the shell responds and output remains readable.

### Edge Cases

- If the terminal cannot start, show the error and leave the current tab selected.
- If attachment fails, show the error and offer reconnection.
- If a shell exits, show its ended state while the tab is being viewed and allow closing it.
- Terminal tabs are available only inside their owning workspace.

## Requirements

### Functional Requirements

- **FR-001**: The workspace plus button MUST open a keyboard-accessible menu with Terminal and agent choices.
- **FR-002**: Choosing an available agent MUST use the existing conversation workflow. Unavailable agent choices MUST be disabled and identified.
- **FR-003**: Choosing Terminal MUST add and select a terminal tab with an interactive shell started in the workspace working directory.
- **FR-004**: The terminal MUST support live output, keyboard input, paste, interrupt, and window resizing.
- **FR-005**: Switching tabs, switching workspaces, and restarting the app MUST preserve live shells. The workspace MUST rediscover its existing live terminal tabs after restart.
- **FR-006**: Users MUST be able to end a terminal with one activation of its tab’s close button.
- **FR-007**: Startup and attachment failures MUST be visible. The user MUST be able to retry attachment while the shell is live.

### Key Entities

- **Workspace terminal**. An interactive shell associated with one workspace and represented by its own tab.
- **Agent session**. An existing workspace conversation started with one available agent.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A developer can open a shell or a supported agent with two pointer activations starting from the workspace tab bar.
- **SC-002**: In one project-folder workspace and one worktree workspace, `pwd` returns the correct directory in both cases.
- **SC-003**: Two terminals can run in one workspace and both are recoverable after an app restart. Stopping one leaves the other usable.

## Assumptions

- The grouped menu in the reference guides the layout. Terminal and currently supported agent choices are in scope. Presets such as btop and additional agent integrations are separate features.
- The terminal opens the user's configured shell through the existing workspace runtime.
- On restart, terminals are available from their workspace tabs. The user selects a tab to attach.
