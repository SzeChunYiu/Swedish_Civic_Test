# Release preflight — 2026-05-15

## Purpose

Make the release decision fail-closed with executable evidence instead of a
docs-only checklist.

## Artifacts

- `scripts/release-preflight.js`
- `scripts/release-preflight.test.js`
- package script: `npm run release:preflight`

## Current result

`npm run release:preflight` was rerun for the runtime/app tree at `ac58046` on 2026-05-15 18:22 CEST. It exits non-zero and reports `BLOCKED`.

Ready gates:

- Local validation evidence exists and must be rerun for each release candidate.
- Project-local EAS CLI is available through `npm exec -- eas --version`.

Blocked gates:

- Expo/EAS authentication: `npm exec -- eas whoami` returns `Not logged in`.
- Android physical-device audio smoke evidence is missing.
- iOS physical-device or TestFlight audio smoke evidence is missing.
- App Store Connect and Google Play Console app record evidence is missing.
- AdMob is deferred because real ads are disabled for v1.0.
- Public support/privacy static pages exist locally, but hosted HTTPS URL
  evidence is missing.
- Final store screenshots from an accepted capture method are missing.
- TestFlight, Google Play internal test, production submission, and post-launch
  monitoring evidence are missing.

## Verification

- `node --test scripts/release-preflight.test.js`
- `npm run validate` includes `npm run test:release-preflight`
