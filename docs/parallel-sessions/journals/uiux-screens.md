## Iteration 1 - 2026-05-18

Screen: Practice answer feedback actions - `app/(tabs)/practice.tsx`
Components consumed: shared `Button`, existing `AnswerOption`, `ExplanationPanel`, `UHRReferenceCard`, `AdBanner`.
States covered: answered/success feedback action row; primary next action and secondary retry action keep localized labels and accessible roles.
A11y: CTA labels remain `copy.nextQuestionAccessibilityLabel` and `copy.tryAgainAccessibilityLabel`; shared `Button` supplies native/web button state wiring; action targets now carry token-derived `minHeight: space[5] + space[0.5]` for the 44px target bar.
Verification: `prettier --check app/(tabs)/practice.tsx` pass; token grep on `app/(tabs)/practice.tsx` pass; `node --test tests/content-practice-route-copy-parity.test.js tests/content-practice-route-header-parity.test.js` pass 5/5; `npm run test:theme-discipline` pass 1/1; `npm run test:a11y-labels` pass 1/1; `npm run test:ui-effects` pass 50/50; `npm run typecheck -- --pretty false` pass; `npm run lint` pass; `npm run validate:content` pass; `npm run test:ownership` pass; `git diff --check -- app/(tabs)/practice.tsx` pass.
Blocked? no.
Next: Continue PANEL-OPT on routed quiz feedback actions so `/quiz/[sessionId]` gets the same shared Button hierarchy.

## Iteration 2 - 2026-05-18

Screen: Routed quiz answer feedback actions - `app/quiz/[sessionId].tsx`
Components consumed: shared `Button`, existing `AnswerOption`, `ExplanationPanel`, `UHRReferenceCard`, `ProgressBar`.
States covered: answered feedback row; retry action uses the shared secondary button and back-to-practice link uses tokenized 44px sizing.
A11y: retry keeps `copy.tryAgainAccessibilityLabel`, explicit `accessibilityRole="button"`, and `accessibilityState={{ disabled: false }}`; back link keeps role/link label.
Verification: `prettier --check app/quiz/[sessionId].tsx` pass; token grep on `app/quiz/[sessionId].tsx` pass; `node --test tests/content-quiz-route-copy-parity.test.js tests/content-quiz-route-header-parity.test.js` pass 6/6; `npm run test:a11y-labels` pass 1/1; `npm run test:theme-discipline` pass 1/1; `npm run test:ui-effects` pass 50/50; `npm run typecheck -- --pretty false` pass; `npm run lint` pass; `npm run validate:content` pass; `npm run test:ownership` pass; `git diff --check -- "app/(tabs)/practice.tsx" "app/quiz/[sessionId].tsx" docs/parallel-sessions/journals/uiux-screens.md` pass.
Blocked? no.
Next: Continue PANEL-OPT on remaining bespoke app-level action buttons, prioritizing exam results controls.

## Iteration 3 - 2026-05-18

Screen: Mock exam action controls - `app/(tabs)/exam.tsx`
Components consumed: shared `Button`, existing `Badge`, `ProgressBar`, `QuestionDisclaimer`, `ExplanationPanel`, `UHRReferenceCard`.
States covered: locked access CTA, result next-exam CTA, active exam submit CTA; disabled, saving, unlocked, and ready-to-submit states keep localized labels.
A11y: start/next/submit controls keep explicit `accessibilityLabel`, `accessibilityRole="button"`, `accessibilityState.disabled`, and web `aria-disabled`; shared `Button` supplies native/web button wiring; action targets carry token-derived `minHeight: space[5] + space[0.5]`.
Verification: `npx prettier --check 'app/(tabs)/exam.tsx'` pass; `node --test tests/content-exam-route-copy-parity.test.js tests/content-exam-route-header-parity.test.js` pass 6/6; `npm run test:theme-discipline` pass 1/1; `npm run test:a11y-labels` pass 1/1; `npm run test:ui-effects -- --test-name-pattern 'exam'` pass 50/50; `npm run typecheck -- --pretty false` pass; `npm run lint` pass; `npm run test:ownership` pass; `npm run validate:content` pass; `npm run test:exam` pass 10/10; `git diff --check -- app/(tabs)/exam.tsx` pass; token grep on `app/(tabs)/exam.tsx` produced no matches.
Blocked? no.
Next: Continue PANEL-OPT/UI-OVERHAUL on another clean `app/` screen, prioritizing settings/profile controls that still use bespoke button/link styling.

## Iteration 4 - 2026-05-18

