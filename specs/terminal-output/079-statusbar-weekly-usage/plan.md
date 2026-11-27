# Implementation Plan · Weekly usage

## Summary

Render account-level weekly usage beside each engine icon in AccountUsage. Reuse limitView for both the summary and detail rows. Give each provider a keyboard-focusable tooltip trigger.

## Technical context

React, TypeScript, Zustand and the existing Radix tooltip. The session store already receives account snapshots. Cover interactions with Vitest and React Testing Library.

## Constitution check

Presentation reads existing account state. Closing the app leaves agents running. Theme roles and keyboard access apply to each provider. The design requires no new permissions or persistence.

## Project structure

Update src/components/layout/AccountUsage.tsx and tests/unit/usageIndicators.test.tsx. StatusBar already mounts the indicator.
