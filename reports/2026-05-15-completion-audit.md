# Completion audit — 2026-05-15

## Objective

Work on `/Users/billy/Desktop/projects/Swedish_Civic_Test` until the project is finished.

## Concrete success criteria derived from the roadmap

The project is finished only when all roadmap phases 0–10 are complete, verified, and no external release blockers remain.

## Evidence snapshot

- Current branch after local integration: `main`
- Latest local main state includes release-preflight, Expo Doctor, web-export, and native-prebuild hardening beyond the earlier app-code milestone.
- Fresh validation command: `npm run validate`
- Fresh validation result from `npm run release:preflight` on 2026-05-15 18:56 CEST: pass; includes typecheck, lint, format, learning tests, exam tests, audio tests, derived-content test, content-production test, compliance test, monetization test, publishing test, build-config test, app-assets test, screenshot-manifest test, release-preflight test, and content validation.
- Content validation result: 13 chapters, 500 questions, 500 published questions.
- Content database: `content/question-bank.csv` regenerated with 500 question rows plus header.
- Browser smoke after mock-exam fix: `/exam` renders `20 UHR-based questions` and `no ads during exam`; browser console had 0 errors and 1 known React Native web `pointerEvents` deprecation warning.
- Release evidence capture is now templated in `reports/release-evidence-template.md`; store screenshots are planned in `publishing/screenshot-shotlist.md`.
- EAS access check: local `eas-cli` dependency was removed after Expo Doctor flagged it; pinned `npx --yes eas-cli@18.13.0 --version` works, while `npx --yes eas-cli@18.13.0 whoami` remains blocked by `Not logged in`; see `reports/2026-05-15-eas-access-check.md`.
- Release asset check: `assets/icon.png`, `assets/adaptive-icon.png`, and `assets/splash-icon.png` are configured in `app.json` and verified by `scripts/app-assets.test.js`; see `reports/2026-05-15-release-assets.md`.
- Support surface check: `/support` exists, is linked from the profile legal links, is covered by `scripts/compliance-pages.test.js`, and rendered in Expo web with 0 console errors; see `reports/2026-05-15-support-surface.md`.
- Public support/privacy page copy and static HTML pages are prepared in `publishing/public-support-and-privacy.md` and `publishing/public-site/`, but final hosted HTTPS URLs remain external.
- Screenshot manifest and web-draft screenshot evidence are prepared in `publishing/screenshot-manifest.json` and `reports/2026-05-15-web-draft-screenshots.md`, but final device/store screenshots remain external.
- Executable release preflight exists at `scripts/release-preflight.js`; it now reruns local validation, runs Expo Doctor, runs the web export smoke, runs Android/iOS native prebuild smoke, checks pinned npx EAS CLI/authentication, and consumes manual gate evidence from `reports/release-gates.json`. The latest run on 2026-05-15 18:56 CEST still reported `BLOCKED` because EAS auth, device audio, store records, public hosted URLs, final screenshots, and submissions lack evidence.
- Filled release evidence artifact exists at `reports/release-evidence-2026-05-15.md`; decision is `BLOCKED`.
- v1.0 real ads are deferred and ad rendering is fail-closed; see `reports/2026-05-15-v1-ads-deferred.md`.
- Web production export smoke passed and is now part of `npm run release:preflight`; see `reports/2026-05-15-web-export-smoke.md`.
- Expo Doctor initially flagged the local `eas-cli` dependency; after switching build/preflight commands to pinned `npx --yes eas-cli@18.13.0`, `npm exec -- expo-doctor` passed 17/17 checks; see `reports/2026-05-15-expo-doctor.md`.
- Isolated Android/iOS native prebuild smoke passed after adding `expo-system-ui` for the configured `userInterfaceStyle`; it is now part of `npm run release:preflight`; see `reports/2026-05-15-native-prebuild-smoke.md`.
- Post-EAS-auth runbook exists at `publishing/post-eas-auth-runbook.md` to sequence build, physical-device, store-record, TestFlight, Google Play internal, preflight, and submission evidence collection.
- Local `main` was fast-forwarded to the validated batch branch because no Git remote exists for the planned PR; see `reports/2026-05-15-local-main-integration.md`.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
|---|---|---|
| Choose final app name | `app.json` name: `Sweden Citizenship Test Prep`; `publishing/release-readiness.md` | Done |
| Expo/TypeScript/router/lint/format setup | `package.json`, `app.json`, `tsconfig.json`, `eslint.config.js`; `npm run validate` | Done |
| 13 UHR chapter records | `data/chapters.ts`; content validation reports 13 chapters | Done |
| Practice question schema and UHR references | `types/content.ts`, `scripts/validate-content.js` | Done |
| 500 questions | `data/questions.ts`, `data/additionalQuestions.ts`, `lib/content/derivedQuestions.ts`; content validation reports 500 | Done |
| 500 published/reviewed questions | `scripts/validate-content.js`; validation reports 500 published questions | Done |
| Content spreadsheet/database | `content/question-bank.csv`, `scripts/export-question-bank.js` | Done |
| UHR chapter/section map | `content/uhr-section-map.json` | Done |
| Core screens | `app/onboarding.tsx`, `app/(tabs)/home.tsx`, `app/(tabs)/learn.tsx`, `app/chapter/[chapterId].tsx`, `app/(tabs)/practice.tsx`, `app/settings.tsx` | Done |
| Progress/storage/mistakes | `lib/storage/progressStore.ts`, `app/(tabs)/mistakes.tsx` | Done |
| Learning mechanics | `lib/learning/*`, `scripts/learning.test.js` | Done |
| Timed mock exam | `app/(tabs)/exam.tsx`, `lib/quiz/examGenerator.ts`, `scripts/exam.test.js`; browser `/exam` smoke shows 20 questions | Done |
| Ads disabled during exam | `app/(tabs)/exam.tsx` has no ad imports; `scripts/monetization.test.js` verifies no ad import | Done |
| Swedish audio code | `lib/audio/speak.ts`, `components/learning/AudioButton.tsx`, `scripts/audio.test.js` | Code done |
| Android audio device test | No physical Android build/device evidence | Missing |
| iOS audio device test | No physical iOS/TestFlight/device evidence | Missing |
| AdMob test units and safe placements | `lib/monetization/ads.ts`, `components/monetization/*`, `scripts/monetization.test.js`, `reports/2026-05-15-v1-ads-deferred.md` | Code done; real ads fail-closed for v1.0 |
| AdMob account/app | Real ads deferred for v1.0; required only before enabling live ads | Deferred external |
| Premium ad disable flag | `lib/monetization/premium.ts`, `PremiumBanner`, monetization test | Done |
| RevenueCat later if needed | Deferred in docs; no SDK by design | Deferred/external decision |
| Disclaimer/privacy/terms/sources | `app/disclaimer.tsx`, `app/privacy.tsx`, `app/terms.tsx`, `app/sources.tsx`, compliance test | Done |
| In-app support surface | `app/support.tsx`, `components/compliance/ComplianceLinks.tsx`, `scripts/compliance-pages.test.js` | Done |
| App Store listing | `publishing/app-store-listing.md`, publishing test | Draft done; needs account upload |
| Google Play listing | `publishing/google-play-listing.md`, publishing test | Draft done; needs account upload |
| Apple privacy labels | `publishing/privacy-labels.md`, publishing test | Draft done for current MVP |
| Google Play Data Safety | `publishing/google-play-data-safety.md`, publishing test | Draft done for current MVP |
| App icon and splash assets | `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`, `app.json`, `scripts/app-assets.test.js` | Done |
| EAS/build/native config | `eas.json`, `publishing/build-and-submit-runbook.md`, `scripts/build-config.test.js`, `scripts/native-prebuild-smoke.js`, isolated native prebuild smoke | Done locally; EAS cloud build still blocked by auth |
| Web production export smoke | `npm run release:web-export-smoke`, `reports/2026-05-15-web-export-smoke.md`; also runs in `npm run release:preflight` | Done |
| EAS CLI availability | Build/preflight scripts use pinned `npx --yes eas-cli@18.13.0`; `npx --yes eas-cli@18.13.0 --version` works | Done |
| EAS account authentication | `reports/2026-05-15-eas-access-check.md`; `npx --yes eas-cli@18.13.0 whoami` returned `Not logged in` | Blocked external/account |
| TestFlight beta | Requires Apple account, App Store Connect app record, build upload, beta review | Blocked external |
| Google Play internal test | Requires Play Console app record, service account/upload, internal release | Blocked external |
| Public support/privacy URL copy | `publishing/public-support-and-privacy.md`, `publishing/public-site/support/index.html`, `publishing/public-site/privacy/index.html`, `scripts/publishing.test.js` | Static pages done; hosting still external |
| Public support URL | In-app support surface and static public pages exist, but public URL/mailbox must be hosted and entered in stores | Blocked external/account |
| Store screenshot manifest and web drafts | `publishing/screenshot-manifest.json`, `reports/2026-05-15-web-draft-screenshots.md`, `publishing/screenshot-shotlist.md` | Draft done; final device screenshots still external |
| Executable release preflight | `scripts/release-preflight.js`, `scripts/release-preflight.test.js`, `reports/release-gates.json`, `npm run release:preflight` | Done; runs validation, Expo Doctor, web export, native prebuild, EAS auth, and manual gate checks; currently reports BLOCKED external gates |
| Filled release evidence | `reports/release-evidence-2026-05-15.md` | Done; decision BLOCKED |
| Post-EAS-auth release runbook | `publishing/post-eas-auth-runbook.md`, `scripts/publishing.test.js` | Done |
| Submit Android app | Requires store account, internal testing, final screenshots/assets; screenshot shotlist exists in `publishing/screenshot-shotlist.md` | Not done |
| Submit iOS app | Requires store account, TestFlight, final screenshots/assets; screenshot shotlist exists in `publishing/screenshot-shotlist.md` | Not done |
| Monitor crash reports/content reports/first-week fixes/reviews | Requires launched app and telemetry/support process; release evidence template exists in `reports/release-evidence-template.md` | Not done |
| Plan v1.1 | `docs/release/post-launch-v1.1-plan.md` | Done for post-launch planning; execution deferred until v1.0 launch evidence exists |

## Conclusion

The goal is not complete.

The codebase now has a validated 500-question published content milestone, release metadata drafts, EAS configuration, and strong automated checks. Remaining incompletion is concentrated in physical-device verification and external account/store release steps.

## Highest-leverage next actions

1. Log in to Expo/EAS, then create an EAS preview build for Android and iOS physical-device audio tests.
2. Create App Store Connect, Google Play Console, and AdMob records.
3. Upload TestFlight and Google Play internal test builds.
4. Use `reports/release-evidence-template.md` and `publishing/screenshot-shotlist.md` to capture public support/privacy URLs, screenshots, and device-test evidence.
5. Submit store builds only after device/store verification and privacy review are current.