Screen: Mock exam source citation surface - `app/(tabs)/exam.tsx`
Components consumed: shared `QuestionSourceCitation`, existing `QuestionDisclaimer`, `UHRReferenceCard`, `Badge`, `Button`, and `ProgressBar`.
States covered: active exam question source lines and submitted review source lines now render through the shared citation surface while keeping the existing idle, active, submitted, saved, saving, and disabled exam states intact.
A11y: `QuestionSourceCitation` supplies localized source-citation labels and grouped text semantics; the route keeps `getQuestionSourceCitation(item, language)` and `getQuestionSourceCitation(question, language)` for validated SV/EN copy parity.
Verification: `./node_modules/.bin/prettier --check app/(tabs)/exam.tsx` pass; token grep on `app/(tabs)/exam.tsx` pass; `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-exam-route-copy-parity.test.js tests/content-exam-route-header-parity.test.js` pass 6/6; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` pass; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:exam` pass 10/10; `NODE_OPTIONS='--v8-pool-size=1' node --test --test-name-pattern exam scripts/ui-effects.test.js` pass 7/7; `NODE_OPTIONS='--v8-pool-size=1' npm run lint` pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:content` pass 290/290; `git diff --check -- app/(tabs)/exam.tsx` pass.
Blocked? no.
Next: Continue SOURCE-CITATION/PANEL-OPT on the remaining question-screen citation surfaces, or route the existing `QuestionDisclaimer` ui-effects expectation drift to COMPONENTS/QA if MANAGER wants the broad `npm run test:ui-effects` script green.

## Iteration 5 - 2026-05-18

Screen: Chapter route quiz CTA - `app/chapter/[chapterId].tsx`
Components consumed: shared `Button`, existing `QuestionDisclaimer`, `QuestionCard`, and `UHRReferenceCard`.
States covered: missing-chapter fallback unchanged; chapter-with-quiz state now uses the shared tokenized primary CTA; no-quiz state keeps the CTA absent; question list/source review state remains unchanged.
A11y: start-quiz CTA keeps the localized `accessibilityLabel`, now has explicit `accessibilityRole="button"`, and inherits the shared Button target sizing/state wiring.
Verification: `./node_modules/.bin/prettier --check app/chapter/[chapterId].tsx` pass; token grep on `app/chapter/[chapterId].tsx` pass; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' node --test --test-name-pattern 'chapter detail route' scripts/ui-effects.test.js` pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` pass; `NODE_OPTIONS='--v8-pool-size=1' npm run lint` pass; `git diff --check -- app/chapter/[chapterId].tsx` pass.
Blocked? no.
Next: Continue PANEL-OPT/UI-OVERHAUL on another app screen with bespoke controls, prioritizing settings/profile navigation and toggles.

## Iteration 6 - 2026-05-20

Screen: Remove Ads focused profile paywall - `app/(tabs)/profile.tsx` and `components/monetization/RemoveAdsPlacementCta.tsx`
Components consumed: existing `PremiumBanner`, `Button`, `Card`, `MetricCard`, `Badge`, and `ScreenShell`.
States covered: default profile paywall stays in its existing lower position; `/profile?focus=remove-ads` promotes the same fail-closed Remove Ads paywall near the top with a localized focus cue; inline ad placement CTAs now expose a secondary link to the focused profile panel while preserving buy/restore actions.
A11y: focused paywall exposes stable `nativeID` and `testID` anchors; placement CTA link uses explicit link role and localized spoken labels; focus cue copy is validated in SV/EN content parity.
Verification: `/home/billy/Swedish_Civic_Test/node_modules/.bin/prettier --check app/(tabs)/profile.tsx components/monetization/RemoveAdsPlacementCta.tsx tests/content-profile-route-copy-parity.test.js scripts/content-production.test.js scripts/validate-content.js scripts/ui-effects.test.js scripts/monetization.test.js` pass; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` pass; `NODE_OPTIONS='--v8-pool-size=1' node --test --test-name-pattern 'profile|Remove Ads|premium|paywall' tests/content-profile-route-copy-parity.test.js scripts/ui-effects.test.js scripts/monetization.test.js` pass 16/16; `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js tests/content-profile-route-copy-parity.test.js` pass 9/9; `NODE_OPTIONS='--v8-pool-size=1' npm run test:monetization` pass 32/32; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ui-effects` pass 66/66; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` pass 7/7; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` pass 3/3; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` pass after temporary worktree `node_modules` symlink; `git diff --check` pass.
Blocked? no.
Next: Validator can review the PR for `REMOVE-ADS-PAYWALL-FOCUS-1`; the existing `REMOVE-ADS-PAYWALL-FOCUS-E2E-1` queue item is the next smallest follow-up, so no duplicate task was added.

## Iteration 7 - 2026-05-20

Screen: Practice chapter hub - `app/(tabs)/practice.tsx` and `lib/quiz/practiceFlow.ts`
Components consumed: existing `Badge`, `Button`, `ProgressBar`, `QuestionCard`, `AnswerOption`, `QuestionDisclaimer`, audio controls, source drawer, feedback panels, and monetization CTA.
States covered: first-entry practice hub with overall progress, all-question start, 10-question mixed quick round, mock exam link, and chapter cards; started rounds reuse the existing answer feedback/bookmark/audio/source/ad flow with completed progress scoped to the selected bank.
A11y: hub CTAs expose explicit labels, roles, and disabled state; chapter cards expose localized spoken summaries with answered/total and accuracy; existing practice controls keep their localized roles/states after a round starts.
Verification: `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/practice-flow.test.js tests/content-practice-route-copy-parity.test.js tests/content-practice-flow-parity.test.js tests/content-practice-scoring-parity.test.js` pass 15/15; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` pass; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` pass 3/3; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` pass 7/7; `CI=1 EXPO_NO_TELEMETRY=1 NODE_OPTIONS='--v8-pool-size=1' npm run build:web:export -- --max-workers 2` pass; `CI=1 NODE_OPTIONS='--v8-pool-size=1' npm run test:e2e -- tests/e2e/practice-chapter-hub.spec.ts --workers=1` pass 2/2; `CI=1 NODE_OPTIONS='--v8-pool-size=1' npm run test:e2e -- tests/e2e/practice-feedback.spec.ts --workers=1` pass 10/10; existing `practice-header-controls` and `practice-source-drawer-copy` specs passed during the combined rerun after hub adaptation.
Blocked? no.
Next: Validator can review `PRACTICE-CHAPTER-HUB-DRAFT-WIRING-1`; no follow-up task queued from this iteration.
