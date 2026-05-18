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
- Public support/privacy hosting copy: `publishing/public-support-and-privacy.md`
- Hostable public support/privacy pages: `publishing/public-site/support/index.html`, `publishing/public-site/privacy/index.html`
- Screenshot manifest: `publishing/screenshot-manifest.json`
- Web-draft screenshot evidence: `reports/2026-05-15-web-draft-screenshots.md`
- Executable release preflight: `npm run release:preflight`
- Machine-readable external gate evidence: `reports/release-gates.json`
- Post-EAS-auth runbook: `publishing/post-eas-auth-runbook.md`
- Filled release evidence: `reports/release-evidence-2026-05-15.md`
- v1.0 ads deferred evidence: `reports/2026-05-15-v1-ads-deferred.md`
- Web export smoke evidence: `reports/2026-05-15-web-export-smoke.md`
- Expo Doctor evidence: `reports/2026-05-15-expo-doctor.md`
- Native prebuild smoke evidence: `reports/2026-05-15-native-prebuild-smoke.md`
- Local main integration evidence: `reports/2026-05-15-local-main-integration.md`
- Private GitHub remote evidence: `reports/2026-05-15-github-remote.md`
- Hosted public URL evidence: `reports/2026-05-15-public-urls-hosted.md`
- External release-gates tracking issue: https://github.com/SzeChunYiu/Swedish_Civic_Test/issues/11
- In-app disclaimer: `/disclaimer`
- In-app privacy policy: `/privacy`
- In-app terms: `/terms`
- In-app source page: `/sources`

## External blockers before submission

- Apple Developer account access and App Store Connect app record.
- Google Play Console account access and app record.
- Public support URL hosted: https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/
- Public privacy policy URL hosted: https://szechunyiu.github.io/Swedish_Civic_Test-public-site/privacy/
  - Store-record entry remains blocked until Apple/Google app records exist.
- Real screenshots from target devices.
- TestFlight build upload and beta review.
- Google Play internal test release.
- Android device audio verification.
- iOS device audio verification.
- Real ads and RevenueCat are deferred for v1.0. Re-enable only after AdMob/product setup plus privacy and data-safety review.

## Executable blocker check

Run:

```bash
npm run release:preflight
```

The command reruns local validation, runs Expo Doctor, runs the web export
smoke, runs Android/iOS native prebuild smoke, checks EAS CLI/authentication, reads `reports/release-gates.json`, and exits non-zero until every
external/device/store gate has concrete evidence. It is intentionally
fail-closed; update both `reports/release-gates.json` and the dated release
evidence file when external evidence is collected.

## If live SDKs are enabled before release

Re-run privacy review before submitting store metadata. Real ad, purchase, analytics, crash, or support SDKs can change Apple privacy labels and Google Play Data safety answers.
