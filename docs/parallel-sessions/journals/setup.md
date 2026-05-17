# SETUP Lane Journal — Sweden Citizenship Test Prep

Append-only. Keep under 120 lines.

## Iteration 1 — 2026-05-15
Task completed: Task 1 — verified Expo TypeScript scaffold with Expo Router entry point and required dependencies already present.
Artifacts changed: `docs/parallel-sessions/journals/setup.md`; verified existing scaffold artifacts `package.json`, `app.json`, `babel.config.js`, `tsconfig.json`, `app/_layout.tsx`, `app/index.tsx`.
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK. `HOME="$PWD/.tmp-expo-home" EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev` smoke-started Metro and printed `Waiting on http://localhost:8081`; prescribed `--non-interactive` variant is unsupported by Expo CLI 54 and fails before this HOME override because `/home/legacy-owner/.expo` is unavailable.
Blocked? no — Task 1 scaffold is usable; Task 3 should wait for CONTENT lane `data/questions.ts`.
Next suggested validator action: check A2 scaffold artifacts and TypeScript output.

## Iteration 2 — 2026-05-15
Task completed: Task 2 — audited architecture folder structure for SETUP-owned scaffold paths (`app/`, `components/`, `lib/`) and confirmed all target files exist.
Artifacts changed: `docs/parallel-sessions/journals/setup.md`; verified existing scaffold files under `app/`, `components/`, and `lib/`. No project source changes needed in SETUP scope.
Verification: architecture path audit showed every SETUP-owned target file from `docs/architecture.md` present. `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK. `HOME=$(mktemp -d) EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev` smoke-started Metro and printed `Waiting on http://localhost:8081`.
Blocked? yes — full A3 still needs content-owned/read-only paths: `data/chapters.ts`, `data/questions.ts`, `data/glossary.ts`, `data/mockExamConfig.ts`, `types/progress.ts`, and `types/monetization.ts`. SETUP must not write `data/` or `types/`.
Next suggested validator action: coordinate CONTENT lane to fill remaining `data/` and `types/` architecture files before accepting A3 and before SETUP Task 3 imports `data/questions.ts`.

## Iteration 3 — 2026-05-15
Task completed: Task 3 — replaced `app/(tabs)/practice.tsx` placeholder with a minimal Zustand-backed quiz screen that imports `questions`, shows the first Swedish question and answer options, marks the selected answer `Rätt`/`Fel`, and reveals `explanationSv` after selection.
Artifacts changed: `app/(tabs)/practice.tsx`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK. `HOME=$(mktemp -d) EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev` smoke-started Metro and printed `Waiting on http://localhost:8081`.
Blocked? no — code path is implemented; simulator/Expo Go visual acceptance remains for VALIDATOR.
Next suggested validator action: check A7 by opening the Practice tab in Expo Go/simulator and selecting an answer.

## Iteration 4 — 2026-05-15
Task completed: Scaffold improvement — wired the Expo Router root to the tab navigator so the app opens into the tab shell and the Practice tab is reachable from launch.
Artifacts changed: `app/_layout.tsx`, `app/index.tsx`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK. `HOME=$(mktemp -d) EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev` smoke-started Metro and printed `Waiting on http://localhost:8081`.
Blocked? no — root route now redirects to `/home` and root stack registers `(tabs)` without a duplicate stack header.
Next suggested validator action: launch the app and confirm it lands on the Home tab, then switch to Practice for A7.

## Iteration 5 — 2026-05-15
Task completed: Scaffold improvement — extracted the Practice screen Zustand session state into `lib/quiz/practiceSessionStore.ts` so quiz state lives in the quiz layer instead of inside the route component.
Artifacts changed: `app/(tabs)/practice.tsx`, `lib/quiz/practiceSessionStore.ts`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK. `HOME=$(mktemp -d) EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev` smoke-started Metro and printed `Waiting on http://localhost:8081`.
Blocked? no — Practice screen behavior is unchanged; state is now reusable for future quiz screens.
Next suggested validator action: re-check A7 by selecting an answer in the Practice tab; behavior should match Iteration 3.

