# Session tab completion

Session history may include an optional completion sequence for idle sessions. Live completion events expose the same sequence in their existing completion payload. Missing completion metadata is supported.

Mouse or keyboard activation acknowledges the tab, including reactivation of the currently selected tab. Window focus acknowledges the visible session after window blur. A newly completed turn is acknowledged automatically when the session is visible and the window has focus. Live status may include the completion timestamp to distinguish newly completed turns from history. Hover, tab focus without activation, and restoring the selected tab on launch preserve unread completion.
