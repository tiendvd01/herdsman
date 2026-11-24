# Quickstart

Run `npm install` if dependencies are missing, then use `npm run tauri dev` for desktop checks.

1. Open a `.md` file from Files. Add a heading and open Preview before saving. Check headings, lists, links, a GFM table, highlighted code, Mermaid, a chart and KaTeX. Compare the same content with Rich Conversation in light and dark themes.
2. Add broken rich blocks and raw HTML. Check source fallback, readable neighboring content and safe HTML handling. Return to Source and undo the draft edit.
3. Download a copy into another directory. Compare it with the draft, verify the source on disk, then try canceling, selecting the source path, declining replacement and choosing a destination that fails to write. Repeat with an empty file.
4. Open a non-Markdown file and verify its stock editing controls. Close the app with a preview open and an agent running, then reopen and check that the agent reconnects.
5. Run `npm test`, `npm run typecheck` and `cargo test --manifest-path src-tauri/Cargo.toml project_files::tests`.

For SC-004, ask five participants to preview and download without assistance and record first-attempt successes.

## Browser integration test

With Playwright CLI and its Chromium browser installed, start Vite with `npm run dev -- --port 1453`. From the repository root, run the following commands.

```sh
playwright-cli -s=markdown-preview open 'http://localhost:1453/?mock'
playwright-cli -s=markdown-preview run-code --filename tests/integration/markdown-preview.cjs
playwright-cli -s=markdown-preview close
```

The test opens a file from the workspace tree, edits the draft, and checks the rendered Mermaid node and Vega bar SVG. It also checks the switch back to Source.

## Acceptance results

| Check | Result |
| --- | --- |
| Mermaid and chart integration | Passed in Chromium against the workspace file tab. |
| Preview open during app quit | Passed on macOS. The app quit while the Echo sidecar was working. On relaunch, the same sidecar was live and the session showed its prompt and working state. |
| Native overwrite and cancel | Passed on macOS. Canceling replacement preserved the existing copy. Canceling the save sheet kept Preview open. Accepting replacement wrote an exact copy and preserved the source. |
| Native overwrite and cancel on Linux | Pending a Linux desktop run. |
| SC-004 | Pending a five-person usability session. |
