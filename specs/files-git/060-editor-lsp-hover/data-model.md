# Data Model — Editor LSP Hover

An editor connection belongs to one open file and its project or worktree root. The document state contains the current draft and a monotonically increasing language-server document version. A hover is requested at a zero-based UTF-16 line and character. The result contains display text and its optional range.
