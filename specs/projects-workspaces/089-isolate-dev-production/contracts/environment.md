# Environment contract

| Entry point | Application title | Identifier | hc label | MCP Keychain service |
| --- | --- | --- | --- | --- |
| `pnpm tauri dev` | Herdsman Development | `app.herdsman.dev` | `herdsman.app=development` | `app.herdsman.dev.mcp` |
| Installed app | Herdsman (Production window title) | `app.herdsman` | `herdsman.app=1` | `app.herdsman.mcp` |

- `app_info.environment` returns `development` or `production`. The visible status bar names the environment.
- Dev starts with its own store. `HERDSMAN_DATA_DIR` remains a production override for existing callers and does not redirect dev into production.
- Production retains existing sessions, terminal addresses and their sidecar sockets. Agent commands and subscriptions resolve session state within the current environment.
- The environments share Git refs for a repo. Managed dev checkouts use their own root and generated branch prefix. A repo path added as a project remains accessible in either app.
