# Workspace terminal contract

- Create or list by workspace ID. The backend checks workspace ownership and supplies the working directory. Shell creation uses hc's configured shell.
- Attach and stop by workspace ID and hc address. Only matching Herdsman terminal labels are accepted.
- The attachment streams raw bytes in order. Input writes bytes, resize sets rows and columns, and detach drops the viewer process alone.
- Terminal selection opens an interactive tab. Closing the tab stops the terminal directly.
