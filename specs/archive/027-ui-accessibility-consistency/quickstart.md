# Quickstart

Use a disposable local project with a text file, at least two session tabs and an optional worktree. Run `pnpm install` if dependencies need to be installed, then `pnpm typecheck` and `pnpm test`. Use `pnpm dev` and open the displayed URL with `?mock` for browser checks. Use `pnpm tauri dev` and VoiceOver for the desktop accessibility pass.

1. **Tabs**. Follow the [tab contract](contracts/ui-interactions.md#tabs-and-close-outcomes--fr-001-fr-002) in both rows. Verify focus versus selection, panel association, draft retention and close behavior at the middle, end and last position. Exercise cancel and failed save as well.
2. **Palette and groups**. Use three results, navigate them with the keyboard and verify what VoiceOver announces before activating one. Change the query to an empty result and press Enter. Verify each of the three choice groups using arrows and Tab.
3. **Copy**. Tab into Copy code, then verify the clipboard and success feedback. Emulate a rejected write in a browser test or fixture and verify the error and retry.
4. **Panel states**. Check missing context, pending response, successful empty response and failed response in Agents, Tasks, Git and Log. Verify existing Git diff and log content with data.
5. **Themes**. Repeat representative tab, choice, copy and empty-state checks in light and dark. Verify existing session and file close prompts and English labels.
