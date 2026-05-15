# Completion audit — 2026-05-15

## Objective

Work on `/Users/billy/Desktop/projects/Swedish_Civic_Test` until the project is finished.

## Concrete success criteria derived from the roadmap

The project is finished only when all roadmap phases 0–10 are complete, verified, and no external release blockers remain.

## Evidence snapshot

- Current branch: `batch/2026-05-15-foundation`
- Latest verified app-code commit: `333d347 fix: include published questions in mock exam`
- Fresh validation command: `npm run validate`
- Fresh validation result after latest app-code commit `333d347`: pass; includes typecheck, lint, format, learning tests, exam tests, audio tests, derived-content test, content-production test, compliance test, monetization test, publishing test, build-config test, and content validation.
- Content validation result: 13 chapters, 500 questions, 500 published questions.
- Content database: `content/question-bank.csv` regenerated with 500 question rows plus header.
- Browser smoke after mock-exam fix: `/exam` renders `20 UHR-based questions` and `no ads during exam`; browser console had 0 errors and 1 known React Native web `pointerEvents` deprecation warning.

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
| AdMob test units and safe placements | `lib/monetization/ads.ts`, `components/monetization/*`, `scripts/monetization.test.js` | Code done |
| AdMob account/app | Requires external AdMob account/app record; no account evidence | Blocked external |
| Premium ad disable flag | `lib/monetization/premium.ts`, `PremiumBanner`, monetization test | Done |
| RevenueCat later if needed | Deferred in docs; no SDK by design | Deferred/external decision |
| Disclaimer/privacy/terms/sources | `app/disclaimer.tsx`, `app/privacy.tsx`, `app/terms.tsx`, `app/sources.tsx`, compliance test | Done |
| App Store listing | `publishing/app-store-listing.md`, publishing test | Draft done; needs account upload |
| Google Play listing | `publishing/google-play-listing.md`, publishing test | Draft done; needs account upload |
| Apple privacy labels | `publishing/privacy-labels.md`, publishing test | Draft done for current MVP |
| Google Play Data Safety | `publishing/google-play-data-safety.md`, publishing test | Draft done for current MVP |
| EAS build config | `eas.json`, `publishing/build-and-submit-runbook.md`, build-config test | Done |
| TestFlight beta | Requires Apple account, App Store Connect app record, build upload, beta review | Blocked external |
| Google Play internal test | Requires Play Console app record, service account/upload, internal release | Blocked external |
| Submit Android app | Requires store account, internal testing, final screenshots/assets | Not done |
| Submit iOS app | Requires store account, TestFlight, final screenshots/assets | Not done |
| Monitor crash reports/content reports/first-week fixes/reviews | Requires launched app and telemetry/support process | Not done |
| Plan v1.1 | `docs/release/post-launch-v1.1-plan.md` | Done for post-launch planning; execution deferred until v1.0 launch evidence exists |

## Conclusion

The goal is not complete.

The codebase now has a validated 500-question published content milestone, release metadata drafts, EAS configuration, and strong automated checks. Remaining incompletion is concentrated in physical-device verification and external account/store release steps.

## Highest-leverage next actions

1. Run Android and iOS physical-device audio tests from an EAS preview build.
2. Create App Store Connect, Google Play Console, and AdMob records.
3. Upload TestFlight and Google Play internal test builds.
4. Prepare final public support/privacy URLs and screenshots.
5. Submit store builds only after device/store verification and privacy review are current.
