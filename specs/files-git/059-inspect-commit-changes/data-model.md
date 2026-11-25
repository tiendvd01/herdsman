# Data Model — Inspect Commit Changes

- Expanded commit holds one full object ID in the mounted workspace graph. Selecting it again clears the selection.
- Commit file change holds a repository-relative path, status, and original path for a rename or copy.
- Historical diff tab holds the existing workspace and file identity plus an immutable full commit ID and optional original path. Working changes keep their existing identity.
