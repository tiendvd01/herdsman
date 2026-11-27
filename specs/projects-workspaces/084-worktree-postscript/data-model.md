# Data Model

- Project postscript has a unique project ID and a user-saved command. Blank or whitespace-only input removes the setting.
- Workspace postscript has a unique workspace ID, status, stdout, stderr and an optional error message. It begins as running and can transition to succeeded, failed or interrupted. A second reservation for the same workspace is ignored.
- Both records refer to their owner by foreign key. No migration backfill is needed for existing workspaces.
