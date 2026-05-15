# Release evidence template

Copy this file to `reports/release-evidence-YYYY-MM-DD.md` for each release
candidate. Do not mark a gate complete without a concrete record, URL, build ID,
screenshot path, or reviewer note. Manual release gates are also represented in
`reports/release-gates.json`, which is consumed by `npm run release:preflight`.

## Candidate identity

| Field | Evidence |
|---|---|
| Date | TBD |
| Git commit | TBD |
| EAS build profile | preview or production |
| Android build ID / URL | TBD |
| iOS build ID / URL | TBD |
| Tester / device owner | TBD |

## Build commands

| Gate | Command or URL | Result |
|---|---|---|
| Local validation | `npm run validate` | TBD |
| Release preflight | `npm run release:preflight` | TBD; also update `reports/release-gates.json` for manual gates |
| Preview/internal build | `npm run build:preview` | TBD |
| Production build | `npm run build:production` | TBD |
| Production submit | `npm run submit:production` | TBD |

## Physical-device smoke tests

| Platform | Device / OS | Installed build | Checks | Result | Evidence |
|---|---|---|---|---|---|
| Android | TBD | TBD | onboarding, practice, audio, mock exam no ads, progress restart, privacy pages | TBD | screenshot/video/log path |
| iOS | TBD | TBD | onboarding, practice, audio, mock exam no ads, progress restart, privacy pages | TBD | screenshot/video/log path |

## Audio-specific checks

If device smoke evidence is recorded in local JSON, use paths such as
`reports/device-smoke/android-audio.json` and
`reports/device-smoke/ios-audio.json`. Local JSON referenced by
`android-device-audio` or `ios-device-audio` gate evidence is validated by
`npm run release:preflight` and must include: `status: "passed"`, matching
`platform`, `device`, `sourceBuild`, and passed checks for
`sv-se-question-audio`, `audio-button-state`, `speech-engine-unavailable`,
`onboarding`, `practice-answer-flow`, `mock-exam-no-ads`, `progress-restart`,
and `privacy-legal-pages`.

| Platform | Check | Result | Notes |
|---|---|---|---|
| Android | Swedish `sv-SE` question text speaks clearly | TBD |  |
| Android | Audio button respects mute/disabled state | TBD |  |
| Android | App remains usable if speech engine is unavailable | TBD |  |
| iOS | Swedish `sv-SE` question text speaks clearly | TBD |  |
| iOS | Audio button respects mute/disabled state | TBD |  |
| iOS | App remains usable if speech engine is unavailable | TBD |  |

## Store/account gates

| Gate | Required evidence | Status |
|---|---|---|
| Apple Developer account | Team ID or App Store Connect access note | TBD |
| App Store Connect app record | App record URL for `com.billyyiu.swedishcivictest` | TBD |
| TestFlight upload | Build number, processing status, beta review status | TBD |
| Google Play Console app record | App record URL for `com.billyyiu.swedishcivictest` | TBD |
| Google Play internal release | Track URL, version code, tester group | TBD |
| AdMob app record | AdMob app ID, or explicit decision to keep real ads disabled for this release | TBD |
| Public support URL | URL visible in both store records | TBD |
| Public privacy URL | URL visible in both store records | TBD |

## Privacy and monetization review

Do not mark `privacy-review` READY in `reports/release-gates.json` until this
section names the generated binary/build reviewed for Apple privacy labels,
Google Play Data safety, and the disabled Google Mobile Ads SDK posture.

| Question | Answer for this candidate | Evidence |
|---|---|---|
| Are real ads enabled? | TBD | SDK/config review |
| Is any purchase SDK enabled? | TBD | SDK/config review |
| Is analytics or crash reporting enabled? | TBD | SDK/config review |
| Do Apple privacy labels still match the binary? | TBD | `publishing/privacy-labels.md` review |
| Does Google Play Data safety still match the binary? | TBD | `publishing/google-play-data-safety.md` review |
| Does the generated binary match the documented Google Mobile Ads SDK posture? | TBD | build ID plus `REAL_ADS_ENABLED_FOR_V1=false` / test app ID review |

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
