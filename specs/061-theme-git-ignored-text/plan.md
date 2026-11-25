# Implementation Plan — Theme Git-Ignored Text

## Summary

Resolve a dedicated ignored-file text color with the active theme, and apply it only to ignored names in the browsing tree.

## Technical Context

The theme role registry produces a CSS variable with a per-theme override and a contrast-aware default. File Tree uses the generated Tailwind utility. The first-paint cache resolves missing roles when reading older data.

## Constitution Check

1. Theme rendering is local to the app. Closing the app leaves agents running.
2. Conversation storage is outside the feature.
3. Theme changes require no agent actions.
4. Theme updates use CSS tokens without requesting the file tree again.
5. Engine behavior remains independent of appearance.
6. Existing project and workspace context still determines the file list.

The File Tree reuses its existing row components and checks all built-in palettes in normal, hover and selected states.

## Project Structure

- `src/theme/roles.ts` resolves the color.
- `src/lib/theme.ts` restores cached palettes.
- `src/components/files/FileTree.tsx` consumes the color.

## Complexity Tracking

One registered color and one class change keep the UI tied to its theme. Older cached palettes use the existing resolver to derive missing roles.
