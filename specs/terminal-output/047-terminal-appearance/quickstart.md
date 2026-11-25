# Validation

1. Open a workspace terminal and check the inset in light and dark mode.
2. Resize a terminal running a full-screen program and verify its last row and column.
3. With a running shell, select an installed monospace font under Settings → Appearance → Code font. Verify the font changes and prior output remains.
4. Reopen the app and verify the selection. Reset Code font and verify the terminal returns to the default code family.

## Verification results

- Vitest passed all 239 tests. The new tests verify font persistence, fallback, and refitting the same terminal instance without detaching.
- Production frontend and embedded macOS builds passed.
- An isolated macOS desktop smoke test measured an 8-point top and left inset, selected Menlo with the shell still live, and verified persistence and reset after relaunch.
- The full-screen application resize scenario and dark-theme inset were left for manual visual review.
- A follow-up macOS regression test used the installed 0xProto Nerd Font Mono. Selecting it changed the live grid from 94 to 91 columns without changing the shell, and the choice persisted across relaunch. A separate WebKit probe confirmed that loading the font bytes changed rendered text metrics. The updated Vitest suite passed all 240 tests.
- With the shared Code font setting, all 239 frontend tests and type checking passed. On macOS, selecting 0xProto Nerd Font Mono from Code font changed the active terminal grid from 94 to 91 columns. The selection survived relaunch, and reset restored the default.
