# Floating terminal contract

- The main-window **Terminal** control toggles the panel and its numbered tabs and **+** button in the header. Select a number to attach or choose **New terminal** to create a shell.
- `floating_terminal_list` returns live app-owned floating shells in creation order. Existing shells from the native-window version appear in the same list.
- `floating_terminal_create` starts a new shell in the workspace, project, or home directory.
- `floating_terminal_attach` accepts viewer ID, terminal address, dimensions, and a byte channel. It validates the app and kind labels and uses the shared attachment transport.
- Each tab has a **×** action. `floating_terminal_stop` checks the app and kind labels before stopping that shell. The header **−** action hides the panel while keeping the sessions active.
- Dragging the panel header repositions the panel in the main window. Hiding it or selecting another terminal releases the attachment while hc retains the shell.
