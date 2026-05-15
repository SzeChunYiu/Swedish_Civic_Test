# Post-EAS-auth release runbook

Use this runbook only after Expo/EAS authentication is available. It is ordered
to preserve evidence for every remaining release gate.

## 1. Confirm account and preflight state

```bash
npx --yes eas-cli@18.13.0 whoami
npm run release:preflight
```

Expected state immediately after login: `eas-auth` should become ready, while
device, store-record, public-URL, screenshot, and submission gates should remain
blocked until evidence is collected.

Create a release evidence file before building:

```bash
cp reports/release-evidence-template.md reports/release-evidence-YYYY-MM-DD.md
```

Record the Expo account name and current git commit in
`reports/release-evidence-YYYY-MM-DD.md`. Keep `reports/release-gates.json`
blocked until each manual gate has concrete evidence.

## 2. Create preview/internal builds

```bash
npm run validate
npm run build:preview
```

Record Android and iOS build URLs/IDs in the release evidence file. Do not mark
`android-device-audio` or `ios-device-audio` READY in `reports/release-gates.json`
until physical-device audio smoke tests pass. Use the checked gate writer instead
of hand-editing JSON, for example:

```bash
node scripts/update-release-gate.js --gate android-device-audio --status READY --evidence "Android Pixel 8 audio smoke passed; build https://expo.dev/..."
node scripts/update-release-gate.js --gate ios-device-audio --status READY --evidence "iPhone 15 TestFlight audio smoke passed; build https://appstoreconnect.apple.com/..."
```

For longer evidence, write a short text file and pass it with
`--evidence-file`:

```bash
node scripts/update-release-gate.js --gate android-device-audio --status READY --evidence-file reports/android-device-audio-evidence.txt
```

## 3. Run physical-device smoke tests

Install the preview/internal builds and record results.

If recording device smoke locally, create JSON evidence files such as
`reports/device-smoke/android-audio.json` and
`reports/device-smoke/ios-audio.json`, then reference those paths in the
`android-device-audio` and `ios-device-audio` gate evidence. `npm run
release:preflight` validates local JSON evidence for the platform, device,
source build, and all required checks.

Android physical-device audio checks:

- Swedish `sv-SE` question text speaks clearly.
- Audio button respects mute/disabled state.
- App remains usable if the device speech engine is unavailable.

iOS physical-device audio checks:

- Swedish `sv-SE` question text speaks clearly.
- Audio button respects mute/disabled state.
- App remains usable if the device speech engine is unavailable.

Shared device smoke checks:

- Onboarding opens.
- Practice answer flow works.
- Mock exam shows no ads during exam.
- Progress persists after app restart.
- Privacy, terms, disclaimer, sources, and support pages open.

Required local JSON shape:

```json
{
  "status": "passed",
  "platform": "android",
  "device": "Pixel 8 / Android 15",
  "sourceBuild": "EAS Android preview build android-100",
  "checks": [
    { "id": "sv-se-question-audio", "result": "passed" },
    { "id": "audio-button-state", "result": "passed" },
    { "id": "speech-engine-unavailable", "result": "passed" },
    { "id": "onboarding", "result": "passed" },
    { "id": "practice-answer-flow", "result": "passed" },
    { "id": "mock-exam-no-ads", "result": "passed" },
    { "id": "progress-restart", "result": "passed" },
    { "id": "privacy-legal-pages", "result": "passed" }
  ]
}
```

## 4. Create store/account records

Record evidence for:

- App Store Connect app record for `com.billyyiu.swedishcivictest`.
- Google Play Console app record for `com.billyyiu.swedishcivictest`.
- AdMob app record, or a recorded decision to keep real ads disabled for v1.0.
- Public Support URL: https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/.
- Public Privacy Policy URL: https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/.

Public support/privacy pages are already hosted on GitHub Pages and `public-urls` is READY in `reports/release-gates.json`. Enter those URLs in the store records after App Store Connect and Google Play Console app records exist.

