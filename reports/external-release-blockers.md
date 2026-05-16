# External release blockers

## Purpose

Keep every non-code v1.0 release blocker tied to concrete evidence, the
SzeChunYiu tracker, and the exact release-preflight gate that must turn READY
before store submission.

Tracker: https://github.com/SzeChunYiu/Swedish_Civic_Test/issues/11

## Required command loop

Run these after each evidence update:

```bash
npx --yes eas-cli@18.13.0 whoami
npm run release:eas-access-check -- --out reports/eas-access-check-latest.md
npm run release:github-secrets-check -- --out reports/github-release-secrets-latest.md
npm run release:preflight
npm run release:blockers-snapshot
npm run release:completion-audit
npm run release:issue-update
npm run release:evidence-index
```

Use `scripts/update-release-gate.js` or `npm run release:gate` to update
`reports/release-gates.json`; do not hand-wave a READY gate without concrete
evidence.

Use `npm run release:evidence-stub -- --list` to inspect scaffold paths, then
`npm run release:evidence-stub -- --gate <gate>` to create the exact non-secret
evidence file scaffold for a blocked manual gate before filling it.
Use `npm run release:evidence-index` to summarize which blocked gates still
need scaffold files versus filled evidence.

## Blocker checklist

| Gate | Required evidence | Where to record | Current status |
|---|---|---|---|
| `eas-auth` | Successful `npx --yes eas-cli@18.13.0 whoami` output or approved Expo token state | `reports/2026-05-15-eas-access-check.md`, `reports/eas-access-check-latest.md`, issue #11 comment | BLOCKED |
| `eas-build-artifacts` | Android and iOS EAS build IDs, URLs, profiles, artifact types, readiness | `reports/eas-build-artifacts/eas-build-artifacts.json` or dated release evidence | BLOCKED |
| `android-device-audio` | Android installed build, device/OS, Swedish audio smoke, proof artifact | `reports/device-smoke/android.json` or dated release evidence | BLOCKED |
| `ios-device-audio` | iOS/TestFlight installed build, device/OS, Swedish audio smoke, proof artifact | `reports/device-smoke/ios.json` or dated release evidence | BLOCKED |
| `store-records` | App Store Connect and Google Play app URLs, bundle/package IDs, support/privacy URLs entered, listing metadata/account ownership review | `reports/store-records/store-records.json` or dated release evidence | BLOCKED |
| `store-credentials` | Non-secret App Store Connect submit identifiers and Google Play service-account metadata/fingerprint | `reports/store-credentials/store-credentials.json` or dated release evidence | BLOCKED |
| `store-policy-questionnaires` | Apple age rating/export/content-rights/no-affiliation and Google Play content rating/target audience/ads/gambling/government-affiliation review | `reports/store-policy-questionnaires/store-policy-questionnaires.json` or dated release evidence | BLOCKED |
| `privacy-review` | Final Apple privacy labels and Google Play Data safety review against generated binary, including Google Mobile Ads test/real-ads-disabled posture | `reports/privacy-review/privacy-review.json` or dated release evidence | BLOCKED |
| `release-owner-approval` | Final owner approval after all pre-submission gates are ready, including approved commit and no-known-blockers assertion | `reports/release-owner-approval/release-owner-approval.json` or dated release evidence | BLOCKED |
| `device-screenshots` | Final store screenshots from accepted device/store tooling with manifest, locale, dimensions, content review | `reports/final-store-screenshots/manifest.json` or dated release evidence | BLOCKED |
| `submission` | TestFlight/internal test, production submission IDs/statuses, first-week monitoring report | `reports/submission/submission.json`, `reports/monitoring/v1-week1.md`, or dated release evidence | BLOCKED |

## READY rule

A gate can move to READY only when `npm run release:preflight` accepts its
evidence and no contradictory placeholder, missing, stale, or blocker language
remains in `reports/release-gates.json`.
