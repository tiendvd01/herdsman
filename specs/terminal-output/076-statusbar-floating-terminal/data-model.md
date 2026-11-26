# Data Model — Status bar và terminal nổi

- **Connection status**. Checking until app info arrives. Installed and connected, installed and disconnected, or not installed after the check. A query failure is shown as a separate unavailable state.
- **Floating shell**. One or more live hc terminals carrying app and kind labels. The numbered index is ordered by creation time. The hc terminal owns the working directory, command state, and output. Its starting directory comes from a live workspace, selected project, or the user home directory.
- **Viewer**. One draggable panel in the main window. The attach client has its own unique viewer ID and is scoped to its window. Detaching releases the client. The shell remains available until it exits or hc removes it.