## Iteration 6 — 2026-05-15
Task completed: Scaffold improvement — added a Home quick-action link to `/practice` so the quiz screen is reachable both through the tab bar and the landing Home screen.
Artifacts changed: `app/(tabs)/home.tsx`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK. `HOME=$(mktemp -d) EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev` smoke-started Metro and printed `Waiting on http://localhost:8081`.
Blocked? no — navigation path is wired; visual acceptance remains for VALIDATOR.
Next suggested validator action: launch app, tap `Start practice` from Home, then select an answer on Practice.

## Iteration 7 — 2026-05-15
Task completed: Scaffold improvement — wired `lib/storage/progressStore.ts` to MMKV-backed persistence for completed question IDs, with safe fallback when native MMKV is unavailable.
Artifacts changed: `lib/storage/progressStore.ts`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK. `HOME=$(mktemp -d) EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev` smoke-started Metro and printed `Waiting on http://localhost:8081`.
Blocked? no — progress store compiles and remains unused by current Practice UI, so A7 behavior is unaffected.
Next suggested validator action: inspect `lib/storage/progressStore.ts` for MMKV use and keep runtime check in mind if using Expo Go without a native MMKV module.

## Iteration 8 — 2026-05-15
Task completed: Scaffold improvement — connected the Practice screen to the progress store so selecting an answer marks the first question completed and displays the completed-question count.
Artifacts changed: `app/(tabs)/practice.tsx`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK. `HOME=$(mktemp -d) EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev` smoke-started Metro and printed `Waiting on http://localhost:8081`.
Blocked? no — Practice still satisfies A7 and now exercises the SETUP-owned progress store path.
Next suggested validator action: in Practice, select an answer and confirm the completed count increments while the explanation still appears.

## Iteration 9 — 2026-05-15
Task completed: Scaffold improvement — routed Practice answer correctness through `lib/quiz/answerValidation.ts` instead of duplicating `correctOptionId` comparison in the screen.
Artifacts changed: `app/(tabs)/practice.tsx`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK. `HOME=$(mktemp -d) EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev` smoke-started Metro and printed `Waiting on http://localhost:8081`.
Blocked? no — Practice behavior is unchanged; correctness logic now uses the quiz helper.
Next suggested validator action: in Practice, select the first answer and confirm it still marks `Rätt`; select another answer and confirm `Fel`.

## Iteration 10 — 2026-05-15
Task completed: Scaffold improvement — exposed the existing Practice session `resetSelection` action with a `Try again` control after an answer is selected.
Artifacts changed: `app/(tabs)/practice.tsx`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK. `HOME=$(mktemp -d) EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev` smoke-started Metro and printed `Waiting on http://localhost:8081`.
Blocked? no — A7 behavior remains intact; users can now clear selection and retry the displayed question.
Next suggested validator action: select an answer in Practice, confirm explanation appears, tap `Try again`, and confirm answer markings clear.

## Iteration 11 — 2026-05-15
Task completed: Scaffold improvement — connected Practice to `lib/quiz/scoring.ts` and shows a simple `Score: correct/total` line after an answer is selected.
Artifacts changed: `app/(tabs)/practice.tsx`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK. `HOME=$(mktemp -d) EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev` smoke-started Metro and printed `Waiting on http://localhost:8081`.
Blocked? no — Practice still displays the first question, options, answer marking, explanation, and retry control.
Next suggested validator action: select a correct answer and confirm `Score: 1/1`; retry/select an incorrect answer and confirm `Score: 0/1`.

## Iteration 12 — 2026-05-15
Task completed: Scaffold improvement — added the existing `AudioButton` to Practice so the displayed Swedish question can be played via the SETUP-owned `expo-speech` path.
Artifacts changed: `app/(tabs)/practice.tsx`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK. `HOME=$(mktemp -d) EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev` smoke-started Metro and printed `Waiting on http://localhost:8081`.
Blocked? no — Practice still displays the question and options; audio runtime should be checked on a device/simulator.
Next suggested validator action: open Practice, tap `Listen`, and confirm Swedish TTS plays; then select an answer to re-check A7 behavior.

