# Data model

Each session can have a completion identity derived from its latest successful turn sequence. A terminal that has ended in Done uses its end timestamp for its tab indicator. The UI records the last viewed identity per session in persisted preferences. Idle sessions with a new, unseen completion show Done. Working, blocked and error always take precedence. Repeated delivery of the same identity preserves acknowledgement.
