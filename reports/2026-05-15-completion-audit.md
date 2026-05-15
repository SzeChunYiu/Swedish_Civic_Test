# Completion audit — 2026-05-15

## Objective

Work on `/Users/billy/Desktop/projects/Swedish_Civic_Test` until the project is finished.

## Concrete success criteria derived from the roadmap

The project is finished only when all roadmap phases 0–10 are complete, verified, and no external release blockers remain.

## Evidence snapshot

- Current branch: `batch/2026-05-15-foundation`
- Current HEAD at audit time: `c0f55c6 chore: add EAS build and submit config`
- Fresh validation command: `npm run validate`
- Fresh validation result: pass; includes typecheck, lint, format, learning tests, exam tests, audio tests, content-production test, compliance test, monetization test, publishing test, build-config test, and content validation.
- Content count evidence: 100 questions, 13 chapters, review status `reviewed`.
- LUNARC mirror was previously synced through `06ea516`; commits `37772c6` and `c0f55c6` still need remote sync after this audit unless synced later.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
|---|---|---|
| Choose final app name | `app.json` name: `Sweden Citizenship Test Prep`; `publishing/release-readiness.md` | Done |
| Expo/TypeScript/router/lint/format setup | `package.json`, `app.json`, `tsconfig.json`, `eslint.config.js`; `npm run validate` | Done |
| 13 UHR chapter records | `data/chapters.ts`; content validation reports 13 chapters | Done |
| Practice question schema and UHR references | `types/content.ts`, `scripts/validate-content.js` | Done |
| Sample questions | `data/questions.ts`, `data/additionalQuestions.ts`; content validation reports 100 questions | Done |
| Core screens | `app/onboarding.tsx`, `app/(tabs)/home.tsx`, `app/(tabs)/learn.tsx`, `app/chapter/[chapterId].tsx`, `app/(tabs)/practice.tsx`, `app/settings.tsx` | Done |
| Progress/storage/mistakes | `lib/storage/progressStore.ts`, `app/(tabs)/mistakes.tsx` | Done |
| Learning mechanics | `lib/learning/*`, `scripts/learning.test.js` | Done |
| Timed mock exam | `app/(tabs)/exam.tsx`, `lib/quiz/examGenerator.ts`, `scripts/exam.test.js` | Done |
| Ads disabled during exam | `app/(tabs)/exam.tsx` has no ad imports; `scripts/monetization.test.js` verifies no ad import | Done |
| Swedish audio | `lib/audio/speak.ts`, `components/learning/AudioButton.tsx`, `scripts/audio.test.js` | Code done |
| Android audio device test | No physical Android build/device evidence | Missing |
| iOS audio device test | No physical iOS/TestFlight/device evidence | Missing |
| Content spreadsheet/database | `content/question-bank.csv`, `scripts/export-question-bank.js` | Done for first 100 |
| UHR chapter/section map | `content/uhr-section-map.json` | Done |
| First 100 questions produced/reviewed/imported | `data/additionalQuestions.ts`; validation reports 100 reviewed questions | Done |
| Next 400 questions | No 500-question artifact; validation reports 100 questions | Missing |
| Review all questions | Only 100 reviewed; no 500-question review evidence | Missing |
| Mark 500 questions as published | `reviewStatus` values are `reviewed`; count is 100 | Missing |
| AdMob account/app | Requires external AdMob account; only test placeholders exist | Blocked external |
| Test ad units and safe placements | `lib/monetization/ads.ts`, `scripts/monetization.test.js` | Done |
| Premium ad disable flag | `lib/monetization/premium.ts`, `PremiumBanner`, monetization test | Done |
| RevenueCat later if needed | Deferred in docs; no SDK by design | Deferred |
| Disclaimer/privacy/terms/sources | `app/disclaimer.tsx`, `app/privacy.tsx`, `app/terms.tsx`, `app/sources.tsx`, compliance test | Done |
| App Store listing | `publishing/app-store-listing.md`, publishing test | Draft done; needs account upload |
| Google Play listing | `publishing/google-play-listing.md`, publishing test | Draft done; needs account upload |
| Apple privacy labels | `publishing/privacy-labels.md`, publishing test | Draft done for current MVP |
| Google Play Data Safety | `publishing/google-play-data-safety.md`, publishing test | Draft done for current MVP |
| EAS build config | `eas.json`, `publishing/build-and-submit-runbook.md`, build-config test | Done |
| TestFlight beta | Requires Apple account, build upload, beta review | Blocked external |
| Google Play internal test | Requires Play Console app and build upload | Blocked external |
| Submit Android app | Requires store account, 500 content decision, device/internal testing | Not done |
| Submit iOS app | Requires store account, 500 content decision, device/TestFlight testing | Not done |
| Monitor crash reports/content reports/first-week fixes/reviews | Requires launched app and telemetry/support process | Not done |
| Plan v1.1 | Ideas exist in roadmap; no post-launch v1.1 plan artifact yet | Partial |

## Conclusion

The goal is not complete.

The app has a strong MVP foundation, passing automated validation, store metadata drafts, EAS build configuration, 100 reviewed UHR-referenced questions, and release runbooks. The remaining blockers are not just test failures; they are missing deliverables or account/device-dependent release steps.

## Highest-leverage next actions

1. Produce and review the remaining 400 UHR-referenced questions, then update validation to require 500 published questions.
2. Run Android and iOS physical-device audio tests via EAS preview builds.
3. Create App Store Connect, Google Play Console, and AdMob records.
4. Upload TestFlight and Google Play internal test builds.
5. Complete final submission only after device/store verification and privacy review are current.