## Iteration 13 — 2026-05-17
Task completed: Scaffold improvement — replaced the dynamic quiz session placeholder with a routed question screen that selects a stable question for the session id, records the answer, and shows score, explanation, and UHR reference feedback.
Artifacts changed: `app/quiz/[sessionId].tsx`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run typecheck` exit 0; `npx eslint 'app/quiz/[sessionId].tsx'` exit 0; `npm run test:practice` exit 0; `git diff --check -- app/quiz/'[sessionId]'.tsx docs/parallel-sessions/journals/setup.md` exit 0; `EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev --offline --port 8099 --max-workers 1` smoke-started Metro and printed `Waiting on http://localhost:8099`, then was stopped.
Blocked? no — `/quiz/[sessionId]` is now a usable Expo Router scaffold route.
Next suggested validator action: open `/quiz/daily` or `/quiz/<question-id>`, select an answer, and confirm the explanation/source feedback appears.

## Iteration 14 — 2026-05-17
Task completed: Tooling/product atom — replaced the hardcoded v1 ad fail-closed gate with env-driven ad rendering, default dev/test AdMob units, real-unit env slots, and a decoupled remove-ads entitlement.
Artifacts changed: `lib/monetization/ads.ts`, `lib/monetization/premium.ts`, `scripts/monetization.test.js`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run test:monetization` exit 0; `npm run typecheck` exit 0; `npm run lint` exit 0; `npx prettier --check lib/monetization/ads.ts lib/monetization/premium.ts scripts/monetization.test.js` exit 0; `git diff --check -- lib/monetization/ads.ts lib/monetization/premium.ts scripts/monetization.test.js docs/parallel-sessions/journals/setup.md` exit 0; `grep -q "REAL_ADS_ENABLED" lib/monetization/ads.ts` exit 0; `grep -q "REAL_ADS_ENABLED_FOR_V1 = false" lib/monetization/ads.ts` exit 1 as expected; `HOME=$(mktemp -d) EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev --offline --port 8099 --max-workers 1` smoke-started Metro and printed `Waiting on http://localhost:8099`, then was stopped.
Blocked? no — ADS-1/ADS-2 backend gating now has a passing focused verifier, but paywall UI, purchases, consent, and publishing docs remain separate queued atoms.
Next suggested validator action: inspect `lib/monetization/ads.ts` and run `npm run test:monetization`; then assign IAP-1/IAP-2 or CONSENT-1.

## Iteration 15 — 2026-05-17
Task completed: Tooling/product atom — added the Remove Ads non-consumable IAP wrapper with secure persisted `adsDisabled`, native `react-native-iap` purchase/restore hooks, and a mock provider for web/dev/tests.
Artifacts changed: `lib/monetization/purchases.ts`, `app.json`, `package.json`, `package-lock.json`, `scripts/monetization.test.js`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run test:monetization` exit 0; `npx prettier --check lib/monetization/purchases.ts scripts/monetization.test.js package.json app.json` exit 0; `npm run typecheck` exit 0; `npm run lint` exit 0; `test -f lib/monetization/purchases.ts` exit 0; `grep -qiE "restore" lib/monetization/purchases.ts` exit 0; `grep -rqi "remove.?ads" app components lib` exit 0; `npm ls react-native-iap expo-secure-store react-native-nitro-modules` exit 0; `git diff --check -- lib/monetization/purchases.ts scripts/monetization.test.js package.json package-lock.json app.json docs/parallel-sessions/journals/setup.md` exit 0; `HOME=$(mktemp -d) EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev --offline --port 8099 --max-workers 1` smoke-started Metro and printed `Waiting on http://localhost:8099`, then was stopped; `CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform web --output-dir dist-web --max-workers 2` exit 0.
Blocked? no — IAP-1 library/tooling path is implemented and verified; paywall UI and consent/compliance remain separate queued atoms.
Next suggested validator action: inspect `lib/monetization/purchases.ts`, rerun `npm run test:monetization`, then assign IAP-2 or CONSENT-1.

