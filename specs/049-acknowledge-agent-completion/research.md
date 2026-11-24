# Research

- Reuse the successful turn sequence already recovered for completion notifications. The log lets session history restore completions even if the initial runtime event was missed.
- Store the viewed completion with the existing UI preferences. Updating the backend runtime status would affect terminal lifecycle and would be overwritten by status reconciliation.
- Acknowledge on explicit activation, window focus, or when a live completion arrives for the visible session in the focused window. Compare the completion timestamp with app startup to preserve unread history.
