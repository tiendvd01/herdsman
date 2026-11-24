# Session Contract

- Workspace launcher offers Codex creation and persisted Codex conversations for the current workspace.
- Creation validates the runtime. The session sidecar checks sign-in during initialization. Import validates the thread scope and reuses the existing link.
- App Server lifecycle maps to existing session, message, turn and approval events. Unsupported approval payloads never grant access.