If recording store/account evidence locally, create
`reports/store-records/store-records.json` and reference that path in the
`store-records` gate evidence. `npm run release:preflight` validates local JSON
for the bundle identifier, App Store Connect URL, Google Play Console URL, exact
hosted support/privacy URLs, and either a concrete AdMob app ID or the v1.0
real-ads-disabled decision.

Required local JSON shape:

```json
{
  "status": "ready",
  "bundleIdentifier": "com.billyyiu.swedishcivictest",
  "appStoreConnectUrl": "https://appstoreconnect.apple.com/apps/1234567890/appstore",
  "googlePlayConsoleUrl": "https://play.google.com/console/u/0/developers/123/app/497123",
  "supportUrl": "https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/",
  "privacyUrl": "https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/",
  "adMob": {
    "status": "deferred-real-ads-disabled",
    "note": "REAL_ADS_ENABLED_FOR_V1=false"
  }
}
```

## 5. Re-review store privacy questionnaires against the generated binary

After the EAS build and store records exist, re-review:

- Apple privacy labels against `publishing/privacy-labels.md`.
- Google Play Data safety against `publishing/google-play-data-safety.md`.
- The generated binary/build configuration, including the Google Mobile Ads SDK
  test configuration and `REAL_ADS_ENABLED_FOR_V1=false` posture.
- Any newly enabled real ad, purchase, analytics, crash, or support SDK.

Do not mark `privacy-review` READY in `reports/release-gates.json` until the
review evidence names the build/binary, Apple privacy labels, Google Play Data
safety, and the disabled Google Mobile Ads SDK posture.

## 6. Capture final store screenshots

Use `publishing/screenshot-shotlist.md` and
`publishing/screenshot-manifest.json`.

Final screenshots must come from target devices, simulator/store tooling
accepted by the platform, or another store-approved capture method. Web-draft
screenshots are not sufficient for final submission. Update `device-screenshots`
in `reports/release-gates.json` only after final files/paths are recorded.

If using local screenshot files, write
`reports/final-store-screenshots/manifest.json` with `status:
"final-device"`, the source build, device/capture method, route, and file path
for each final screenshot. `npm run release:preflight` validates referenced local
final screenshot manifests and rejects browser/web-draft evidence.

## 7. Upload internal test builds

Apple:

- Upload the iOS build to TestFlight.
- Record build number, processing status, and beta review status.

Google:

- Upload to Google Play internal testing.
- Record track URL, version code, and tester group.

When TestFlight, Google Play internal, production submission, and first
monitoring evidence are all recorded, update `submission` in
`reports/release-gates.json`.

If recording submission evidence locally, create
`reports/submission/submission.json` and reference that path in the `submission`
gate evidence. `npm run release:preflight` validates local JSON for TestFlight
build status, Google Play internal track, iOS and Android production submission
IDs/statuses, and an existing monitoring report path.

Required local JSON shape:

```json
{
  "status": "submitted",
  "testFlightBuild": {
    "buildNumber": "100",
    "processingStatus": "processed",
    "betaReviewStatus": "approved",
    "url": "https://appstoreconnect.apple.com/apps/1234567890/testflight/ios/100"
  },
  "googlePlayInternal": {
    "trackUrl": "https://play.google.com/console/u/0/developers/123/app/497123/tracks/internal",
    "versionCode": 100,
    "testerGroup": "internal-testers"
  },
  "productionSubmissions": [
    {
      "platform": "ios",
      "submissionId": "ios-submit-100",
      "reviewStatus": "submitted"
    },
    {
      "platform": "android",
      "submissionId": "android-submit-100",
      "reviewStatus": "submitted"
    }
  ],
  "monitoringReport": "reports/monitoring/v1-week1.md"
}
```

## 8. Re-run release preflight

```bash
npm run validate
npm run release:preflight
```

Do not submit until `npm run release:preflight` exits 0.

## 9. Submit production builds

Only after all evidence gates are ready:

```bash
npm run build:production
npm run submit:production
```

Record submission IDs, review status, approval/rejection notes, and first-week
monitoring tasks in the release evidence file.