## Iteration 16 — 2026-05-17
Task completed: Tooling/product atom — suppressed the global launch popup ad on `/exam` routes while keeping the launch placement available elsewhere.
Artifacts changed: `app/_layout.tsx`, `scripts/monetization.test.js`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run test:monetization` exit 0; `npm run typecheck` exit 0; `npm run lint` exit 0; `npx prettier --check app/_layout.tsx scripts/monetization.test.js` exit 0; `git diff --check -- app/_layout.tsx scripts/monetization.test.js docs/parallel-sessions/journals/setup.md` exit 0; `CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform web --output-dir dist-web --max-workers 2` exit 0; inline Playwright with `/usr/bin/google-chrome` at `/exam` found `Mock exam` visible and `Launch sponsor`/`Google AdMob`/close-ad controls absent, then `/home` still showed the launch sponsor placement; console errors 0.
Blocked? no — route-level static coverage now targets the global app-open ad mount point that the exam-screen import check missed.
Next suggested validator action: rerun `npm run test:monetization` and exported `/exam` smoke to confirm no launch sponsor overlay appears on the mock exam.

## Iteration 17 — 2026-05-17
Task completed: Tooling/product atom — removed the artificial Remove Ads verifier token from the IAP wrapper and verifier while preserving buy, restore, and persisted `adsDisabled` coverage; restored the missing exam-route launch-ad guard required by the current monetization verifier.
Artifacts changed: `lib/monetization/purchases.ts`, `scripts/monetization.test.js`, `app/_layout.tsx`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run test:monetization` exit 0; `npm run typecheck` exit 0; `npm run lint` exit 0; `npx prettier --check app/_layout.tsx lib/monetization/purchases.ts scripts/monetization.test.js` exit 0; `git diff --check -- app/_layout.tsx lib/monetization/purchases.ts scripts/monetization.test.js docs/parallel-sessions/journals/setup.md` exit 0; `rg -n "REMOVE_ADS_VERIFIER_TOKEN|remove\\.\\?ads" lib/monetization/purchases.ts scripts/monetization.test.js` found no matches.
Blocked? no — IAP-1 no longer depends on the artificial token; the focused monetization verifier now covers the real purchase/restore path and the exam-route ad suppression.
Next suggested validator action: rerun `npm run test:monetization`, inspect `lib/monetization/purchases.ts`, and decide whether IAP-1 can move from blocked to accepted before assigning IAP-2 paywall UI.

## Iteration 18 — 2026-05-17
Task completed: Tooling/product atom — added chapter-to-quiz session helpers in the quiz flow layer so future chapter quiz-entry UI can resolve a stable first question without duplicating route logic.
Artifacts changed: `lib/quiz/practiceFlow.ts`, `scripts/practice-flow.test.js`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run test:practice` exit 0; `npm run typecheck` exit 0; `npm run lint` exit 0; `npx prettier --check lib/quiz/practiceFlow.ts scripts/practice-flow.test.js` exit 0; `git diff --check -- lib/quiz/practiceFlow.ts scripts/practice-flow.test.js docs/parallel-sessions/journals/setup.md` exit 0; `npm run test:ownership` exit 0. Direct `npx eslint lib/quiz/practiceFlow.ts scripts/practice-flow.test.js` is not project-equivalent and fails on the pre-existing script `__dirname` Node-global config gap.
Blocked? no — non-UI plumbing is verified; wiring the visible chapter start control remains a separate `app/` screen atom under the current UI/UX lease.
Next suggested validator action: inspect the new `getChapterQuizSessionId` coverage, then schedule the chapter screen link when the `app/` lease is available.

## Iteration 19 — 2026-05-17
Task completed: Tooling/product atom — added monetization consent decision helpers for ATT and Google UMP prompts before real ad serving.
Artifacts changed: `lib/monetization/consent.ts`, `scripts/monetization.test.js`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run test:monetization` exit 0; `npm run typecheck` exit 0; `npm run lint` exit 0; `npx prettier --check lib/monetization/consent.ts scripts/monetization.test.js` exit 0; `git diff --check -- lib/monetization/consent.ts scripts/monetization.test.js docs/parallel-sessions/journals/setup.md` exit 0; `rg -n "tracking-transparency|ATT|UMP|consent" lib app` found consent coverage in `lib/monetization/consent.ts`.
Blocked? no — this is a verified consent-plumbing atom; native prompt wiring remains a separate app integration task.
Next suggested validator action: inspect `getAdConsentDecision` and rerun `npm run test:monetization` before assigning the native consent prompt integration.

