# Release preflight — 2026-05-15

## Purpose

Make the release decision fail-closed with executable evidence instead of a
docs-only checklist.

## Artifacts

- `scripts/release-preflight.js`
- `scripts/release-preflight.test.js`
- `scripts/check-public-urls.js`
- `scripts/check-public-urls.test.js`
- `reports/release-gates.json`
- package script: `npm run release:preflight`

## Current result

`npm run release:preflight` reruns `npm run validate`, runs Expo Doctor, runs the web export smoke, runs Android/iOS native prebuild smoke, reads `reports/release-gates.json`, checks EAS CLI/auth, live-checks the public support/privacy URLs, and exits non-zero until every automated and manually evidenced gate is ready. The latest run on 2026-05-15 20:54 CEST at product commit `3cb02ed` reported `BLOCKED`, with local validation, Expo Doctor, web export, native prebuild, pinned npx EAS CLI, UI/UX token discipline including typography, interactive accessibility label/role/state discipline, and public URLs ready.

Ready gates:

- Local validation runs inside `npm run release:preflight` for each release candidate.
- Expo Doctor passes 17/17 checks.
- Web production export smoke passes.
- Android/iOS native prebuild smoke passes.
- Pinned npx EAS CLI is available through `npx --yes eas-cli@18.13.0 --version`.
- Public support/privacy URLs are hosted and live-checked by release preflight: https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/ and https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/.

Blocked gates:

- Expo/EAS authentication: `npx --yes eas-cli@18.13.0 whoami` returns `Not logged in`.
- Android physical-device audio smoke evidence is missing.
- iOS physical-device or TestFlight audio smoke evidence is missing.
- App Store Connect and Google Play Console app record evidence is missing.
- AdMob is deferred because real ads are disabled for v1.0.
- Final store screenshots from an accepted capture method are missing.
- TestFlight, Google Play internal test, production submission, and post-launch
  monitoring evidence are missing.

## Verification

- `node --test scripts/check-public-urls.test.js`
- `node --test scripts/release-preflight.test.js`
- `npm run validate` includes `npm run test:public-urls` and `npm run test:release-preflight`
- The test suite verifies fail-closed current blockers, the future ready path when EAS/auth and `reports/release-gates.json` evidence are complete, and stale public URL evidence blocking when live URL checks fail.
