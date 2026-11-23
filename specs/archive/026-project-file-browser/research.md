# Research

- **Tree**: reuse React and TanStack Virtual already used in the repository. A dedicated tree dependency would add another rendering and styling layer. Flatten expanded nodes, keep one keyboard focus target, and fetch each directory on expansion.
- **Editor**: the existing CodeMirror 6 packages cover editor state and rendering. Use CodeMirror commands for undo and redo, and load JavaScript/TypeScript, JSON, Markdown and Rust parsers on demand. Other supported text files use plain text. Keep saved and edited text distinct.
- **Save**: resolve paths inside the registered project directory, reject symlinks and non-regular files, compare the baseline before replacing a file, and keep the draft on failure. Stage replacement in the same directory. The baseline check detects changes before replacement. Portable filesystem APIs do not offer a single content-conditional replacement against external writers.
