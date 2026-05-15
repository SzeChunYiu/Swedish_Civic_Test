# Post-EAS-auth runbook evidence — 2026-05-15

## Purpose

Prepare the exact next sequence for the moment Expo/EAS authentication becomes
available.

## Artifact

- `publishing/post-eas-auth-runbook.md`

## Coverage

The runbook covers:

- `npm exec -- eas whoami`
- `npm run release:preflight`
- `npm run build:preview`
- Android physical-device audio checks
- iOS physical-device audio checks
- App Store Connect, Google Play Console, and AdMob record evidence
- Public support/privacy URL hosting
- Store screenshot evidence
- TestFlight upload
- Google Play internal test upload
- Final validation/preflight before production submission

## Verification

- `npm run test:publishing` verifies the runbook contains the key build,
  physical-device, store, and evidence-file steps.
- `npm run validate` includes this publishing test.
