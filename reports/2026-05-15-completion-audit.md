# Completion audit — 2026-05-15

## Objective

Work on `/Users/billy/Desktop/projects/Swedish_Civic_Test` until the project is finished.

## Concrete success criteria derived from the roadmap

The project is finished only when all roadmap phases 0–10 are complete, verified, and no external release blockers remain.

## Evidence snapshot

- Current branch after local integration: `main`
- Latest local main state includes release-preflight, Expo Doctor, web-export, and native-prebuild hardening beyond the earlier app-code milestone.
- Fresh validation command: `npm run validate`
- Fresh validation result from `npm run validate` on 2026-05-15 23:59 CEST: pass; includes typecheck, lint, format, npm audit, learning tests, exam tests, audio tests, derived-content test, content-production test, compliance test, monetization test, publishing test, public URL checker test, build-config test, app-assets test, screenshot-manifest test, release-preflight test, theme-discipline test, release-gates-writer test, accessibility-labels test, and content validation.
- Content validation result: 13 chapters, 500 questions, 500 published questions.
- Content database: `content/question-bank.csv` regenerated with 500 question rows plus header.
- Browser smoke after mock-exam fix: `/exam` renders `20 UHR-based questions` and `no ads during exam`; browser console had 0 errors and 1 known React Native web `pointerEvents` deprecation warning.
- Release evidence capture is now templated in `reports/release-evidence-template.md`; store screenshots are planned in `publishing/screenshot-shotlist.md`.
- EAS access check: local `eas-cli` dependency was removed after Expo Doctor flagged it; pinned `npx --yes eas-cli@18.13.0 --version` works, while `npx --yes eas-cli@18.13.0 whoami` remains blocked by `Not logged in`; see `reports/2026-05-15-eas-access-check.md`.
- Release asset check: `assets/icon.png`, `assets/adaptive-icon.png`, and `assets/splash-icon.png` are configured in `app.json` and verified by `scripts/app-assets.test.js`; see `reports/2026-05-15-release-assets.md`.
- Support surface check: `/support` exists, is linked from the profile legal links, is covered by `scripts/compliance-pages.test.js`, and rendered in Expo web with 0 console errors; see `reports/2026-05-15-support-surface.md`.
- Public support/privacy page copy and static HTML pages are hosted on GitHub Pages; support URL `https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/` and privacy URL `https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/privacy/` returned HTTP 200 in the latest live release-preflight URL check; see `reports/2026-05-15-public-urls-hosted.md`.
- Screenshot manifest and web-draft screenshot evidence are prepared in `publishing/screenshot-manifest.json` and `reports/2026-05-15-web-draft-screenshots.md`, and `publishing/screenshot-shotlist.md` now documents a final `reports/final-store-screenshots/manifest.json` schema; final device/store screenshots remain external.
- Executable release preflight exists at `scripts/release-preflight.js`; it now reruns local validation, blocks dirty release worktrees, verifies referenced local artifact paths exist, requires exact hosted support/privacy URL values in READY URL/store evidence, runs the npm moderate-or-higher dependency security audit, runs Expo Doctor, runs the web export smoke, runs Android/iOS native prebuild smoke, checks pinned npx EAS CLI/authentication, live-checks hosted support/privacy URLs, requires concrete non-placeholder manual evidence for READY manual gates, rejects web-draft/browser-only screenshots for final screenshot gates, validates referenced local device-audio JSON for platform, device, source build, and required audio/shared smoke checks, validates referenced local store-record JSON for bundle identifier, App Store Connect URL, Google Play Console URL, exact hosted support/privacy URLs, and AdMob posture, validates referenced local final screenshot manifests for final-device status, required routes, device/capture/build metadata, and existing files, requires store-record evidence to include Support URL and Privacy Policy URL entry, requires final privacy-questionnaire review evidence to name the generated binary/build and disabled Google Mobile Ads SDK posture, validates referenced local submission JSON for TestFlight, Google Play internal track, production submission IDs/statuses, and monitoring report evidence, requires concrete submission IDs/URLs/reports, and consumes manual gate evidence from `reports/release-gates.json`. The latest run on 2026-05-15 23:59 CEST at product commit `7ff901f` still reported `BLOCKED`; local validation, Expo Doctor, web export, native prebuild, pinned npx EAS CLI, and public URLs were ready, while EAS auth, device audio, store records, final privacy questionnaire review, final screenshots, and submissions still lacked evidence.
- Filled release evidence artifact exists at `reports/release-evidence-2026-05-15.md`; decision is `BLOCKED`.
- v1.0 real ads are deferred and ad rendering is fail-closed; privacy/data-safety docs and public privacy copy now explicitly disclose that the native build includes `react-native-google-mobile-ads` with Google sample test app IDs while `REAL_ADS_ENABLED_FOR_V1=false`; see `reports/2026-05-15-v1-ads-deferred.md`.
- Web production export smoke passed and is now part of `npm run release:preflight`; see `reports/2026-05-15-web-export-smoke.md`.
- Expo Doctor initially flagged the local `eas-cli` dependency; after switching build/preflight commands to pinned `npx --yes eas-cli@18.13.0`, `npm exec -- expo-doctor` passed 17/17 checks; see `reports/2026-05-15-expo-doctor.md`.
- Isolated Android/iOS native prebuild smoke passed after adding `expo-system-ui` for the configured `userInterfaceStyle`; it is now part of `npm run release:preflight`; see `reports/2026-05-15-native-prebuild-smoke.md`.
- Post-EAS-auth runbook exists at `publishing/post-eas-auth-runbook.md` to sequence build, physical-device, store-record, TestFlight, Google Play internal, preflight, and submission evidence collection; `scripts/update-release-gate.js` is available to update `reports/release-gates.json` without hand-editing JSON, including longer evidence through `--evidence-file`.
- Local `main` was fast-forwarded to the validated batch branch; see `reports/2026-05-15-local-main-integration.md`.
- Private GitHub remote `Babbloo-studio/Swedish_Civic_Test` now exists and tracks `main` plus the batch branch; see `reports/2026-05-15-github-remote.md`.
- UI/UX token polish gate was reopened by `GOAL.md` and completed locally: `lib/theme/` exists, `app/` and `components/` no longer contain literal colors or enforced spacing/radius/typography literals, `scripts/theme-discipline.test.js` is wired into `npm test`, and Playwright visual smoke captured 15 primary routes under `reports/2026-05-15-uiux-screenshots/`; see `reports/2026-05-15-uiux-polish.md`.

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
| Professional token-driven UI/UX from `GOAL.md` | `lib/theme/*`, typography-token enforcement, `scripts/theme-discipline.test.js`, `playwright.config.ts`, `tests/e2e/visual-smoke.spec.ts`, `reports/2026-05-15-uiux-polish.md`, `reports/2026-05-15-uiux-screenshots/manifest.json`; GOAL acceptance commands passed | Done |
| Interactive accessibility semantics from `GOAL.md` | `scripts/accessibility-labels.test.js`, `npm run test:a11y-labels`, explicit `accessibilityLabel`, `accessibilityRole`, and disabled/selected/checked `accessibilityState` props in app/component interactive call sites, `reports/2026-05-15-accessibility-labels.md` | Done |
| Progress/storage/mistakes | `lib/storage/progressStore.ts`, `app/(tabs)/mistakes.tsx` | Done |
| Learning mechanics | `lib/learning/*`, `scripts/learning.test.js` | Done |
| Timed mock exam | `app/(tabs)/exam.tsx`, `lib/quiz/examGenerator.ts`, `scripts/exam.test.js`; browser `/exam` smoke shows 20 questions | Done |
| Ads disabled during exam | `app/(tabs)/exam.tsx` has no ad imports; `scripts/monetization.test.js` verifies no ad import | Done |
| Swedish audio code | `lib/audio/speak.ts`, `components/learning/AudioButton.tsx`, `scripts/audio.test.js`; speech engine unavailable path now catches/logs errors and `npm run test:audio` covers it | Code done |
| Android audio device test | No physical Android build/device evidence; `scripts/release-preflight.js` now validates local JSON evidence if provided | Missing external evidence; local evidence schema/checks done |
| iOS audio device test | No physical iOS/TestFlight/device evidence; `scripts/release-preflight.js` now validates local JSON evidence if provided | Missing external evidence; local evidence schema/checks done |
| AdMob test units and safe placements | `lib/monetization/ads.ts`, `components/monetization/*`, `scripts/monetization.test.js`, `reports/2026-05-15-v1-ads-deferred.md` | Code done; real ads fail-closed for v1.0 |
| AdMob account/app | Real ads deferred for v1.0; required only before enabling live ads | Deferred external |
| Premium ad disable flag | `lib/monetization/premium.ts`, `PremiumBanner`, monetization test | Done |
| RevenueCat later if needed | Deferred in docs; no SDK by design | Deferred/external decision |
| Disclaimer/privacy/terms/sources | `app/disclaimer.tsx`, `app/privacy.tsx`, `app/terms.tsx`, `app/sources.tsx`, compliance test | Done |
| In-app support surface | `app/support.tsx`, `components/compliance/ComplianceLinks.tsx`, `scripts/compliance-pages.test.js` | Done |
| App Store listing | `publishing/app-store-listing.md`, publishing test | Draft done; needs account upload |
| Google Play listing | `publishing/google-play-listing.md`, publishing test | Draft done; needs account upload |
| Apple privacy labels | `publishing/privacy-labels.md`, publishing test, `privacy-review` release-preflight gate | Draft done for current MVP with disabled Google Mobile Ads SDK/test-ID posture disclosed; final store questionnaire review against generated binary is now an explicit blocked release gate |
| Google Play Data Safety | `publishing/google-play-data-safety.md`, publishing test, `privacy-review` release-preflight gate | Draft done for current MVP with Google Mobile Ads SDK test configuration and real-ads-disabled posture disclosed; final Play Console review against generated binary is now an explicit blocked release gate |
| App icon and splash assets | `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`, `app.json`, `scripts/app-assets.test.js` | Done |
| EAS/build/native config | `eas.json`, `publishing/build-and-submit-runbook.md`, `scripts/build-config.test.js`, `scripts/native-prebuild-smoke.js`, `scripts/build-preview-guard.js`, `scripts/build-production-guard.js`, `scripts/submit-production-guard.js`, isolated native prebuild smoke | Done locally; EAS cloud build still blocked by auth; preview build guard blocks preview EAS builds until EAS auth is ready; production build guard blocks production EAS builds until release preflight is ready and reruns validation inside preflight; production submit guard blocks TBD Apple identifiers, missing Google service-account file, and any production submission attempt before release preflight is fully ready with validation rerun |
| Web production export smoke | `npm run release:web-export-smoke`, `reports/2026-05-15-web-export-smoke.md`; also runs in `npm run release:preflight` | Done |
| EAS CLI availability | Build/preflight scripts use pinned `npx --yes eas-cli@18.13.0`; `npx --yes eas-cli@18.13.0 --version` works | Done |
| EAS account authentication | `reports/2026-05-15-eas-access-check.md`; `npx --yes eas-cli@18.13.0 whoami` returned `Not logged in` | Blocked external/account |
| TestFlight beta | Requires Apple account, App Store Connect app record, build upload, beta review | Blocked external |
| Google Play internal test | Requires Play Console app record, service account/upload, internal release | Blocked external |
| Public support/privacy URL copy | `publishing/public-support-and-privacy.md`, `publishing/public-site/support/index.html`, `publishing/public-site/privacy/index.html`, hosted URLs in `reports/2026-05-15-public-urls-hosted.md`, `scripts/publishing.test.js`, `scripts/check-public-urls.js`, `scripts/check-public-urls.test.js`, live URL check inside `npm run release:preflight` | Done; store-record entry still external |
| Public support URL | `https://babbloo-studio.github.io/Swedish_Civic_Test-public-site/support/`; live release-preflight URL check returned HTTP 200 | Hosted and live-checked; still must be entered in store records |
| Store screenshot manifest and web drafts | `publishing/screenshot-manifest.json`, `reports/2026-05-15-web-draft-screenshots.md`, `publishing/screenshot-shotlist.md`, `scripts/release-preflight.js` final manifest validation | Draft done; final local manifest schema and fail-closed validation done; final device screenshots still external |
| Executable release preflight | `scripts/release-preflight.js`, `scripts/release-preflight.test.js`, `scripts/check-public-urls.js`, `scripts/check-public-urls.test.js`, `reports/release-gates.json`, `npm run release:preflight` | Done; runs validation, Expo Doctor, web export, native prebuild, EAS auth, live public URL checks, concrete non-placeholder manual-evidence requirements, web-draft screenshot rejection, local device-audio JSON validation, local store-record JSON validation, local final screenshot manifest validation, local submission JSON validation, store support/privacy URL entry requirements, final privacy questionnaire review evidence requirements, concrete submission evidence requirements, and manual gate checks; currently reports BLOCKED external gates |
| Filled release evidence | `reports/release-evidence-2026-05-15.md` | Done; decision BLOCKED |
| Post-EAS-auth release runbook | `publishing/post-eas-auth-runbook.md`, `scripts/publishing.test.js` | Done |
| Submit Android app | Requires store account, internal testing, final screenshots/assets; screenshot shotlist exists in `publishing/screenshot-shotlist.md`; local submission JSON schema now validates Android production submission ID/status when provided; `scripts/submit-production-guard.js` blocks production submit until credentials are concrete and release preflight is fully ready | Not done |
| Submit iOS app | Requires store account, TestFlight, final screenshots/assets; screenshot shotlist exists in `publishing/screenshot-shotlist.md`; local submission JSON schema now validates TestFlight and iOS production submission ID/status when provided | Not done |
| Monitor crash reports/content reports/first-week fixes/reviews | Requires launched app and telemetry/support process; release evidence template exists in `reports/release-evidence-template.md` | Not done |
| Plan v1.1 | `docs/release/post-launch-v1.1-plan.md` | Done for post-launch planning; execution deferred until v1.0 launch evidence exists |

