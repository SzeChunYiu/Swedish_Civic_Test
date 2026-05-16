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

`npm run release:preflight` reruns `npm run validate`, blocks dirty release worktrees, verifies referenced local artifact paths exist, requires exact hosted support/privacy URL values in READY URL/store evidence, runs the npm moderate-or-higher dependency security audit, runs Expo Doctor, runs the web export smoke, runs Android/iOS native prebuild smoke, reads `reports/release-gates.json`, checks EAS CLI/auth, requires EAS Android/iOS build artifact evidence, requires Apple/Google submit credential evidence, requires Apple/Google policy questionnaire evidence, requires release-owner approval evidence, live-checks the public support/privacy URLs, requires concrete non-placeholder manual evidence for READY manual gates, rejects web-draft/browser-only screenshots for final screenshot gates, validates referenced local device-audio JSON for platform, device, source build, required audio/shared smoke checks, and proof artifacts, validates referenced local store-record JSON for bundle identifier, App Store Connect URL, Google Play Console URL, exact hosted support/privacy URLs, Apple/Google account ownership review, AdMob posture, and App Store / Google Play listing metadata review, validates referenced local final screenshot manifests for final-device status, required routes, content-review claims, device/capture/build metadata, and existing screenshot files, requires store-record evidence to include Support URL and Privacy Policy URL entry, requires final privacy-questionnaire review evidence to name the generated binary/build plus disabled Google Mobile Ads SDK posture, validates referenced local privacy-review JSON for reviewedAt/reviewer audit trail, reviewed build ID/version/commit, App Store Connect and Google Play questionnaire review status, Apple privacy labels, Google Play Data safety, Google Mobile Ads test/real-ads-disabled posture, and disabled analytics/crash/purchase/real-ad SDKs, validates referenced local submission JSON for TestFlight, Google Play internal track, production submission IDs/statuses, monitoring report path, and monitoring report content covering first-week window, crash reports, content/support reports, and reviews/ratings, requires concrete submission IDs/URLs/reports, and exits non-zero until every automated and manually evidenced gate is ready. The latest run on 2026-05-16 02:43 CEST at product commit `ca5e5ec` reported `BLOCKED`, with local validation, Expo Doctor, web export, native prebuild, pinned npx EAS CLI, UI/UX token discipline including typography, interactive accessibility label/role/state discipline, and public URLs ready.

Ready gates:

- Local validation runs inside `npm run release:preflight` for each release candidate.
- Moderate-or-higher dependency security audit runs inside `npm run validate`; current audit reports 0 vulnerabilities.
- Clean git worktree is required; dirty tracked or untracked files block release preflight.
- READY manual evidence that names local `reports/`, `publishing/`, `content/`, or `assets/` artifact paths is checked against the filesystem.
- READY public-URL and store-record evidence must include the exact hosted support and privacy URL values.
- Expo Doctor passes 17/17 checks.
- Web production export smoke passes.
- Android/iOS native prebuild smoke passes.
- Pinned npx EAS CLI is available through `npx --yes eas-cli@18.13.0 --version`; `npm run build:preview` now fails closed before EAS cloud build unless `npx --yes eas-cli@18.13.0 whoami` succeeds; `npm run build:production` and `npm run submit:production` now fail closed unless this release preflight is fully ready from a clean git worktree with `npm run validate` rerun; submit also requires concrete store submit credentials.
- Public support/privacy URLs are hosted and live-checked by release preflight: https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/ and https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/.

Blocked gates:

- Expo/EAS authentication: `npx --yes eas-cli@18.13.0 whoami` returns `Not logged in`.
- EAS Android/iOS build artifact evidence is missing; local EAS build JSON evidence is now schema-checked when referenced.
- Apple/Google submit credential evidence is missing; local non-secret store credential JSON evidence is now schema-checked when referenced.
- Apple/Google policy questionnaire evidence is missing; local store policy JSON evidence is now schema-checked for Apple age rating/export compliance/content rights/no official-affiliation claims and Google Play content rating/target audience/ads declaration/no gambling/no government-affiliation claims when referenced.
- Release-owner approval evidence is missing; local approval JSON evidence is now schema-checked for approval time, approver, approved commit, store-submission decision, no-known-blockers assertion, evidence report path, and checked gate IDs when referenced.
- Android physical-device audio smoke evidence is missing; local JSON evidence is now schema-checked for smoke checks and proof artifacts when referenced.
- iOS physical-device or TestFlight audio smoke evidence is missing; local JSON evidence is now schema-checked for smoke checks and proof artifacts when referenced.
- App Store Connect and Google Play Console app record evidence is missing; local store-record JSON evidence, account ownership, and listing metadata review fields are now schema-checked when referenced.
- Final Apple privacy labels / Google Play Data safety review against the generated binary is missing; local privacy-review JSON evidence is now schema-checked for reviewer/time/questionnaire audit trail when referenced.
- AdMob is deferred because real ads are disabled for v1.0.
- Final store screenshots from an accepted capture method are missing; local final screenshot manifests are now schema-checked for content review, pixel width/height, locale, and referenced files when referenced.
- TestFlight, Google Play internal test, production submission, and post-launch
  monitoring evidence are missing; local submission JSON evidence and referenced monitoring report content are now schema-checked when referenced.

## Verification

- `node --test scripts/check-public-urls.test.js`
- `node --test scripts/release-preflight.test.js`
- `npm run validate` includes `npm run test:public-urls` and `npm run test:release-preflight`
- The test suite verifies fail-closed current blockers, EAS build artifact evidence blocking/acceptance, store submit credential evidence blocking/acceptance, preview build auth blocking and ready-auth check behavior, production submit blocking before release preflight is ready, the future ready path when EAS/auth and `reports/release-gates.json` evidence are complete, stale public URL evidence blocking when live URL checks fail, weak READY manual evidence blocking when it lacks required concrete details, READY evidence blocking when it still contains placeholder/blocker wording such as TBD, web-draft screenshot evidence blocking for final device screenshot gates, invalid local device-audio JSON blocking, valid local device-audio JSON acceptance, invalid local store-record JSON blocking, missing listing metadata review blocking, valid local store-record JSON acceptance, invalid local final screenshot manifest blocking, valid local final screenshot manifest acceptance, store-record evidence blocking unless support/privacy URL entry is recorded, invalid local submission JSON blocking, valid local submission JSON acceptance, incomplete monitoring report content blocking, privacy-review evidence blocking unless the generated binary/build and disabled Google Mobile Ads SDK posture are recorded, invalid local privacy-review JSON blocking, valid local privacy-review JSON acceptance, store policy questionnaire evidence blocking/acceptance, release-owner approval evidence blocking/acceptance, and submission evidence blocking unless concrete TestFlight build, Google Play internal track URL, production submission ID, and monitoring report are recorded.