## Iteration 20 — 2026-05-17
Task completed: Tooling/product atom — made the ad gate require an explicit consent decision before serving real AdMob units, while preserving test-unit rendering for dev/web previews.
Artifacts changed: `lib/monetization/ads.ts`, `scripts/monetization.test.js`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run test:monetization` exit 0; `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run test:ownership` exit 0; `npx prettier --check lib/monetization/ads.ts scripts/monetization.test.js` exit 0; `git diff --check -- lib/monetization/ads.ts scripts/monetization.test.js docs/parallel-sessions/journals/setup.md` exit 0.
Blocked? no — this is non-UI SETUP plumbing inside `lib/monetization`; app/component consent prompt wiring and public `app-ads.txt` compliance remain separate atoms.
Next suggested validator action: inspect the real-ad consent guard in `shouldShowAd`, then schedule the UI/app integration once the active UI/UX lease permits `app/` and `components/` writes.

## Iteration 21 — 2026-05-17
Task completed: Tooling/product atom — tightened the release monetization policy and preflight evidence gates for ad-supported v1.0 store records and privacy review.
Artifacts changed: `lib/monetization/releasePolicy.ts`, `scripts/monetization.test.js`, `scripts/release-preflight.js`, `scripts/release-preflight.test.js`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run test:monetization` exit 0; `node --test scripts/release-preflight.test.js --test-name-pattern "store record|privacy review"` exit 0 with 44/44 passing; `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run test:ownership` exit 0; `npx prettier --check lib/monetization/releasePolicy.ts scripts/monetization.test.js scripts/release-preflight.js scripts/release-preflight.test.js` exit 0; `git diff --check -- lib/monetization/releasePolicy.ts scripts/monetization.test.js scripts/release-preflight.js scripts/release-preflight.test.js docs/parallel-sessions/journals/setup.md` exit 0.
Blocked? no — the release gate now rejects disabled-ad AdMob/privacy evidence and requires the product policy to record AdMob app, app-ads.txt, binary privacy review, Remove Ads IAP, and consent requirements.
Next suggested validator action: inspect the preflight `store-records` and `privacy-review` schema updates, then rerun `npm run test:monetization` and the release-preflight store/privacy subset.

## Iteration 22 — 2026-05-17
Task completed: Tooling/product atom — fixed the routed quiz retry control so the a11y verifier accepts its explicit interactive state.
Artifacts changed: `app/quiz/[sessionId].tsx`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run test:a11y-labels` exit 0; `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run test:ownership` exit 0; `npx prettier --check app/quiz/[sessionId].tsx` exit 0; `git diff --check -- app/quiz/[sessionId].tsx docs/parallel-sessions/journals/setup.md` exit 0.
Blocked? no — the routed quiz screen no longer triggers the missing `accessibilityState` failure on the `Try again` control.
Next suggested validator action: rerun `npm run test:a11y-labels` and, if release preflight is next, check whether local validation now advances past the quiz a11y gate.

## Iteration 23 — 2026-05-17
Task completed: Tooling/product atom — wired chapter detail screens to the routed quiz session helper with a visible `Start quiz` link for chapters that have questions.
Artifacts changed: `app/chapter/[chapterId].tsx`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run test:practice` exit 0; `npm run test:a11y-labels` exit 0; `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run test:ownership` exit 0; `npx prettier --check app/chapter/[chapterId].tsx` exit 0; `CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform web --output-dir dist-web --max-workers 2` exit 0; system-Chrome Playwright smoke on exported web passed `/learn` → `/chapter/ch01` → `Start quiz for Landet Sverige` → `/quiz/q001` with zero console errors; `git diff --check -- app/chapter/[chapterId].tsx app/quiz/[sessionId].tsx docs/parallel-sessions/journals/setup.md` exit 0. Official `CI=1 timeout 120s npm run test:e2e -- tests/e2e/learn-chapter-navigation.spec.ts --workers=1` still fails before app interaction because the configured cached Playwright browser is missing.
Blocked? no — the chapter start route is implemented and locally smoke-verified; acceptance-grade official e2e remains blocked by the existing browser-cache infrastructure issue.
Next suggested validator action: inspect `app/chapter/[chapterId].tsx`, rerun the focused checks above, then rerun the official learn-navigation e2e after restoring the configured Playwright browser cache.

