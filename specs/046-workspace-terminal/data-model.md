# Data Model

- **Workspace terminal**. The hc address identifies a terminal within the current core. Labels identify the owning project and exactly one workspace, with kind `terminal`. The starting directory is the workspace's `work_dir`.
- **Lifecycle**. A terminal is live, ended, or removed. Viewer attachment is temporary and independent of shell lifecycle. Restart finds terminals by owner labels.
- **Attachment**. A view gets an ephemeral attachment ID for input, resize, and detach. It is not persisted.
