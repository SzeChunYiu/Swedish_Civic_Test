# Google Play Data safety — current MVP answers

Reference: Google Play Data safety section help, https://support.google.com/googleplay/android-developer/answer/10787469?hl=en

## Data collection

No user data collected.

## Data sharing

No user data shared.

## Security practices

- No account is required.
- No user data is sent to a developer server in the current MVP.
- Study progress, settings, mistakes, XP, streaks, bookmarks, and audio preference remain on the local device.
- Users can clear app data through the operating system to remove local progress.

## Data types

Current MVP Play Console answer: select no collected data types.

## Purposes

Not applicable because the current MVP does not collect user data.

## Google Mobile Ads SDK posture for v1.0

The native project includes the Google Mobile Ads SDK via `react-native-google-mobile-ads` and uses Google sample test app IDs. Real ads disabled for v1.0: `REAL_ADS_ENABLED_FOR_V1` is `false`, ad units are test-only, and runtime ad rendering is fail-closed.

Before Google Play submission, review the generated native binary and Play Console Data safety questionnaire against this exact disabled/test-ID configuration. Do not enable real ad requests without updating this form, the in-app privacy copy, and the public privacy page.

## Important release caveat

If real AdMob requests, RevenueCat, analytics, crash reporting, support, login, remote content, or cloud sync is added before Google Play submission, complete this form again based on the live SDK behavior.

Potential future disclosures may include device or other IDs, app interactions, diagnostics, purchases, or advertising data depending on SDK configuration.
