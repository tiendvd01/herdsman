# Research

- **Decision** Keep CodeMirror mounted while preview is shown. The existing store supplies the draft, while the mounted editor retains selection and undo history. Recreating the editor would lose that history.
- **Decision** Use the conversation Markdown renderer. The existing renderer already covers GFM, KaTeX, Mermaid and charts. Duplicating the rendering pipeline would risk divergence.
- **Decision** Let the desktop command own the native dialog and staged copy write. This restricts export to a user-chosen path and avoids truncating the destination on failure. Browser download would provide weaker control over destination and overwrite handling in the desktop app.
