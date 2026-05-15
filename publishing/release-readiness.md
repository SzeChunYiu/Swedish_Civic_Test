# Release readiness checklist

## Current final app identity

- App name: Sweden Citizenship Test Prep
- Expo slug: swedish-civic-test
- iOS bundle identifier: com.billyyiu.swedishcivictest
- Android package: com.billyyiu.swedishcivictest

## Prepared artifacts

- App Store listing draft: `publishing/app-store-listing.md`
- Google Play listing draft: `publishing/google-play-listing.md`
- Apple privacy label answers: `publishing/privacy-labels.md`
- Google Play Data safety answers: `publishing/google-play-data-safety.md`
- Post-launch v1.1 plan: `docs/release/post-launch-v1.1-plan.md`
- Store screenshot shotlist: `publishing/screenshot-shotlist.md`
- Release evidence template: `reports/release-evidence-template.md`
- EAS access check: `reports/2026-05-15-eas-access-check.md`
- Release asset evidence: `reports/2026-05-15-release-assets.md`
- App icon/splash assets: `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`
- In-app support surface: `/support`, evidence in `reports/2026-05-15-support-surface.md`
- In-app disclaimer: `/disclaimer`
- In-app privacy policy: `/privacy`
- In-app terms: `/terms`
- In-app source page: `/sources`

## External blockers before submission

- Apple Developer account access and App Store Connect app record.
- Google Play Console account access and app record.
- Public support URL.
- Public privacy policy URL.
- Real screenshots from target devices.
- TestFlight build upload and beta review.
- Google Play internal test release.
- Android device audio verification.
- iOS device audio verification.
- Decision whether to keep placeholders or enable real AdMob/RevenueCat SDKs before v1.0.

## If live SDKs are enabled before release

Re-run privacy review before submitting store metadata. Real ad, purchase, analytics, crash, or support SDKs can change Apple privacy labels and Google Play Data safety answers.
