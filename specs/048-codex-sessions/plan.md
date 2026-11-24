# Implementation Plan: Session Codex trong Herdsman

## Summary

Add a Codex App Server adapter to the Node sidecar. Use the installed Codex CLI and its local account and history. Herdsman owns the workspace binding and the user-facing session lifecycle.

## Technical Context

Node, Rust/Tauri, React, the existing session store and shadcn controls. Development targets the locally installed Codex 0.171.0 protocol. The sidecar remains in hc and the App Server uses its standard input and output.

## Constitution Check

- I. hc owns the sidecar and App Server lifecycle. Closing the UI only detaches the view.
- II. Append normalized events to the existing log and read Codex history through the official server. Preserve both identities and replay without reissuing prompts.
- III. Command and file requests use the existing explicit approval UI. Unsupported or incomplete approval payloads fail closed.
- IV. Reuse Rich Conversation, delta handling and safe rendering.
- V. Use the official App Server and existing normalized event stream. Cover the boundary with a deterministic protocol fixture and an installed-runtime smoke.
- VI. Only offer threads from the workspace's working directory. Reuse existing launcher and session cache. Use themed English UI.

## Project Structure

The Codex adapter and metadata probe live in sidecar/src/engines. Rust validates ready state, threads and imports. The existing workspace launcher exposes the choices. Tests cover protocol and existing session flow.
