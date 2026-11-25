# Implementation Plan — Git Graph Lane Colors

## Summary

Assign a theme color to each active Git Graph path using the renderer's existing traversal.

## Technical Context

React renders the existing workspace history. SVG strokes and fills use the app's theme roles. The feature adds no dependency or persisted state.

## Constitution Check

1. Closing Herdsman during rendering leaves agents running independently.
2. Rendering does not touch conversation data.
3. Rendering reads the existing history and uses no agent tools.
4. The existing 200-commit history limit bounds the traversal.
5. Agent engines and their integration are outside the rendering path.
6. Each workspace keeps its own history view.

The existing list, shared text component, and splitter remain in use. Light and Dark resolve palette roles through the theme registry. The feature adds no UI copy.

## Project Structure

- `src/components/panels/GitHistoryRows.tsx` assigns lane colors and draws commit paths.
- `src/theme/roles.ts` declares the palette.
- `tests/unit/gitFiles.test.tsx` covers the graph through the Git tab.

## Complexity Tracking

Palette colors extend the existing lane state. Parent relationships, geometry and layout retain the existing traversal.
