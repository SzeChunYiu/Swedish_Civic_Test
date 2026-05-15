# 2026-05-15 — Batch 13 EAS build config

## Added

- `eas.json` with development, preview/internal, production, and submit profiles.
- NPM scripts for preview build, production build, and production submit.
- Build and submit runbook for account/device-dependent release steps.
- Build-config tests for EAS profile and script coverage.

## Verification

- RED: `node --test scripts/build-config.test.js` failed before `eas.json` and build scripts existed.
- GREEN: `npm run validate` passes with build-config tests included.

## Source guidance checked

- Expo EAS `eas.json` documentation: https://docs.expo.dev/build/eas-json/
- Expo app config docs for bundle/package identifiers: https://docs.expo.dev/versions/latest/config/app/

## Still external/blocking

- Actual EAS builds require Expo account access and store credentials.
- TestFlight and Google Play internal testing require uploaded builds and store records.
