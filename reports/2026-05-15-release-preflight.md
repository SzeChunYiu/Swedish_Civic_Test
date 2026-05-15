# Release preflight — 2026-05-15

## Purpose

Make the release decision fail-closed with executable evidence instead of a
docs-only checklist.

## Artifacts

- `scripts/release-preflight.js`
- `scripts/release-preflight.test.js`
- package script: `npm run release:preflight`

## Current result

`npm run release:preflight` exits non-zero and reports `BLOCKED`.

Ready gates:

- Local validation evidence exists and must be rerun for each release candidate.
- Project-local EAS CLI is available through `npm exec -- eas --version`.

Blocked gates:

- Expo/EAS authentication: `npm exec -- eas whoami` returns `Not logged in`.
- Android physical-device audio smoke evidence is missing.
- iOS physical-device or TestFlight audio smoke evidence is missing.
- App Store Connect, Google Play Console, and AdMob app record evidence is
  missing.
- Public support/privacy static pages exist locally, but hosted HTTPS URL
  evidence is missing.
- Final store screenshots from an accepted capture method are missing.
- TestFlight, Google Play internal test, production submission, and post-launch
  monitoring evidence are missing.

## Verification

- `node --test scripts/release-preflight.test.js`
- `npm run validate` includes `npm run test:release-preflight`
