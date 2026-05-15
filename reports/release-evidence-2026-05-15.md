# Release evidence — 2026-05-15

## Candidate identity

| Field | Evidence |
|---|---|
| Date | 2026-05-15 |
| Git commit | `ffed2ac` on `main` (`feat: guard production build preflight`); product commit verified before this evidence refresh |
| Branch | `main`; private GitHub remote is `Babbloo-studio/Swedish_Civic_Test` |
| EAS build profile | Not built; blocked before EAS build by authentication |
| Android build ID / URL | BLOCKED — no EAS preview/internal build because `npx --yes eas-cli@18.13.0 whoami` returns `Not logged in` |
| iOS build ID / URL | BLOCKED — no EAS preview/TestFlight build because `npx --yes eas-cli@18.13.0 whoami` returns `Not logged in` |
| Tester / device owner | Not assigned; physical-device tests blocked until installable builds exist |

## Build commands

| Gate | Command or URL | Result |
|---|---|---|
| Local validation | `npm run validate` | PASS inside `npm run release:preflight` on 2026-05-15 21:33 CEST; includes typecheck, lint, format check, all test suites, and content validation |
| Release preflight | `npm run release:preflight` | BLOCKED on 2026-05-15 21:33 CEST by external/device/store gates; expected non-zero exit 1; current manual gate evidence lives in `reports/release-gates.json`; public support/privacy URLs are READY |
| Web production export smoke | `npm run release:web-export-smoke` | PASS as part of release-preflight hardening; exported `dist-web/index.html` and `dist-web/metadata.json` |
| Expo Doctor | `npm exec -- expo-doctor` | PASS at 2026-05-15 18:36 CEST; 17/17 checks passed after removing local `eas-cli` |
| Native prebuild smoke | `npm run release:native-prebuild-smoke` | PASS and now runs in release preflight; Android and iOS prebuild finished |
| Preview/internal build | `npm run build:preview` | Not run; blocked by EAS authentication |
| Production build | `npm run build:production` | Not run; must wait for preview/internal device evidence |
| Production submit | `npm run submit:production` | Not run; must wait for store records, device evidence, final screenshots, and preflight pass |

## Validation details

Latest `npm run validate` evidence from `npm run release:preflight` on 2026-05-15 21:33 CEST:

- TypeScript typecheck passed.
- Expo lint passed with `--max-warnings=0`.
- Prettier format check passed.
- Learning tests passed: 5/5.
- Exam tests passed: 3/3.
- Audio tests passed: 2/2, including speech-engine-unavailable no-crash coverage.
- Derived-content test passed: 1/1.
- Content production test passed: 1/1.
- Compliance test passed: 1/1.
- Monetization tests passed: 2/2.
- Publishing tests passed: 5/5.
- Public URL checker tests passed: 2/2.
- Build-config tests passed: 7/7, including production build preflight guard coverage and production submit guard coverage for placeholder App Store Connect identifiers.
- App-assets test passed: 1/1.
- Screenshot-manifest test passed: 1/1.
- Release-preflight tests passed: 8/8, including stale public URL evidence, weak READY manual evidence, placeholder/blocker wording, web-draft screenshot evidence, missing store support/privacy URL entry, and generic submission evidence fail-closed coverage.
- Theme-discipline test passed: 1/1.
- Accessibility-labels test passed: 1/1.
- Content validation: 13 chapters, 500 questions, 500 published questions.

## Release preflight result

`npm run release:preflight` currently reports `BLOCKED`.

Ready gates:

- `local-validation`: ready; rerun for the exact release candidate.
- `expo-doctor`: ready; 17/17 checks passed.
- `web-export`: ready; production web export passed.
- `native-prebuild`: ready; Android and iOS prebuild smoke passed.
- `eas-cli`: ready through pinned npx; `npx --yes eas-cli@18.13.0 --version` reports `eas-cli/18.13.0 darwin-arm64 node-v26.0.0`.

Blocked gates:

- `eas-auth`: `Not logged in`.
- `android-device-audio`: no Android physical-device build/install/audio evidence.
- `ios-device-audio`: no iOS physical-device/TestFlight build/install/audio evidence.
- `store-records`: no App Store Connect or Google Play Console app record evidence; AdMob is deferred because real ads are disabled for v1.0.
- `public-urls`: ready; support URL https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/ and privacy URL https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/ returned HTTP 200 during the live release-preflight URL check.
- `device-screenshots`: web-draft screenshots and manifest exist, but final device/store screenshots are not recorded.
- `submission`: no TestFlight, Google Play internal test, production submission, or post-launch monitoring evidence.

## UI/UX polish gate

