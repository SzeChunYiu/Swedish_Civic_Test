# 2026-05-15 — Batch 12 publishing metadata

## Added

- Final app identity in Expo config:
  - App name: `Sweden Citizenship Test Prep`
  - iOS bundle ID: `com.billyyiu.swedishcivictest`
  - Android package: `com.billyyiu.swedishcivictest`
- App Store listing draft.
- Google Play listing draft.
- Apple App Privacy label answers for the current MVP.
- Google Play Data safety answers for the current MVP.
- Release readiness checklist with external blockers.
- Publishing metadata test coverage.

## Verification

- RED: `node --test scripts/publishing.test.js` failed before bundle/package IDs and publishing docs existed.
- GREEN: `npm run test:publishing` passes.

## Source guidance checked

- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Google Play Data safety section help: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en

## Still external/blocking

- Store records, public URLs, screenshots, TestFlight, and Google Play internal testing require account/device access.
- Privacy labels and Data safety answers must be revisited if real AdMob, RevenueCat, analytics, crash reporting, login, support, or remote-sync SDKs are enabled before release.
