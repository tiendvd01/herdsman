# Markdown File Tab

- Markdown detection is case insensitive for `.md` and `.markdown`. The toggle starts in Source. Preview keeps current draft edits and displays the same supported formatting as Rich Conversation.
- Download is available in Preview and opens a native save dialog with the source filename. The dialog handles overwrite confirmation. A source destination is rejected. Cancellation is silent, while errors surface in the file tab flow.
- The desktop command accepts project ID, source path and draft text. It owns destination selection and resolves on successful write or cancellation. Filesystem and dialog errors reject the command.
