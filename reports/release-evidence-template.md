# Release evidence template

Copy this file to `reports/release-evidence-YYYY-MM-DD.md` for each release
candidate. Do not mark a gate complete without a concrete record, URL, build ID,
screenshot path, or reviewer note. Manual release gates are also represented in
`reports/release-gates.json`, which is consumed by `npm run release:preflight`.

## Candidate identity

| Field                  | Evidence              |
| ---------------------- | --------------------- |
| Date                   | TBD                   |
| Git commit             | TBD                   |
| EAS build profile      | preview or production |
| Android build ID / URL | TBD                   |
| iOS build ID / URL     | TBD                   |
| Tester / device owner  | TBD                   |

## Build commands

| Gate                   | Command or URL              | Result                                                         |
| ---------------------- | --------------------------- | -------------------------------------------------------------- |
| Local validation       | `npm run validate`          | TBD                                                            |
| Release preflight      | `npm run release:preflight` | TBD; also update `reports/release-gates.json` for manual gates |
| Preview/internal build | `npm run build:preview`     | TBD                                                            |
| Production build       | `npm run build:production`  | TBD                                                            |
| Production submit      | `npm run submit:production` | TBD                                                            |

## EAS build artifact evidence

If build evidence is recorded in local JSON, use a path such as
`reports/eas-builds/eas-builds.json`. Local JSON referenced by the
`eas-build-artifacts` gate is validated by `npm run release:preflight` and must
include: `status: "ready"`, `appVersion`, `gitCommit`, and Android plus iOS
build records with profile, build ID, Expo/App Store/Google Play URL, artifact
type (`apk`/`aab` for Android and `ipa`/`testflight` for iOS), and
ready/complete/uploaded/installed status.

## Physical-device smoke tests

| Platform | Device / OS | Installed build | Checks                                                                         | Result | Evidence                  |
| -------- | ----------- | --------------- | ------------------------------------------------------------------------------ | ------ | ------------------------- |
| Android  | TBD         | TBD             | onboarding, practice, audio, mock exam no ads, progress restart, privacy pages | TBD    | screenshot/video/log path |
| iOS      | TBD         | TBD             | onboarding, practice, audio, mock exam no ads, progress restart, privacy pages | TBD    | screenshot/video/log path |

## Audio-specific checks

If device smoke evidence is recorded in local JSON, use paths such as
`reports/device-smoke/android-audio.json` and
`reports/device-smoke/ios-audio.json`. Local JSON referenced by
`android-device-audio` or `ios-device-audio` gate evidence is validated by
`npm run release:preflight` and must include: `status: "passed"`, matching
`platform`, `device`, `sourceBuild`, and passed checks for
`sv-se-question-audio`, `audio-button-state`, `speech-engine-unavailable`,
`onboarding`, `practice-answer-flow`, `mock-exam-no-ads`, `progress-restart`,
and `privacy-legal-pages`. The JSON must also include at least one proof
artifact (`log`, `video`, `screenshot`, or `audio`) as either a local file next
to the JSON evidence or an HTTPS URL.

| Platform | Check                                              | Result | Notes |
| -------- | -------------------------------------------------- | ------ | ----- |
| Android  | Swedish `sv-SE` question text speaks clearly       | TBD    |       |
| Android  | Audio button respects mute/disabled state          | TBD    |       |
| Android  | App remains usable if speech engine is unavailable | TBD    |       |
| iOS      | Swedish `sv-SE` question text speaks clearly       | TBD    |       |
| iOS      | Audio button respects mute/disabled state          | TBD    |       |
| iOS      | App remains usable if speech engine is unavailable | TBD    |       |

## Store/account gates

If store/account evidence is recorded in local JSON, use a path such as
`reports/store-records/store-records.json`. Local JSON referenced by the
`store-records` gate is validated by `npm run release:preflight` and must
include: `status: "ready"`, `bundleIdentifier:
"com.billyyiu.almostswedish"`, Google Play package
`com.billyyiu.almostswedish`, App Store Connect URL, Google Play Console URL,
exact hosted support/privacy URLs, concrete Apple Team ID / Google Play
developer ID ownership review, concrete AdMob app ID evidence for the
ad-supported release, `adMob.realAdsEnabled: true`, and
`adMob.appAdsTxtReviewed: true` for the hosted app-ads.txt file. It must also
confirm App Store and Google Play listing metadata were reviewed against
`publishing/app-store-listing.md` and `publishing/google-play-listing.md` and
match the store records.

| Gate                           | Required evidence                                                                           | Status |
| ------------------------------ | ------------------------------------------------------------------------------------------- | ------ |
| Apple Developer account        | Team ID or App Store Connect access note                                                    | TBD    |
| App Store Connect app record   | App record URL for `com.billyyiu.almostswedish`                                             | TBD    |
| TestFlight upload              | Build number, processing status, beta review status                                         | TBD    |
| Google Play Console app record | App record URL for `com.billyyiu.almostswedish`                                             | TBD    |
| Google Play internal release   | Track URL, version code, tester group                                                       | TBD    |
| AdMob app record               | AdMob app ID(s), `adMob.realAdsEnabled: true`, app-ads.txt review, and seller line evidence | TBD    |
| Public support URL             | URL visible in both store records                                                           | TBD    |
| Public privacy URL             | URL visible in both store records                                                           | TBD    |

## Store submit credential evidence