## Iteration 24 — 2026-05-17
Task completed: Tooling/product atom — added a pure Google Mobile Ads SDK initialization decision helper that blocks SDK init when ads are disabled, Remove Ads is active, ATT/UMP prompts are pending, or real-ad consent is missing.
Artifacts changed: `lib/monetization/consent.ts`, `scripts/monetization.test.js`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run test:monetization` exit 0 with 12/12 passing; `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run test:ownership` exit 0; `npx prettier --check lib/monetization/consent.ts scripts/monetization.test.js` exit 0; `git diff --check -- lib/monetization/consent.ts scripts/monetization.test.js` exit 0.
Blocked? no — app/native prompt wiring and public compliance files remain separate atoms outside this non-UI SETUP plumbing pass.
Next suggested validator action: inspect `getAdSdkInitializationDecision` and the monetization test coverage, then schedule the app integration when the UI/UX lease permits `app/`/`components/` writes.

## Iteration 25 — 2026-05-17
Task completed: Tooling/product atom — replaced the stale premium/deferred-ad banner with a Remove Ads paywall surface wired to the existing buy/restore helpers and surfaced it next to the Home ad placement.
Artifacts changed: `components/monetization/PremiumBanner.tsx`, `app/(tabs)/home.tsx`, `scripts/monetization.test.js`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run test:monetization` exit 0 with 13/13 passing; `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run test:a11y-labels` exit 0; `npm run test:ownership` exit 0; `npx prettier --check components/monetization/PremiumBanner.tsx app/'(tabs)'/home.tsx scripts/monetization.test.js` exit 0; `CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform web --output-dir dist-web --max-workers 2` exit 0; targeted `git diff --check` exit 0.
Blocked? no — native store product creation and device purchase QA remain external release gates; app-ads.txt/privacy copy are separate release/compliance atoms.
Next suggested validator action: inspect the Home Remove Ads surface and rerun `npm run test:monetization`, then schedule native consent prompt wiring or compliance assets.

## Iteration 26 — 2026-05-17
Task completed: Tooling/product atom — added native Mobile Ads consent initialization wiring so ATT and Google UMP consent are collected before SDK init, with native banner/app-open ads gated by the resulting consent decision.
Artifacts changed: `lib/monetization/mobileAdsConsent.ts`, `lib/monetization/useMobileAdsConsent.ts`, `components/monetization/AdBanner.native.tsx`, `components/monetization/LaunchPopupAd.native.tsx`, `app.json`, `package.json`, `package-lock.json`, `scripts/monetization.test.js`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run test:monetization` exit 0 with 14/14 passing; `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run test:ownership` exit 0; `npm ls expo-tracking-transparency react-native-google-mobile-ads` exit 0; targeted `npx prettier --check ...` exit 0; targeted `git diff --check` exit 0; `CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform web --output-dir dist-web --max-workers 2` exit 0.
Blocked? no — native device QA still needs a real EAS preview build and real consent/store configuration.
Next suggested validator action: inspect the consent runtime and native ad components, rerun `npm run test:monetization`, then schedule device QA or public compliance assets.

## Iteration 27 — 2026-05-17
Task completed: Product/tooling atom — centralized quiz answer-option feedback so wrong answers also reveal the correct option in Practice and routed quiz sessions, with focused unit and e2e coverage.
Artifacts changed: `lib/quiz/answerValidation.ts`, `app/(tabs)/practice.tsx`, `app/quiz/[sessionId].tsx`, `scripts/answer-validation.test.js`, `tests/e2e/practice-feedback.spec.ts`, `docs/parallel-sessions/journals/setup.md`.
Commit: `bd4c407` (`setup: reveal correct answer feedback`).
Verification: `npm run test:answer-validation` exit 0 with 2/2 passing; `npm run test:practice` exit 0 with 3/3 passing; `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run test:ownership` exit 0; targeted Prettier and `git diff --check` exit 0; `CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform web --output-dir dist-web --max-workers 2` exit 0; system-Chrome exported-web smoke on `/practice` dismissed the launch sponsor, selected the wrong answer `I södra Europa`, and verified `I södra Europa — Fel`, `I Norden i norra Europa — Rätt svar`, `Score: 0/1`, the explanation, and zero console errors. Official `CI=1 timeout 120s npm run test:e2e -- tests/e2e/practice-feedback.spec.ts --workers=1` still fails before app interaction because the configured cached Playwright Chromium executable is missing.
Blocked? no — the product feedback defect is fixed and smoke-verified; official e2e remains blocked by the existing browser-cache infrastructure issue.
Next suggested validator action: inspect the `getAnswerOptionFeedback` helper and rerun the focused unit checks plus the exported-web `/practice` wrong-answer smoke; rerun official Playwright after restoring the configured browser cache.

## Iteration 61 — 2026-05-16
Task completed: Expo Router shell tooling guard — added special-route scaffold coverage for the root not-found fallback, Swedish web document, native deep-link intent fallback, and a package-wired router-shell test with escaped dynamic RegExp assertions.
Artifacts changed: `app/_layout.tsx`, `app/+not-found.tsx`, `app/+html.tsx`, `app/+native-intent.ts`, `lib/scaffold/routerShellManifest.ts`, `scripts/router-shell.test.js`, `package.json`, `docs/parallel-sessions/journals/setup.md`.
Verification: `NODE_OPTIONS='--v8-pool-size=1' npm run test:router-shell` → 5/5 pass; `NODE_OPTIONS='--v8-pool-size=1' npx --no-install prettier --check app/_layout.tsx app/+not-found.tsx app/+html.tsx app/+native-intent.ts lib/scaffold/routerShellManifest.ts scripts/router-shell.test.js package.json` → pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → 1/1 pass; `git diff --check -- app/_layout.tsx app/+not-found.tsx app/+html.tsx app/+native-intent.ts lib/scaffold/routerShellManifest.ts scripts/router-shell.test.js package.json docs/parallel-sessions/journals/setup.md` → pass.
Blocked? no for this focused SETUP router-shell/tooling atom. Broad TypeScript, Expo start, export, and browser proof were not started under the current B8 single-owner/resource guard.
Next suggested validator action: inspect the special Expo Router files and rerun the focused router-shell, Prettier, ownership, and diff checks.
Verification addendum: `NODE_OPTIONS='--v8-pool-size=1' timeout 180s npx --no-install tsc --noEmit --pretty false` → exit 0; Expo start smoke with `CI=1` reached `Waiting on http://localhost:8141` before cleanup.

