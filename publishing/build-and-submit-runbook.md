# Build and submit runbook

Reference: Expo EAS `eas.json` documentation, https://docs.expo.dev/build/eas-json/

## Prerequisites

- Run `npm ci` before local validation. Build/submit commands use
  `npx --yes eas-cli@18.13.0` so no local or global EAS CLI install is required.
- Expo account access.
- Apple Developer account access.
- App Store Connect app record for `com.billyyiu.swedishcivictest`.
- Google Play Console app record for `com.billyyiu.swedishcivictest`.
- Google Play service account JSON saved outside git, then copied locally to `publishing/google-play-service-account.json` only for submission.
- Public support URL and privacy policy URL.
- Final device screenshots.

## Preview/internal build

```bash
npm run build:preview
```

This uses the EAS `preview` profile with internal distribution and Android APK output for direct device testing.

## Production build

```bash
npm run build:production
```

This uses the EAS `production` profile and `autoIncrement` for store-ready builds.

## Production submit

```bash
npm run submit:production
```

The submit profile is intentionally left with `TBD` Apple identifiers until App Store Connect records exist. Android submission targets the internal track first.

## Required verification after build install

- Practice answer flow.
- Audio on Android physical device.
- Audio on iOS physical device.
- Mock exam no-ad surface.
- Privacy, terms, disclaimer, and source pages.
- Local progress persistence after app restart.
