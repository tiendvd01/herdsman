# Quickstart

Run `pnpm typecheck`, `pnpm test` and `pnpm --dir sidecar test`. The real Claude smoke tests require an authenticated Claude account. Set `HERDSMAN_SKIP_SMOKE=1` for offline tests.

In a Herdsman Claude session, ask Claude to run exactly this command in Bash.

```sh
printf 'test starting\n'; sleep 10; printf 'test failed\n' >&2; exit 3
```

Approve the command if prompted and expand its Bash card. Check that the first line appears during the sleep and the final status reports failure with the error line. Repeat while changing sessions or closing and reopening Herdsman. Repeat with exit code 0, with an interrupt and with a denied approval. Verify the card text in both themes.

## Validation results

- The frontend suite passed 248 tests. The production build and TypeScript checks passed.
- The sidecar suite passed 27 tests. A real Claude run verified live output, replay of output emitted while disconnected, and success and failure. Another real run verified that interrupting a command preserves output already received.
- Rust passed 34 tests, including app restart and approval integration. Two existing latency benchmarks were ignored by default.
- The Claude smoke tests exercise disconnect and reopen at the socket boundary. Desktop light and dark appearance, the five-run timing target and the three-developer timing study remain open as manual acceptance checks. Short foreground commands can finish before Claude exposes a task, so their output comes from the final result.
