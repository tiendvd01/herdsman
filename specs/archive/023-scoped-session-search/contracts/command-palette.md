# Command palette behavior

⌘K and the sidebar open the same dialog. Category buttons filter the visible results. All exposes the session scope selector and includes matching items from all categories. Arrow keys move through results from the search field, Enter activates the highlighted item and Escape closes. Tab reaches the category and scope controls.

Managed and legacy search accept query text and optional project/workspace IDs. Scoped matching happens before applying the result limit. The existing endpoints and history callers remain compatible. Search errors are visible and successful sources remain usable.
