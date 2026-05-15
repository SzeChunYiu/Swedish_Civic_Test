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
until physical-device audio smoke tests pass.

## 3. Run physical-device smoke tests

Install the preview/internal builds and record results.

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

## 4. Create store/account records

Record evidence for:

- App Store Connect app record for `com.billyyiu.swedishcivictest`.
- Google Play Console app record for `com.billyyiu.swedishcivictest`.
- AdMob app record, or a recorded decision to keep real ads disabled for v1.0.
- Public Support URL.
- Public Privacy Policy URL.

Host `publishing/public-site/support/index.html` and
`publishing/public-site/privacy/index.html` before entering public URLs in the
stores. After verifying public HTTPS access, update `public-urls` in
`reports/release-gates.json`.

## 5. Capture final store screenshots

Use `publishing/screenshot-shotlist.md` and
`publishing/screenshot-manifest.json`.

Final screenshots must come from target devices, simulator/store tooling
accepted by the platform, or another store-approved capture method. Web-draft
screenshots are not sufficient for final submission. Update `device-screenshots`
in `reports/release-gates.json` only after final files/paths are recorded.

## 6. Upload internal test builds

Apple:

- Upload the iOS build to TestFlight.
- Record build number, processing status, and beta review status.

Google:

- Upload to Google Play internal testing.
- Record track URL, version code, and tester group.

When TestFlight, Google Play internal, production submission, and first
monitoring evidence are all recorded, update `submission` in
`reports/release-gates.json`.

## 7. Re-run privacy and release preflight

```bash
npm run validate
npm run release:preflight
```

If any real ad, purchase, analytics, crash, or support SDK was enabled, re-review:

- `publishing/privacy-labels.md`
- `publishing/google-play-data-safety.md`
- `app/privacy.tsx`
- `publishing/public-site/privacy/index.html`

Do not submit until `npm run release:preflight` exits 0.

## 8. Submit production builds

Only after all evidence gates are ready:

```bash
npm run build:production
npm run submit:production
```

Record submission IDs, review status, approval/rejection notes, and first-week
monitoring tasks in the release evidence file.
