# Validate Git Graph Lane Colors

1. Run `pnpm test tests/unit/gitFiles.test.tsx tests/unit/themeBuiltin.test.ts` and `pnpm typecheck`.
2. Open Herdsman with a workspace whose current history includes a two-parent merge. In the Git tab, trace both merge paths in built-in Light and Dark themes within 10 seconds each.
3. Resize Git Graph and confirm paths retain their color. With five visible concurrent paths, verify five colors are visible. Check a linear history for one continuous color.
