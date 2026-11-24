# Research

- **Runtime**: Use the existing hc core. The installed hc 0.1.22 accepts a background run with no command to open its configured shell, and provides an interactive attach client.
- **Transport**: Run the hc attach client in a local PTY. It already implements the framed hc protocol, including input and resize. The Tauri process only manages this short-lived client.
- **Renderer**: Reuse the installed xterm.js with its Fit addon to measure terminal rows and columns from the tab body. See [xterm.js addon docs](https://xtermjs.org/docs/guides/using-addons/).
- **Picker**: Reuse the local DropdownMenu and engine icons. Claude Code is currently usable. Codex is explicitly rejected by the current backend.
