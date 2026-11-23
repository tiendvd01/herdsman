# Data Model

- **Scope** All, current project ID, or current workspace ID. The latter two require an available corresponding entity.
- **Managed hit** Session identity, optional engine conversation identity, title, optional matching excerpt, workspace identity/name/archive status and project identity/name.
- **Legacy hit** Claude conversation identity, folder and optional title, excerpt and associated Herdsman location. Ambiguous locations are excluded from a workspace scope.
- **Palette item** Session, workspace, project, action or settings entry with an activation target.
- **Recent workspace** Workspace ID recorded on navigation. Stale and archived IDs are omitted from the browsing group.
