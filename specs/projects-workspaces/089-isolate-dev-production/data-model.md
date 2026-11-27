# Data Model

| Entity | Identity and ownership |
| --- | --- |
| Environment | Development or Production selected at build time and validated with the configured app identifier on startup. |
| Herdsman state | Per-environment SQLite file, session logs, Unix sockets, themes and Keychain service. Production keeps the existing keys and files. |
| Managed terminal | Environment in `herdsman.app`, kind and existing project/workspace/session labels where applicable. A child can inherit ownership through its hc parent. |
| Dev checkout | Stored under the dev worktree root. Repo metadata and any intentionally shared source checkout remain visible to Git. |

No schema change. Reopen validates the environment before loading the existing state.
