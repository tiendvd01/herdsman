# Implementation Plan: Theme Preview Picker

## Summary

Replace the two theme dropdowns in Settings → Appearance with responsive preview radios and add two built-in dark palettes.

## Technical Context

React, TypeScript, Tailwind and existing Radix-backed shadcn controls. Theme catalog and resolved colors come from `src/theme/`; mode and selected IDs use the persisted UI store. Verify through Vitest, TypeScript and the Settings validation steps. No new dependencies or storage schema.

## Constitution Check

The feature changes presentation and existing appearance preferences. It does not touch agent lifetime, event logs, permissions, engines or project hierarchy. Theme selection and reopening are exercised through the existing persistence and application paths. English controls, shared primitives and semantic colors apply in both modes. Post-design review finds no exceptions.

## Project Structure

### Documentation (this feature)

`spec.md`, `research.md`, `data-model.md`, `contracts/appearance.md`, `quickstart.md` and `tasks.md`.

### Source Code (repository root)

`src/components/settings/SettingsDialog.tsx` and shared radio/tooltip controls. `src/theme/builtin/` and `src/theme/catalog.ts` provide palettes. `tests/unit/` covers palette contrast and Settings selection.

## Complexity Tracking

No exceptions.
