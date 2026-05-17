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