## Conclusion

The goal is not complete.

The codebase now has a validated 500-question published content milestone, token-driven UI/UX polish, interactive accessibility semantics, release metadata drafts, EAS configuration, and strong automated checks. Remaining incompletion is concentrated in physical-device verification and external account/store release steps.

## Highest-leverage next actions

1. Log in to Expo/EAS, then create an EAS preview build for Android and iOS physical-device audio tests.
2. Create App Store Connect and Google Play Console records, then enter the hosted support/privacy URLs. AdMob remains deferred unless live ads are enabled.
3. Re-review Apple privacy labels and Google Play Data safety against the generated binary, including disabled Google Mobile Ads SDK posture, then update `privacy-review` with concrete evidence.
4. Upload TestFlight and Google Play internal test builds.
5. Use `reports/release-evidence-template.md`, `publishing/post-eas-auth-runbook.md`, and `publishing/screenshot-shotlist.md` to capture public support/privacy URLs, store-record evidence, device-test evidence, and final screenshots; if store records are local, record them in `reports/store-records/store-records.json`, if device smoke is local, record it in `reports/device-smoke/*.json`, and if screenshots are local, record them in `reports/final-store-screenshots/manifest.json`, and if submission evidence is local, record it in `reports/submission/submission.json` so release preflight can validate them.
6. Submit store builds only after device/store verification and privacy review are current.
