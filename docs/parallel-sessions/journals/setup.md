# SETUP Lane Journal — Sweden Citizenship Test Prep

Append-only. Keep under 120 lines.

## Iteration 1 — 2026-05-15
Task completed: Task 1 — verified Expo TypeScript scaffold with Expo Router entry point and required dependencies already present.
Artifacts changed: `docs/parallel-sessions/journals/setup.md`; verified existing scaffold artifacts `package.json`, `app.json`, `babel.config.js`, `tsconfig.json`, `app/_layout.tsx`, `app/index.tsx`.
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK. `HOME="$PWD/.tmp-expo-home" EXPO_NO_TELEMETRY=1 CI=1 npx expo start --no-dev` smoke-started Metro and printed `Waiting on http://localhost:8081`; prescribed `--non-interactive` variant is unsupported by Expo CLI 54 and fails before this HOME override because `/home/scyiu/.expo` is unavailable.
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

## Iteration 61 — 2026-05-16
Task completed: Expo Router shell tooling guard — added special-route scaffold coverage for the root not-found fallback, Swedish web document, native deep-link intent fallback, and a package-wired router-shell test with escaped dynamic RegExp assertions.
Artifacts changed: `app/_layout.tsx`, `app/+not-found.tsx`, `app/+html.tsx`, `app/+native-intent.ts`, `lib/scaffold/routerShellManifest.ts`, `scripts/router-shell.test.js`, `package.json`, `docs/parallel-sessions/journals/setup.md`.
Verification: `NODE_OPTIONS='--v8-pool-size=1' npm run test:router-shell` → 5/5 pass; `NODE_OPTIONS='--v8-pool-size=1' npx --no-install prettier --check app/_layout.tsx app/+not-found.tsx app/+html.tsx app/+native-intent.ts lib/scaffold/routerShellManifest.ts scripts/router-shell.test.js package.json` → pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → 1/1 pass; `git diff --check -- app/_layout.tsx app/+not-found.tsx app/+html.tsx app/+native-intent.ts lib/scaffold/routerShellManifest.ts scripts/router-shell.test.js package.json docs/parallel-sessions/journals/setup.md` → pass.
Blocked? no for this focused SETUP router-shell/tooling atom. Broad TypeScript, Expo start, export, and browser proof were not started under the current B8 single-owner/resource guard.
Next suggested validator action: inspect the special Expo Router files and rerun the focused router-shell, Prettier, ownership, and diff checks.
Verification addendum: `NODE_OPTIONS='--v8-pool-size=1' timeout 180s npx --no-install tsc --noEmit --pretty false` → exit 0; Expo start smoke with `CI=1` reached `Waiting on http://localhost:8141` before cleanup.