## Iteration 138 - 2026-05-17
Task completed: Product/tooling atom - localized the Sources route shell for Swedish mode while preserving English support, UHR link metadata, and shared legal header parity.
Artifacts changed: `app/sources.tsx`, `scripts/validate-content.js`, `scripts/compliance-pages.test.js`, `scripts/ui-effects.test.js`, `tests/content-legal-route-header-parity.test.js`.
Commit: `4a39dbb` (`setup: localize sources shell`).
Verification: `node --test tests/content-legal-route-header-parity.test.js` exit 0 with 2/2 passing; `node --test scripts/ui-effects.test.js --test-name-pattern "compliance scaffold"` exit 0 with 48/48 passing; `npm run test:compliance` exit 0; `npm run validate:content` exit 0 with `legalRouteHeadersValidated:23`, `legalRouteHeaderParityValidated:true`, and `uhrSourceMaterialLinkParityValidated:true`; `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run test:ownership` exit 0; `npm run test:architecture` exit 0 with 9/9 passing; `npm run test:theme-discipline` exit 0; targeted Prettier and `git diff --check` exit 0; `CI=1 EXPO_NO_TELEMETRY=1 npm run build:web:export -- --max-workers 2` exit 0; `node scripts/prepare-web-export.js --check dist-web` exit 0; system-Chrome exported-web `/sources` smoke saw Swedish `Källor`, `Primärt studiematerial`, the localized UHR link accessible name, no stale English Sources title, and browser errors 0.
Blocked? no - the committed SETUP atom is verified; unrelated coordination and screenshot dirty state remains outside this commit.
Next suggested validator action: inspect `app/sources.tsx`, rerun the legal-route header parity and compliance scaffold checks, and repeat the exported-web `/sources` Swedish smoke if runtime evidence is needed.

