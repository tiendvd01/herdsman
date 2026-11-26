# Research — Status bar và terminal nổi

## Interactive attachment

**Decision**. Reuse the xterm renderer and hc attach PTY from the workspace terminal. Render the interactive viewer inside the main window.
**Rationale**. Existing attach already handles bytes, terminal sizing, and input ordering. An in-window panel keeps the main UI interactive.
**Alternatives considered**. The existing Open Output window is read-only. A modal would block the main UI.

## Session identity and lifetime

**Decision**. List live shells by app and kind labels. An attachment owns only its viewer and uses the selected terminal address.
**Rationale**. hc already keeps background shells alive when Herdsman exits. The index is reconstructed from hc whenever the app opens.
**Alternatives considered**. Storing only a display name or address would tie recovery to an identifier hc can reuse.

## Connection and working directory

**Decision**. Use existing app-info refresh and hc connection invalidation. Resolve the initial work directory on the backend from the active workspace, project, or native home directory.
**Rationale**. The same source reports connection state in the existing UI. Directory lookup respects the app's known project and workspace records.
**Alternatives considered**. A second connection watcher or a raw directory from the renderer would duplicate existing ownership.
