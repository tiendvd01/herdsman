# Research

- **Decision** — Discover GitHub repositories from configured Git origins and read GitHub through the installed, signed-in GitHub CLI. **Rationale** — The CLI supports read-only GitHub queries and already manages sign-in. **Alternative** — App-managed authentication adds credential lifecycle work.
- **Decision** — Use GitHub's direct review requests, merge state, timeline and check data. **Rationale** — Current review requests determine membership and immutable activity identifiers deduplicate notifications. **Alternative** — Comparing displayed counts can miss events when multiple changes happen between refreshes. [GitHub pull request schema](https://docs.github.com/en/graphql/reference/pulls)
- **Decision** — Poll independently of the active project and reuse the existing SQLite settings cache. **Rationale** — The sidebar count reflects every accessible project and survives reopening. **Alternative** — A webhook requires a reachable service and repository setup.
