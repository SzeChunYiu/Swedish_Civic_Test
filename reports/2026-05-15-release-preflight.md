# Release preflight — 2026-05-15

## Purpose

Make the release decision fail-closed with executable evidence instead of a
docs-only checklist.

## Artifacts

- `scripts/release-preflight.js`
- `scripts/release-preflight.test.js`
- `reports/release-gates.json`
- package script: `npm run release:preflight`

## Current result

`npm run release:preflight` reruns `npm run validate`, runs Expo Doctor, runs the web export smoke, reads `reports/release-gates.json`, checks EAS CLI/auth, and exits non-zero until every automated and manually evidenced gate is ready. The latest run after adding Expo Doctor and web export as preflight gates on 2026-05-15 18:45 CEST reported `BLOCKED`, with local validation, Expo Doctor, web export, and pinned npx EAS CLI ready.

Ready gates:

- Local validation runs inside `npm run release:preflight` for each release candidate.
- Expo Doctor passes 17/17 checks.
- Web production export smoke passes.
- Pinned npx EAS CLI is available through `npx --yes eas-cli@18.13.0 --version`.

Blocked gates:

- Expo/EAS authentication: `npx --yes eas-cli@18.13.0 whoami` returns `Not logged in`.
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
- The test suite verifies both fail-closed current blockers and the future ready path when EAS/auth and `reports/release-gates.json` evidence are complete.
