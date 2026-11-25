# Quickstart

Run `pnpm --filter herdsman-agent test`, `pnpm test`, `pnpm run typecheck` and `cargo test --manifest-path src-tauri/Cargo.toml`.

On macOS with Codex installed and signed in, create a Codex session from the workspace launcher. Send two prompts and confirm the streamed second response uses prior context. Create a separate CLI session in the workspace folder, then open it in Herdsman twice and confirm history and tab identity. Request a command and a file edit needing approval, verify the preview and deny. Close Herdsman during a turn and during approval, then reopen to confirm the same session and pending request. Verify Interrupt and Stop and confirm the logs remain readable.

## Verification results

- Codex CLI 0.171.0 on macOS passed sign-in and thread creation. A two-turn live smoke preserved the first turn's context.
- The workspace launcher opened a real saved CLI conversation. Herdsman displayed its original messages, reused the link, and continued the same thread. Closing the desktop app during the new turn preserved the sidecar and the reply.
- A real command approval remained pending across desktop quit and reopen. Denying it stopped the write. A real file approval displayed the proposed diff. Denying it left the test file unchanged.
- The live Codex runtime acknowledged Interrupt and shutdown. The sidecar fixture verifies both outcomes of the approval bridge, including Allow.
- Automated validation passed with 242 frontend, 22 sidecar, 29 Rust library and 4 Rust flow tests. Two pre-existing Rust library benchmarks remained ignored. Type checking and the desktop development build passed.
- The live smoke sampled one imported thread and one restart in each state. The formal SC-001 user study and the repeated SC-002 and SC-003 acceptance runs remain pending.
