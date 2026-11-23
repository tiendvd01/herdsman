# Research

- **Decision** Reuse the message index and look up session titles in session metadata. Dialogue search uses existing indexed content and title search also covers sessions without indexed messages. Reusing the transcript scanner alone would omit managed sessions from other engines.
- **Decision** Apply scope before limiting results. Merge results by managed session identity where the Claude transcript can be linked by engine session ID. Use workspace-directory association only when unambiguous in the new palette. The existing history popover retains its lookup defaults.
- **Decision** Use the existing command dialog and navigation actions. The app currently exposes Appearance as its settings section. Workspace history records visits and uses the current workspace as a fallback for existing installs.
