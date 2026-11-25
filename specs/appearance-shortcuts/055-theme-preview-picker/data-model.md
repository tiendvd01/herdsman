# Data Model

- **Resolved theme** has a unique ID, display name, appearance (light or dark), source and role colors. Two built-in dark IDs are added, `catppuccin-frappe` and `one-dark-pro`.
- **Appearance preferences** store mode and one theme ID for each brightness. A selection updates only its group's ID. Applying a theme resolves the active brightness and uses its saved ID. An unavailable or mismatched ID resolves to the corresponding built-in default.