| Check | Evidence | Status |
|---|---|---|
| Central theme tokens | `lib/theme/{colors,spacing,typography,radius,shadows,motion,index}.ts` | READY |
| No literal colors in screens/components | `scripts/theme-discipline.test.js`; acceptance grep returns zero lines | READY |
| No literal spacing/radius in screens/components for enforced style properties | `scripts/theme-discipline.test.js`; spacing/radius grep returns zero lines | READY |
| No literal typography values in screens/components | `scripts/theme-discipline.test.js`; typography grep returns zero lines for font size, line height, letter spacing, and font weight | READY |
| Expo web visual smoke | `npm run build:web:export`; `npm run test:e2e -- tests/e2e/visual-smoke.spec.ts`; screenshots in `reports/2026-05-15-uiux-screenshots/` | READY |
| Interactive accessibility semantics | `scripts/accessibility-labels.test.js`; `npm run test:a11y-labels`; explicit labels, roles, and disabled/selected/checked states; `reports/2026-05-15-accessibility-labels.md` | READY |
| Evidence report | `reports/2026-05-15-uiux-polish.md` | READY |

## Physical-device smoke tests

| Platform | Device / OS | Installed build | Checks | Result | Evidence |
|---|---|---|---|---|---|
| Android | BLOCKED | BLOCKED | onboarding, practice, audio, mock exam no ads, progress restart, privacy pages | BLOCKED | Need EAS preview/internal build URL and device notes |
| iOS | BLOCKED | BLOCKED | onboarding, practice, audio, mock exam no ads, progress restart, privacy pages | BLOCKED | Need EAS preview/TestFlight build URL and device notes |

## Audio-specific checks

| Platform | Check | Result | Notes |
|---|---|---|---|
| Android | Swedish `sv-SE` question text speaks clearly | BLOCKED | Requires physical Android build install |
| Android | Audio button respects mute/disabled state | BLOCKED | Requires physical Android build install |
| Android | App remains usable if speech engine is unavailable | CODE READY; DEVICE BLOCKED | `speakSwedish` and `stopSpeech` catch/log platform speech errors; physical Android install still required |
| iOS | Swedish `sv-SE` question text speaks clearly | BLOCKED | Requires physical iOS/TestFlight build install |
| iOS | Audio button respects mute/disabled state | BLOCKED | Requires physical iOS/TestFlight build install |
| iOS | App remains usable if speech engine is unavailable | CODE READY; DEVICE BLOCKED | `speakSwedish` and `stopSpeech` catch/log platform speech errors; physical iOS/TestFlight install still required |

## Store/account gates

| Gate | Required evidence | Status |
|---|---|---|
| Apple Developer account | Team ID or App Store Connect access note | BLOCKED — no account evidence recorded |
| App Store Connect app record | App record URL for `com.billyyiu.swedishcivictest` | BLOCKED — no app record evidence recorded |
| TestFlight upload | Build number, processing status, beta review status | BLOCKED — no iOS build upload evidence |
| Google Play Console app record | App record URL for `com.billyyiu.swedishcivictest` | BLOCKED — no app record evidence recorded |
| Google Play internal release | Track URL, version code, tester group | BLOCKED — no Android internal release evidence |
| AdMob app record | AdMob app ID or decision to keep ads disabled/placeholders | DEFERRED — real ads are disabled for v1.0; AdMob required only before enabling live ads |
| Public support URL | URL visible in both store records | HOSTED — https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/; still must be entered in store records |
| Public privacy URL | URL visible in both store records | HOSTED — https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/; still must be entered in store records |

## Privacy and monetization review

| Question | Answer for this candidate | Evidence |
|---|---|---|
| Are real ads enabled? | No; `REAL_ADS_ENABLED_FOR_V1` is `false` and ad rendering is fail-closed | `lib/monetization/ads.ts`, `scripts/monetization.test.js` |
| Is any purchase SDK enabled? | No; premium flag placeholder only | `lib/monetization/premium.ts`, `scripts/monetization.test.js` |
| Is analytics or crash reporting enabled? | No analytics/crash SDK evidence in current MVP | `package.json`, privacy/data-safety docs |
| Do Apple privacy labels still match the binary? | Draft matches current MVP local-only/no-collection posture, but must be re-reviewed before submission | `publishing/privacy-labels.md` |
| Does Google Play Data safety still match the binary? | Draft matches current MVP local-only/no-collection posture, but must be re-reviewed before submission | `publishing/google-play-data-safety.md` |

## Submission decision

- [x] Local validation passed.
- [ ] Android physical-device smoke passed.
- [ ] iOS physical-device smoke passed.
- [ ] Store metadata reviewed against submitted binary.
- [ ] Screenshots captured from real target devices or accepted store tooling.
- [x] Support and privacy URLs are public and match in-app copy.
- [ ] No unresolved blocker remains in this evidence file.

Decision: `BLOCKED`

Decision notes:

- The repository is locally validated and release-preflighted, but this candidate is not ready for internal test or store submission.
- First unblocker: log in to Expo/EAS or provide an approved Expo token, then run `npx --yes eas-cli@18.13.0 whoami` and `npm run release:preflight`.
- Follow `publishing/post-eas-auth-runbook.md` after EAS auth is available.
