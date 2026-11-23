# Files UI and IPC

- `project_files_list(projectId, path)` returns children of a relative directory. Empty path denotes the root.
- `project_file_read(projectId, path)` returns UTF-8 text and a writable flag.
- `project_file_save(projectId, path, baseline, text)` saves edited text when the baseline matches. Conflict or filesystem error leaves the draft open.
- Select a file to activate its unique tab. A dirty close offers Save, Discard and Cancel. Files and Git appear as separate tabs in the right panel. Files is scoped to the project and Git stays scoped to the workspace.

Files supports UTF-8 text up to 2 MiB. Symbolic links, Git metadata and non-regular files are skipped.