## Iteration 139 - 2026-05-17
Task completed: Product/tooling atom - localized the Support route shell for Swedish mode while preserving English copy, public support link metadata, and shared legal header parity.
Artifacts changed: `app/support.tsx`, `scripts/validate-content.js`, `scripts/compliance-pages.test.js`, `scripts/ui-effects.test.js`, `tests/content-legal-route-header-parity.test.js`, `docs/parallel-sessions/journals/setup.md`.
Verification: `node --test tests/content-legal-route-header-parity.test.js` exit 0 with 2/2 passing; `npm run test:compliance` exit 0 with 1/1 passing; `node --test scripts/ui-effects.test.js --test-name-pattern "compliance scaffold"` exit 0 with 48/48 passing; `npm run validate:content` exit 0 with `legalRouteHeadersValidated:23`, `legalRouteHeaderParityValidated:true`, and `themeTokenSchemaValidated:true`; `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run test:ownership` exit 0; targeted Prettier and targeted `git diff --check` exit 0; `CI=1 EXPO_NO_TELEMETRY=1 npm run build:web:export -- --max-workers 2` exit 0; system-Chrome exported-web `/support` smoke saw Swedish `Support och återkoppling`, `Vad du kan rapportera`, `Inga personuppgifter`, `Offentlig supportsida`, localized public support link label, no stale English page heading, and browser errors 0.
Blocked? no - the committed-scope SETUP atom is verified; unrelated dirty coordination, content, screenshot, and backup-file state remains outside this handoff.
Next suggested validator action: inspect `app/support.tsx`, rerun the legal-route header parity and compliance scaffold checks, and repeat the exported-web `/support` Swedish smoke if runtime evidence is needed.

## Iteration 140 - 2026-05-17
Task completed: Product/tooling atom - cleaned source-authority phrasing from displayed and spoken question prompts while keeping the separate source citation and disclaimer visible.
Artifacts changed: `lib/quiz/questionText.ts`, `components/quiz/QuestionCard.tsx`, `app/(tabs)/exam.tsx`, `lib/audio/speak.ts`, `scripts/validate-content.js`, `scripts/audio.test.js`, `scripts/ui-effects.test.js`, `tests/content-question-card-accessibility-parity.test.js`, `tests/content-question-speech-text-parity.test.js`, `docs/parallel-sessions/journals/setup.md`.
Verification: `npm run validate:content` exit 0 with `questionCardAccessibilityParityValidated:true` and `questionSpeechTextParityValidated:true`; `node --test tests/content-question-card-accessibility-parity.test.js tests/content-question-speech-text-parity.test.js` exit 0 with 3/3 passing; `npm run test:audio` exit 0 with 4/4 passing; `npm run test:ui-effects` exit 0 with 48/48 passing; `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run test:ownership` exit 0; `node scripts/export-question-bank.js --check` exit 0; targeted Prettier and `git diff --check` exit 0; `CI=1 EXPO_NO_TELEMETRY=1 npm run build:web:export -- --max-workers 2` exit 0; system-Chrome exported-web `/quiz/q076` smoke saw clean SV/EN prompts, no `Enligt UHR-materialet`/`According to the UHR material`, separate `Källa/Source: Sverige i fokus`, disclaimer text, and browser errors 0.
Blocked? no - this SETUP atom advances SOURCE-CITATION in runtime display/TTS without touching content-owned `data/` stems; remaining raw authored stem cleanup stays with CONTENT/DATA-INTEGRITY.
Next suggested validator action: inspect the display helper and rerun the focused prompt-citation checks plus `/quiz/q076` exported-web smoke.

## Iteration 141 - 2026-05-17
Task completed: Product/tooling atom - added a mock-exam guard for SHUFFLE-FIX so generated exams preserve scoring and review text after seeded per-session answer-option shuffling remaps the correct display id.
Artifacts changed: `scripts/exam.test.js`, `docs/parallel-sessions/journals/setup.md`.
Verification: `NODE_OPTIONS='--v8-pool-size=1' npm run test:exam` exit 0 with 8/8 passing; `NODE_OPTIONS='--v8-pool-size=1' npm run test:answer-shuffle` exit 0 with 3/3 passing; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck` exit 0; `NODE_OPTIONS='--v8-pool-size=1' npm run lint` exit 0; `NODE_OPTIONS='--v8-pool-size=1' npx --no-install prettier --check scripts/exam.test.js` exit 0; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` exit 0; `git diff --check -- scripts/exam.test.js` exit 0.
Blocked? no - this SETUP tooling atom advances the open SHUFFLE-FIX P0 by covering the mock-exam session pipeline beyond the direct shuffle helper.
Next suggested validator action: inspect the new `generateExam preserves scoring and review after session answer shuffle` test and rerun `npm run test:exam` plus `npm run test:answer-shuffle`; if treating SHUFFLE-FIX as done, verify the executable P0 check and update `codex-tasks/P0.md` under operator/validator ownership.
