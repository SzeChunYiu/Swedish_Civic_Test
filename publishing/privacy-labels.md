# Apple App Privacy labels — current MVP answers

Reference: Apple App Privacy Details, https://developer.apple.com/app-store/app-privacy-details/

## Current answer

Data Not Collected.

## Rationale

The current MVP does not require an account and does not transmit user profile, progress, contact, location, financial, health, contacts, user content, search, browsing, identifier, purchase, usage, diagnostics, or other personal data to a developer server.

Study progress, settings, mistakes, XP, streaks, bookmarks, and audio preference are stored locally on the local device through the app storage layer.

## Ad SDK posture for v1.0

The native project includes `react-native-google-mobile-ads` with Google sample test app IDs so native build/prebuild paths stay realistic. Runtime ad rendering remains fail-closed for v1.0: `REAL_ADS_ENABLED_FOR_V1` is `false`, `shouldShowAd()` returns false before any placement check, and the configured ad units are test-only.

Before App Store submission, review the generated native binary and App Store Connect privacy questionnaire against this exact disabled/test-ID configuration. Do not enable real ad requests without updating this file, the in-app privacy copy, and the public privacy page.

## Important release caveat

If real AdMob requests, analytics SDK, crash reporting SDK, purchase SDK, account system, remote content service, or support form is enabled before App Store submission, this file must be updated before release.

Likely changes after real SDK enablement:

- Ad SDKs may require disclosure of identifiers, usage data, diagnostics, or tracking depending on configuration.
- Purchase SDKs may require disclosure of purchase data and identifiers.
- Crash reporting may require diagnostics disclosure.

## App Tracking Transparency

Current MVP: no tracking request and no cross-app tracking SDK.
