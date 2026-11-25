# Contract — Settings and new Claude sessions

## Settings

Open **Settings → Skills**, choose a registered local project and see the project name. Use keyboard navigation for the selector, switch, search, refresh and source removal confirmation. Show loading, no-project, empty, no search results and unavailable source states separately. Rows show name, description, source, status and any reason they cannot be enabled. Native project and user skills have read-only labels. Settings lists native project skills for the main checkout. The session cwd determines what Claude actually loads.

## Desktop commands

| Operation | Input | Result |
|---|---|---|
| List / refresh | Project ID | Source statuses, managed and native skill rows, current selections and conflict reasons. |
| Set enabled | Project ID, source ID, relative skill directory, desired state | Committed state or an English UI error with unchanged persisted state. |
| Add source | Project ID and local directory | Registered source or a reason for rejection. |
| Preview / remove source | Project ID and source ID. Confirmed affected selections for removal when any are enabled | Preview lists affected skills. Removal commits source and selection deletion together. A changed impact requires a fresh preview. |

Each operation validates project membership on the backend. The UI scopes query keys and result handling by project ID.

## Claude launch

- Prepare a plugin for both fresh entry points, including the initial session created with a workspace. Resolve settings from the workspace's project ID and native conflicts from the workspace's cwd. The filesystem path to a plugin is supplied by the backend through an optional internal `--project-skills-plugin` argument.
- Claude adapter applies SDK `plugins` at common query startup, including when startup is triggered by the command list. Skills may appear under the plugin namespace. Native discovery follows existing SDK settings.
- Attach the existing published plugin on respawn of a previously provisioned session. Historical import, Codex and older sessions without a plugin use their current launch options. Reconnecting to a running sidecar does not launch a new process.
- Invalid, conflicting or missing skills produce a non-blocking warning with name and reason. Report the warning even when every skill was skipped. Keep startup and native discovery available, and preserve tool authorization and event replay.