If store submit credential evidence is recorded in local JSON, use a path such
as `reports/store-credentials/store-credentials.json`. Local JSON referenced by
the `store-credentials` gate is validated by `npm run release:preflight` and
must include: `status: "ready"`, iOS Apple ID email, App Store Connect app ID,
Apple Team ID, credentials source and review timestamp, plus Android Google Play
service-account email, SHA256 key fingerprint, package name
`com.billyyiu.almostswedish`, credentials source, and review timestamp. Do
not commit service-account private keys or passwords; record only non-secret
identifiers and fingerprints.

## Store policy questionnaire evidence

If store policy questionnaire evidence is recorded in local JSON, use a path
such as `reports/store-policy-questionnaires/store-policy-questionnaires.json`.
Local JSON referenced by the `store-policy-questionnaires` gate is validated by
`npm run release:preflight` and must include: `status: "reviewed"`,
`reviewedAt`, `reviewer`, Apple age-rating review, Apple export-compliance
review with `usesNonExemptEncryption: false`, content-rights review, no
official-affiliation claims, Google Play content-rating review, target-audience
review, ads declaration review, no real-money gambling, and no government
affiliation claims.

## Release-owner approval evidence

If final release-owner approval is recorded in local JSON, use a path such as
`reports/release-owner-approval/release-owner-approval.json`. Local JSON
referenced by the `release-owner-approval` gate is validated by
`npm run release:preflight` and must include: `status: "approved"`,
`approvedAt`, `approver`, `approvedCommit`,
`releaseDecision: "approved-for-store-submission"`, `noKnownBlockers: true`,
`evidenceReport: "reports/release-evidence-2026-05-15.md"`, and checked gate
IDs for EAS auth/builds, device audio, store records/credentials/policy,
privacy review, public URLs, and final screenshots.

## Privacy and monetization review

Do not mark `privacy-review` READY in `reports/release-gates.json` until this
section names the generated binary/build reviewed for Apple privacy labels,
Google Play Data safety, the ad-supported Google Mobile Ads release posture,
Remove Ads purchase handling, and ATT/UMP consent disclosures.

If privacy evidence is recorded in local JSON, use a path such as
`reports/privacy-review/privacy-review.json`. Local JSON referenced by the
`privacy-review` gate is validated by `npm run release:preflight` and must
include: `status: "reviewed"`, `reviewedAt`, `reviewer`, reviewed build
ID/version/commit, App Store Connect and Google Play questionnaire review
status, Apple privacy labels reviewed against `publishing/privacy-labels.md`,
Google Play Data safety reviewed against
`publishing/google-play-data-safety.md`, Google Mobile Ads SDK present,
`googleMobileAds.realAdsEnabled: true`, real AdMob app/unit ID and app-ads.txt
review, `googleMobileAds.removeAdsIapReviewed: true` for the 29 SEK
non-consumable Remove Ads product, `googleMobileAds.consentFlowReviewed: true`
for App Tracking Transparency and Google UMP consent, and disabled analytics
plus crash reporting SDKs.

| Question                                                                      | Answer for this candidate                 | Evidence                                                                                              |
| ----------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Are real ads enabled?                                                         | TBD; READY requires ad-supported real ads | generated binary, `EXPO_PUBLIC_REAL_ADS_ENABLED=true`, AdMob app/unit ID, and app-ads.txt review      |
| Is any purchase SDK enabled?                                                  | TBD; READY requires Remove Ads IAP review | generated binary, 29 SEK non-consumable product, purchase/restore flow review                         |
| Is analytics or crash reporting enabled?                                      | TBD                                       | SDK/config review                                                                                     |
| Do Apple privacy labels still match the binary?                               | TBD                                       | `publishing/privacy-labels.md` review                                                                 |
| Does Google Play Data safety still match the binary?                          | TBD                                       | `publishing/google-play-data-safety.md` review                                                        |
| Does the generated binary match the documented Google Mobile Ads SDK posture? | TBD                                       | build ID plus ad-supported Google Mobile Ads, ATT/UMP consent, Remove Ads IAP, and app-ads.txt review |

## Final store screenshot evidence

If final screenshot evidence is recorded in local JSON, use a path such as
`reports/final-store-screenshots/manifest.json`. Local manifests referenced by
the `device-screenshots` gate are validated by `npm run release:preflight` and
must include: `status: "final-device"`, at least five screenshots, required
routes `/home`, `/learn`, `/practice`, `/exam`, and `/profile`, final
device/accepted capture metadata, source build, pixel width/height, locale, and
existing local screenshot files. It must also include a `contentReview` block
confirming no official-affiliation claims, no guaranteed-exam-result claims, no
test ad banners, no ads in mock exam, and privacy/source pages matching the
publishing docs.

## Submission evidence

If submission evidence is recorded in local JSON, use a path such as
`reports/submission/submission.json`. Local JSON referenced by the `submission`
gate is validated by `npm run release:preflight` and must include: `status:
"submitted"`, TestFlight build number/status/URL, Google Play internal track
URL/version code/tester group, iOS and Android production submission IDs and
review statuses, and an existing monitoring report path. The referenced
monitoring report must also cover the first-week window, crash reports,
content/support reports, and store reviews/ratings.

## Submission decision

- [ ] Local validation passed.
- [ ] Android physical-device smoke passed.
- [ ] iOS physical-device smoke passed.
- [ ] Store metadata reviewed against submitted binary.
- [ ] Apple privacy labels and Google Play Data safety reviewed against the generated binary.
- [ ] Screenshots captured from real target devices or accepted store tooling.
- [ ] Support and privacy URLs are public and match in-app copy.
- [ ] No unresolved blocker remains in this evidence file.

Decision: `BLOCKED` / `READY_FOR_INTERNAL_TEST` / `READY_FOR_STORE_SUBMISSION`

Decision notes:

- TBD
