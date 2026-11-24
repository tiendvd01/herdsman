# Data Model

A Herdsman session belongs to one workspace. A Codex-backed session carries the official thread identity. The native thread keeps its working directory and original history. New and imported sessions use the existing append-only events. Approvals bind to one App Server request and one UI decision.
