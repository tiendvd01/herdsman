# Data Model

- Directory entry: relative path, display name, directory flag. Entries belong to one project.
- File identity: project ID and relative path. Each request resolves the registered project directory.
- File tab: identity, project ID, saved baseline, draft, writable flag and load state. A draft is dirty when its text differs from the saved baseline. Save success advances the baseline to the submitted content. Successful close removes the tab. Switching tabs keeps the draft.
