# Data Model

- **File tab** has a source path, filename, loaded document and optional current draft. A loaded Markdown tab switches from Source to Preview and back. An empty draft is a valid document. A failed load without content exposes neither Preview nor Download.
- **Markdown copy** has a user-selected destination and the exact draft snapshot taken when Download is pressed. The destination must differ from the source path. A failed or canceled export leaves the draft and preview available.
