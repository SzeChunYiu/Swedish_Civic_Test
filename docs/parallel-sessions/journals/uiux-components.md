## Iteration 56 — 2026-05-16

Component: LegalPage onboarding back spoken-label parity atom — `components/compliance/LegalPage.tsx`
Variants/states implemented: preserved default Profile-origin back link; added optional `backHref`, `backLabel`, and `backAccessibilityLabel` props; default spoken label now derives from the visible back label so onboarding-origin callers can say Onboarding instead of Profile without changing the component visual.
Tokens used: no new visual tokens; existing `colors.surface`, `colors.accent`, `colors.text`, `colors.surfaceWarm`, `colors.textMuted`, `radius.card`, `space[1]`, `space[1.75]`, `space[2]`, `space[2.25]`, `space[3]`, `typography.navButton`, `typography.subHeading`, `typography.bodyBold`, `typography.sectionTitle`, and `typography.bodyTight` remain in use.
A11y props: `Link` keeps `accessibilityRole="link"`; `accessibilityLabel` uses caller override or `getBackAccessibilityLabel(backLabel)`; default `← Back to Profile` now speaks `Back to Profile`, while `← Back to Onboarding` speaks `Back to Onboarding`.
Verification: `/projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test/node_modules/.bin/prettier --check components/compliance/LegalPage.tsx docs/parallel-sessions/journals/uiux-components.md` → pass; source grep verified `backAccessibilityLabel`, `getBackAccessibilityLabel(backLabel)`, and no fixed `accessibilityLabel="Back to profile"`; token discipline grep on `components/compliance/LegalPage.tsx` → `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run test:compliance` → pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` → pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` → pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' tsc --noEmit --pretty false` → `TS-OK`; `git diff --check -- components/compliance/LegalPage.tsx docs/parallel-sessions/journals/uiux-components.md` → `DIFF-CHECK-OK`.
Blocked? no — implementation stays within COMPONENTS writable scope plus append-only component journal and does not edit `app/**`.
Next: Manager can review this scoped LegalPage spoken-label parity atom; SCREENS can add caller/test coverage if needed after component acceptance.

## Iteration 1 — 2026-05-16

Component: Surface core atom — `components/Surface.tsx`
Variants/states implemented: canvas/surface/warm tones, optional border, none/card/elevated elevation, caller style and View prop passthrough, children wrapper.
Tokens used: `colors.canvas`, `colors.surface`, `colors.surfaceWarm`, `colors.border`, `radius.card`, `space[1]`, `space[2]`, `space.hairline`, `shadows.card`, `shadows.deep`.
A11y props: default `accessibilityRole="summary"`, optional `accessibilityLabel`, inherited View accessibility props pass through for caller overrides.
Verification: `./node_modules/.bin/prettier --check components/Surface.tsx docs/parallel-sessions/journals/uiux-components.md` → pass; token discipline grep on `components/Surface.tsx` → `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false && echo TS-OK` → `TS-OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` → pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` → pass 1/1; `git diff --check -- components/Surface.tsx docs/parallel-sessions/journals/uiux-components.md` → pass (no output).
Blocked? no — scoped to COMPONENTS writable files only.
Next: Manager can review Surface and then queue Text if accepted.

## Iteration 2 — 2026-05-18

Component: Text typography atom — `components/Text.tsx`
Variants/states implemented: `h1`, `h2`, `body`, `caption`, and `label` variants; primary, secondary, disclaimer, accent, success, and warning tones; left, center, and right alignment; caller style and native Text prop passthrough.
Tokens used: `colors.text`, `colors.textSecondary`, `colors.textDisclaimer`, `colors.accent`, `colors.success`, `colors.warning`, `typography.displaySecondary`, `typography.sectionHeading`, `typography.body`, `typography.captionLight`, and `typography.navButton`.
A11y props: default `accessibilityRole="header"` for `h1`/`h2`, default `accessibilityRole="text"` for other variants, optional caller override, and optional `accessibilityLabel` passthrough for clearer spoken text.
Verification: `./node_modules/.bin/prettier --check components/Text.tsx` → pass; token discipline grep on `components/Text.tsx` → `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` → pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` → pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` → pass 1/1.
Blocked? no — scoped to COMPONENTS writable files only.
Next: Manager can review Text and then queue Button if accepted.

## Iteration 3 - 2026-05-18

Component: Button action atom - `components/Button.tsx`
Variants/states implemented: `primary`, `secondary`, and `ghost` variants; `sm`, `md`, and `lg` sizes; loading state with spinner and busy accessibility state; disabled state with neutral token styling; pressed state using motion/token styling.
Tokens used: `colors.accent`, `colors.accentActive`, `colors.surface`, `colors.surfaceWarm`, `colors.surfaceMuted`, `colors.border`, `colors.focus`, `colors.focusSoft`, `colors.text`, `colors.textPlaceholder`, `motion.pressedScale`, `radius.card`, `space[0.75]`, `space[1]`, `space[1.5]`, `space[2]`, `space[3]`, `space[6]`, `space[7]`, `space[8]`, `space.hairline`, and `typography.navButton`.
A11y props: default `accessibilityRole="button"`; derives `accessibilityLabel` from string/number children or `loadingLabel`; merges caller `accessibilityState` with `disabled` and `busy`; default token-sized `hitSlop`; loading spinner hidden from the accessibility tree.
Verification: `./node_modules/.bin/prettier --check components/Button.tsx` -> pass; token discipline grep on `components/Button.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `git diff --check -- components/Button.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass.
Blocked? no - scoped to COMPONENTS writable files only.
Next: Manager can review Button and then queue OptionCard if accepted.

## Iteration 4 - 2026-05-18

Component: OptionCard quiz answer atom - `components/OptionCard.tsx`
Variants/states implemented: `idle`, `selected`, `correct`, and `incorrect` states; pressable card layout with radio marker, optional secondary description, optional result label, disabled state, and pressed transform.
Tokens used: `colors.surface`, `colors.border`, `colors.badgeBlueBg`, `colors.badgeBlueText`, `colors.correctBg`, `colors.success`, `colors.incorrectBg`, `colors.warning`, `colors.text`, `colors.warmDark`, `colors.textSecondary`, `motion.pressedScale`, `radius.card`, `radius.circle`, `space[0.5]`, `space[1]`, `space[1.5]`, `space[2]`, `space[3]`, `space[8]`, `space.hairline`, `typography.bodySemibold`, `typography.captionLight`, and `typography.badge`.
A11y props: default `accessibilityRole="radio"`; derives `accessibilityLabel` from label, description, result label, and state label; merges caller `accessibilityState` with `checked` and `disabled`; default token-sized `hitSlop`.
Verification: `/home/billy/Swedish_Civic_Test/node_modules/.bin/prettier --check components/OptionCard.tsx` -> pass; token discipline grep on `components/OptionCard.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1.
Blocked? no - scoped to COMPONENTS writable files only.
Next: Manager can review OptionCard and then queue PillBadge if accepted.

## Iteration 5 - 2026-05-18

Component: PillBadge reward/status atom - `components/PillBadge.tsx`
Variants/states implemented: `neutral`, `accent`, `success`, and `warning` variants; pill-shaped non-interactive badge for XP, streak, status, and alert counters; caller style and label style passthrough.
Tokens used: `colors.surfaceWarm`, `colors.border`, `colors.badgeBlueBg`, `colors.badgeBlueText`, `colors.correctBg`, `colors.success`, `colors.incorrectBg`, `colors.warning`, `colors.textSecondary`, `radius.pill`, `space[0.5]`, `space[1.5]`, `space[4]`, `space.hairline`, and `typography.badge`.
A11y props: default `accessible=true`; default `accessibilityRole="text"`; derives `accessibilityLabel` from string/number children; caller can override all inherited View accessibility props.
Verification: `/home/billy/Swedish_Civic_Test/node_modules/.bin/prettier --check components/PillBadge.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass; token discipline grep on `components/PillBadge.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `git diff --check -- components/PillBadge.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass.
Blocked? no - scoped to COMPONENTS writable files only.
Next: Manager can review PillBadge and then queue ProgressBar if accepted.

## Iteration 6 - 2026-05-18

Component: ProgressBar progress atom - `components/ProgressBar.tsx`
Variants/states implemented: rounded warm track with accent fill; clamped 0-100 percent progress; animated and static modes; caller track and fill style passthrough.
Tokens used: `colors.surfaceWarm`, `colors.accent`, `motion.duration.slow`, `radius.pill`, and `space[1]`.
A11y props: default `accessibilityRole="progressbar"`; derives `accessibilityLabel` from clamped percentage; exposes `accessibilityValue` with min, max, now, and text; caller can override inherited View accessibility props.
Verification: `./node_modules/.bin/prettier --check components/ProgressBar.tsx` -> pass; token discipline grep on `components/ProgressBar.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `git diff --check -- components/ProgressBar.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass.
Blocked? no - scoped to COMPONENTS writable files only.
Next: Manager can review ProgressBar and then queue ChapterRow if accepted.

## Iteration 7 - 2026-05-18

Component: ChapterRow list atom - `components/ChapterRow.tsx`
Variants/states implemented: pressable chapter list row with title, secondary text, chevron affordance, disabled state, pressed state, caller style passthrough, and optional hidden chevron.
Tokens used: `colors.surface`, `colors.surfaceWarm`, `colors.border`, `colors.focus`, `colors.text`, `colors.textSecondary`, `colors.textPlaceholder`, `motion.pressedScale`, `radius.card`, `space[0.5]`, `space[1]`, `space[1.5]`, `space[2]`, `space[8]`, `space.hairline`, `typography.bodySemibold`, `typography.captionLight`, and `typography.sectionTitle`.
A11y props: default `accessibilityRole="button"`; derives `accessibilityLabel` from title and secondary text; merges caller `accessibilityState` with `disabled`; default token-sized `hitSlop`; chevron hidden from the accessibility tree.
Verification: `./node_modules/.bin/prettier --write components/ChapterRow.tsx` -> unchanged; token discipline grep on `components/ChapterRow.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; post-rebase `./node_modules/.bin/prettier --check components/ChapterRow.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass; `git diff --check origin/main..HEAD -- components/ChapterRow.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass.
Blocked? no - scoped to COMPONENTS writable files only.
Next: Manager can review ChapterRow and then queue DisclaimerBanner if accepted.

## Iteration 8 - 2026-05-18

Component: DisclaimerBanner independent-app notice atom - `components/DisclaimerBanner.tsx`
Variants/states implemented: subtle warm surface banner with optional title, required default independent-app disclaimer message, overridable localized copy, caller style/title/message style passthrough, and compact caption hierarchy.
Tokens used: `colors.surfaceWarm`, `colors.border`, `colors.textSecondary`, `colors.textDisclaimer`, `radius.card`, `space[0.5]`, `space[1.25]`, `space[1.5]`, `space.hairline`, `typography.badge`, and `typography.disclaimer`.
A11y props: default `accessible=true`; default `accessibilityRole="summary"`; derives `accessibilityLabel` from title and message; caller can override inherited View accessibility props.
Verification: `./node_modules/.bin/prettier --check components/DisclaimerBanner.tsx` -> pass; token discipline grep on `components/DisclaimerBanner.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `git diff --check -- components/DisclaimerBanner.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass.
Blocked? no - scoped to COMPONENTS writable files only.
Next: Manager can review DisclaimerBanner and then queue Screen if accepted.

## Iteration 9 - 2026-05-18

Component: Screen safe-area wrapper atom - `components/Screen.tsx`
Variants/states implemented: `canvas`, `surface`, and `warm` page tones; `none`, `compact`, and `comfortable` token padding; static and scrollable content modes; caller safe-area edge, wrapper style, and content container style passthrough.
Tokens used: `colors.canvas`, `colors.surface`, `colors.surfaceWarm`, `space[0]`, `space[2]`, `space[3]`, `space[4]`, and `space[5]`.
A11y props: default `accessibilityRole="none"` so child reading order remains intact; inherited SafeAreaView accessibility props, including optional `accessibilityLabel`, pass through for callers that need to announce the wrapper.
Verification: `./node_modules/.bin/prettier --check components/Screen.tsx` -> pass; token discipline grep on `components/Screen.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1.
Blocked? no - scoped to COMPONENTS writable files only.
Next: Manager can review Screen and then queue Divider if accepted.

## Iteration 10 - 2026-05-18

Component: Divider separator atom - `components/Divider.tsx`
Variants/states implemented: horizontal and vertical orientations; none/sm/md/lg token spacing; default, muted, and accent border tones; caller style and View prop passthrough.
Tokens used: `colors.border`, `colors.surfaceWarm`, `colors.accent`, `space[0]`, `space[0.5]`, `space[1]`, `space[2]`, and `space.hairline`.
A11y props: default `accessibilityRole="none"`; decorative dividers default to `accessible=false` and `importantForAccessibility="no"`; providing `accessibilityLabel` makes the divider accessible while preserving caller overrides.
Verification: `./node_modules/.bin/prettier --check components/Divider.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass; token discipline grep on `components/Divider.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `git diff --check -- components/Divider.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass.
Blocked? no - scoped to COMPONENTS writable files only.
Next: Manager can review Divider and mark the core component set ready for SCREENS dependency review.

## Iteration 11 - 2026-05-18

Component: Core component barrel - `components/index.ts`
Variants/states implemented: root named exports for `Surface`, `Text`, `Button`, `OptionCard`, `PillBadge`, `ProgressBar`, `ChapterRow`, `DisclaimerBanner`, `Screen`, and `Divider` so screens can consume the accepted atom set through one library entry point.
Tokens used: no runtime visual tokens; barrel-only export file preserves each component's existing token usage.
A11y props: no runtime UI; exported components retain their existing accessibility props, roles, labels, states, hit slop, and decorative-hidden behavior.
Verification: `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; token discipline grep on `components/index.ts` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1.
Blocked? no - scoped to COMPONENTS writable files only.
Next: Manager can review the barrel exports and mark the core component library ready for SCREENS dependency review.

## Iteration 12 - 2026-05-18

Component: ResultSummary draft result atom - `components/ResultSummary.tsx`
Variants/states implemented: pass/review inferred status; localized label props; percentage score, passing-line metric, optional trailing metrics, progress fill, and optional CTA actions for mock-exam or practice results. Exported through `components/index.ts`.
Tokens used: `colors.text`, `colors.surfaceWarm`, `colors.border`, `colors.success`, `colors.warning`, `radius.small`, `space[0.5]`, `space[1]`, `space[1.25]`, `space[1.5]`, `space[2.25]`, `space[12]`, `space.hairline`, and `typography.displayHero`; child `Surface`, `Text`, `PillBadge`, `ProgressBar`, and `Button` retain their token usage.
A11y props: default `accessibilityRole="summary"`; derived whole-card `accessibilityLabel`; progress `accessibilityLabel`; metric text uses shared `Text`; optional actions pass explicit `accessibilityLabel`, `accessibilityRole="button"`, and disabled state through `Button`.
Verification: `./node_modules/.bin/prettier --check components/ResultSummary.tsx components/index.ts` -> pass; token discipline grep on `components/ResultSummary.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `git diff --check -- components/ResultSummary.tsx components/index.ts` -> pass.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: SCREENS can use `ResultSummary` to replace bespoke mock-exam and practice result cards during the UI-OVERHAUL port.

## Iteration 13 - 2026-05-18

Component: AnswerOption shared option-row wrapper - `components/quiz/AnswerOption.tsx`
Variants/states implemented: preserved the existing quiz wrapper API while routing idle, selected, correct, and incorrect visual states through the shared `OptionCard` atom; localized SV/EN state labels; existing practice and quiz callers keep their props unchanged.
Tokens used: no new direct visual tokens; `OptionCard` owns the tokenized surface, border, marker, pressed, hit-slop, and text styling via `colors.*`, `motion.pressedScale`, `radius.*`, `space.*`, and `typography.*`.
A11y props: `OptionCard` provides default `accessibilityRole="radio"`, checked/disabled state, token hit slop, and spoken labels; `AnswerOption` keeps localized explicit labels and passes selected/disabled state through.
Verification: `./node_modules/.bin/prettier --check components/quiz/AnswerOption.tsx` -> pass; token discipline grep on `components/quiz/AnswerOption.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` -> pass 1/1; `git diff --check -- components/quiz/AnswerOption.tsx` -> pass.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: DESIGN-TOKENS needs to publish immutable `lib/theme/flag.ts` before COMPONENTS can complete the P0 Swedish-flag-constants atom for `SwedishFlagBand`.

## Iteration 14 - 2026-05-18

Component: ChapterProgressCard draft practice-hub card atom - `components/ChapterProgressCard.tsx`, exported from `components/index.ts`.
Variants/states implemented: tokenized chapter card with optional press behavior, disabled and pressed states, emoji/chapter identity row, optional subtitle, clamped answered/correct counts, progress fill, and accuracy badge using success/warning status variants.
Tokens used: `colors.surface`, `colors.border`, `colors.text`, `motion.pressedScale`, `radius.card`, `shadows.card`, `space[0.5]`, `space[1]`, `space[1.5]`, `space[2]`, `space[4]`, and `space.hairline`; child `PillBadge`, `ProgressBar`, and `Text` keep their own token usage.
A11y props: default `accessibilityRole="button"` when `onPress` exists and `"summary"` otherwise; derived whole-card `accessibilityLabel`; caller-overridable localized progress label; merged disabled accessibility state; token-sized `hitSlop`; child layout marked `pointerEvents="none"` so the card remains the single interaction target.
Verification: `./node_modules/.bin/prettier --check components/ChapterProgressCard.tsx components/index.ts` -> pass; token discipline grep on `components/ChapterProgressCard.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` -> pass 1/1; `git diff --check -- components/ChapterProgressCard.tsx components/index.ts docs/parallel-sessions/journals/uiux-components.md` -> pass.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: SCREENS can use `ChapterProgressCard` when porting the practice-hub chapter grid from the 2026-05-18 design draft.

## Iteration 15 - 2026-05-18

Component: MockExamStatusBar exam header atom - `components/MockExamStatusBar.tsx`, exported from `components/index.ts`.
Variants/states implemented: mock-exam label and counter group, timer group with normal/warning low-time state, localized submit action, disabled/no-handler submit state, and caller style/accessibility passthrough.
Tokens used: `colors.surface`, `colors.border`, `colors.warningSoft`, `colors.warning`, `colors.text`, `radius.card`, `space[0.5]`, `space[1]`, `space[1.5]`, `space[12]`, and `space.hairline`; child `Button`, `PillBadge`, and `Text` keep their own token usage.
A11y props: default `accessibilityRole="summary"`; derived whole-bar `accessibilityLabel`; timer badge gets explicit spoken label; submit `Button` gets explicit `accessibilityRole="button"`, label, and disabled state.
Verification: `./node_modules/.bin/prettier --check components/MockExamStatusBar.tsx components/index.ts` -> pass; token discipline grep on `components/MockExamStatusBar.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass after linking the existing `node_modules` install into the clean worktree; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` -> pass 1/1.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: SCREENS can use `MockExamStatusBar` when porting the mock-exam shell from the 2026-05-18 design draft; COMPONENTS can next extract a question navigation dot/grid atom from the same draft.

## Iteration 16 - 2026-05-18

Component: QuestionNavigator exam/practice dot grid atom - `components/QuestionNavigator.tsx`, exported from `components/index.ts`.
Variants/states implemented: tokenized pressable question-number grid with `current`, `answered`, and `unanswered` states; disabled/no-handler state; caller-provided localized spoken labels; current item selected state; onSelect index callback for mock-exam or practice navigation.
Tokens used: `colors.surfaceWarm`, `colors.border`, `colors.focusSoft`, `colors.accent`, `colors.text`, `colors.textSecondary`, `colors.surface`, `motion.pressedScale`, `radius.small`, `space[0.5]`, `space[0.75]`, `space[1]`, `space[4]`, `space.hairline`, and `typography.badge`.
A11y props: default `accessibilityRole="tablist"` on the group; each dot uses `accessibilityRole="tab"`, derived `accessibilityLabel`, selected/disabled `accessibilityState`, token hit slop, and pressed-state styling from tokens.
Verification: `./node_modules/.bin/prettier --check components/QuestionNavigator.tsx components/index.ts docs/parallel-sessions/journals/uiux-components.md` -> pass; token discipline grep on `components/QuestionNavigator.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass after linking the existing `node_modules` install into the clean worktree; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` -> pass 1/1; `git diff --check -- components/QuestionNavigator.tsx components/index.ts docs/parallel-sessions/journals/uiux-components.md` -> pass.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: SCREENS can use `QuestionNavigator` with `MockExamStatusBar` when porting the mock-exam shell from the 2026-05-18 design draft.

## Iteration 17 - 2026-05-18

Component: MockExamConfigPanel draft landing/config atom - `components/MockExamConfigPanel.tsx`, exported from `components/index.ts`.
Variants/states implemented: mock-exam setup panel with question-count and duration steppers, all/none chapter chip controls, selectable chapter chips, pass/no-feedback/local-save metadata, start/practice/reset actions, disabled states, localized label props, and caller style/surface passthrough.
Tokens used: `colors.surface`, `colors.surfaceWarm`, `colors.border`, `colors.focusSoft`, `colors.accent`, `colors.text`, `motion.pressedScale`, `radius.card`, `radius.small`, `shadows.card`, `space[0.5]`, `space[0.75]`, `space[1]`, `space[1.25]`, `space[1.5]`, `space[2]`, `space[2.25]`, `space[3]`, `space[6]`, `space[12]`, `space[15]`, and `space.hairline`; child `Surface`, `Text`, `Button`, and `PillBadge` retain their own token usage.
A11y props: default `accessibilityRole="summary"` on the panel with derived localized summary label; steppers expose `accessibilityRole="adjustable"` and `accessibilityValue`; stepper controls and action buttons have explicit button labels/roles/states; chapter chips expose checkbox role, checked/disabled state, token hit slop, and pressed-state styling from tokens.
Verification: `./node_modules/.bin/prettier --check components/MockExamConfigPanel.tsx components/index.ts` -> pass; token discipline grep on `components/MockExamConfigPanel.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` -> pass 1/1; `git diff --check -- components/MockExamConfigPanel.tsx components/index.ts docs/parallel-sessions/journals/uiux-components.md` -> pass.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: SCREENS can use `MockExamConfigPanel` with `MockExamStatusBar` and `QuestionNavigator` when porting the draft mock-exam landing/config flow into `app/(tabs)/exam.tsx`.

## Iteration 18 - 2026-05-18

Component: QuestionDisclaimer banner reuse atom - `components/quiz/QuestionDisclaimer.tsx`.
Variants/states implemented: preserved the existing route-facing `QuestionDisclaimer` API while routing the independent-study disclaimer through the shared `DisclaimerBanner` atom; kept localized SV/EN disclaimer text, titles, spoken labels, and hints; strengthened the SOURCE-CITATION P0 boundary by keeping the not-real-exam disclaimer in a dedicated banner component separate from `QuestionCard` source citation rendering.
Tokens used: no new direct visual tokens; `DisclaimerBanner` owns the warm surface, border, radius, spacing, title, and message typography via `colors.*`, `radius.card`, `space.*`, and `typography.*`.
A11y props: `DisclaimerBanner` provides `accessible=true`, `accessibilityRole="summary"`, and derived label support; `QuestionDisclaimer` keeps explicit localized `accessibilityLabel` and `accessibilityHint` for question surfaces.
Verification: `./node_modules/.bin/prettier --check components/quiz/QuestionDisclaimer.tsx` -> pass; token discipline grep on `components/quiz/QuestionDisclaimer.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-question-disclaimer-parity.test.js` -> pass 4/4; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` -> pass with `questionDisclaimerRoutesValidated:6`, `questionDisclaimerCopyValidated:true`, and `questionCardAccessibilityParityValidated:true`; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` -> pass 1/1; `git diff --check -- components/quiz/QuestionDisclaimer.tsx` -> pass.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: DESIGN-TOKENS still needs to publish immutable `lib/theme/flag.ts` before COMPONENTS can complete the fixed Swedish flag color atom for `components/ui/SwedishFlagBand.tsx`.

## Iteration 19 - 2026-05-18

Component: SourceCitation source-line atom - `components/quiz/SourceCitation.tsx`, exported from `components/index.ts`.
Variants/states implemented: localized SV/EN source-citation label, optional `UHRReference` rendering, missing-reference fallback, configurable source title, separate page metadata, caller style passthrough, and an uncarded compact citation surface for SCREENS to place below question text without merging it into the independent-app disclaimer.
Tokens used: `colors.surfaceWarm`, `colors.border`, `colors.textDisclaimer`, `colors.textSecondary`, `colors.textMuted`, `radius.small`, `space[0.5]`, `space[1]`, `space[1.5]`, `space.hairline`, `typography.badge`, `typography.captionLight`, and `typography.micro`.
A11y props: default `accessibilityRole="text"`; derives `accessibilityLabel` from the localized label, citation body, and page text; supports caller override through inherited View props.
Verification: `./node_modules/.bin/prettier --check components/quiz/SourceCitation.tsx components/index.ts` -> pass; token discipline grep on `components/quiz/SourceCitation.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-uhr-source-citation-stem.test.js tests/content-question-card-accessibility-parity.test.js` -> pass 8/8; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` -> pass with `questionCardAccessibilityParityValidated:true`, `questionAuthorityBoundaryTextValidated:715`, and `questionBankCsvRowsValidated:715`; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` -> pass 1/1; `git diff --check -- components/quiz/SourceCitation.tsx components/index.ts` -> pass.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: SCREENS can replace bespoke question-card citation text with `SourceCitation` in a separate `app/**` iteration; DESIGN-TOKENS still needs `lib/theme/flag.ts` before COMPONENTS can complete the fixed Swedish flag color atom.

## Iteration 20 - 2026-05-18

Component: QuestionCard source-citation composition atom - `components/quiz/QuestionCard.tsx` and `components/quiz/SourceCitation.tsx`.
Variants/states implemented: `QuestionCard` now wraps the existing localized visible source line in the shared `SourceCitation` surface while preserving the route-facing question-card API, current `getQuestionSourceCitation` output, missing-reference fallback text, and the separate independent-app disclaimer boundary; `SourceCitation` now accepts optional custom body children for callers that already own a validated citation string.
Tokens used: no new literal visual values; `QuestionCard` keeps `colors.textDisclaimer`, `space[0.75]`, and `typography.disclaimer` for the validated citation text, while `SourceCitation` owns the tokenized warm surface, border, radius, spacing, label/body/meta typography, and secondary text colors via `colors.*`, `radius.small`, `space.*`, and `typography.*`.
A11y props: `QuestionCard` keeps the whole-card localized accessibility summary including source citation; `SourceCitation` receives an explicit localized source accessibility label and keeps `accessibilityRole="text"` by default.
Verification: `/home/billy/Swedish_Civic_Test/node_modules/.bin/prettier --write components/quiz/QuestionCard.tsx components/quiz/SourceCitation.tsx` -> pass after linking the existing dependency install into the clean worktree; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-question-card-accessibility-parity.test.js tests/content-uhr-source-citation-stem.test.js tests/content-question-disclaimer-parity.test.js` -> pass 12/12; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; token discipline grep on `components/quiz/QuestionCard.tsx` and `components/quiz/SourceCitation.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` -> pass with `questionCardAccessibilityParityValidated:true`, `questionAuthorityBoundaryTextValidated:715`, and `questionBankCsvRowsValidated:715`; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` -> pass 1/1; `/home/billy/Swedish_Civic_Test/node_modules/.bin/prettier --check components/quiz/QuestionCard.tsx components/quiz/SourceCitation.tsx` -> pass; `git diff --check -- components/quiz/QuestionCard.tsx components/quiz/SourceCitation.tsx` -> pass.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: SCREENS can keep consuming `QuestionCard` unchanged while the shared citation atom now owns the visible source-line surface; DESIGN-TOKENS still needs `lib/theme/flag.ts` before COMPONENTS can complete the fixed Swedish flag color atom.

## Iteration 21 - 2026-05-18

Component: UHRReferenceCard source-citation surface composition atom - `components/quiz/UHRReferenceCard.tsx` and `components/quiz/SourceCitation.tsx`.
Variants/states implemented: `UHRReferenceCard` now composes its validated visible source-reference body through the shared `SourceCitation` surface while preserving the existing route-facing API, localized SV/EN title, chapter-section label, approximate-page label, and unavailable fallback; `SourceCitation` now supports `showLabel=false` for callers that render a validated custom header/body.
Tokens used: no new literal visual values; `UHRReferenceCard` keeps existing text styling through `colors.text`, `colors.textSecondary`, `colors.textMuted`, `space[0.5]`, `space[1]`, `typography.body`, `typography.bodyBold`, `typography.caption`, and `typography.badge`, while `SourceCitation` owns the shared warm source surface through `colors.surfaceWarm`, `colors.border`, `colors.textDisclaimer`, `colors.textSecondary`, `colors.textMuted`, `radius.small`, `space.*`, and `typography.*`.
A11y props: outer `Card` keeps the localized UHR reference accessibility summary; nested `SourceCitation` receives the same label and keeps `accessibilityRole="text"` by default; visible title remains `accessibilityRole="header"`.
Verification: `/home/billy/Swedish_Civic_Test/node_modules/.bin/prettier --write components/quiz/SourceCitation.tsx components/quiz/UHRReferenceCard.tsx` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass after linking the existing dependency install into the clean worktree; `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-uhr-reference-card-accessibility-parity.test.js tests/content-question-card-accessibility-parity.test.js tests/content-uhr-source-citation-stem.test.js tests/content-question-disclaimer-parity.test.js` -> pass 14/14; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; token discipline grep on `components/quiz/SourceCitation.tsx` and `components/quiz/UHRReferenceCard.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` -> pass with `uhrReferenceCardAccessibilityParityValidated:true`, `questionCardAccessibilityParityValidated:true`, `questionAuthorityBoundaryTextValidated:715`, and `uhrReferencesValidated:715`; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` -> pass 1/1; `/home/billy/Swedish_Civic_Test/node_modules/.bin/prettier --check components/quiz/SourceCitation.tsx components/quiz/UHRReferenceCard.tsx` -> pass; `git diff --check -- components/quiz/SourceCitation.tsx components/quiz/UHRReferenceCard.tsx` -> pass.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: SCREENS still has bespoke `app/(tabs)/exam.tsx` source-citation text that should be moved to `SourceCitation` in an app-owned iteration; DESIGN-TOKENS still needs `lib/theme/flag.ts` before COMPONENTS can complete the fixed Swedish flag color atom.

## Iteration 22 - 2026-05-18

Component: QuestionSourceCitation question-bound source-line atom - `components/quiz/QuestionSourceCitation.tsx`, `components/quiz/QuestionCard.tsx`, and `components/index.ts`.
Variants/states implemented: new `QuestionSourceCitation` wrapper computes the validated localized citation with `getQuestionSourceCitation(question, language)`, supports caller-provided `citationText`, custom children, inherited `SourceCitation` surface props, missing-reference fallback text, and root export; `QuestionCard` now composes the wrapper while preserving its route-facing API, existing visible citation line, and existing whole-card accessibility summary.
Tokens used: `QuestionSourceCitation` default body uses `colors.textDisclaimer` and `typography.disclaimer`; `QuestionCard` keeps its existing `colors.*`, `space.*`, and `typography.*`; child `SourceCitation` still owns the shared warm source surface tokens.
A11y props: default wrapper accessibility label is localized as `<label>: <citation>`; `QuestionCard` passes its explicit localized citation label and keeps the visible citation text separate from the independent-app disclaimer.
Verification: `/home/billy/Swedish_Civic_Test/node_modules/.bin/prettier --write components/quiz/QuestionSourceCitation.tsx components/quiz/QuestionCard.tsx components/index.ts` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass after linking the existing dependency install into the clean worktree; `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-question-card-accessibility-parity.test.js tests/content-uhr-source-citation-stem.test.js tests/content-question-disclaimer-parity.test.js tests/content-uhr-reference-card-accessibility-parity.test.js` -> pass 14/14; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; token discipline grep on `components/quiz/QuestionSourceCitation.tsx`, `components/quiz/QuestionCard.tsx`, and `components/index.ts` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` -> pass with `questionCardAccessibilityParityValidated:true`, `questionAuthorityBoundaryTextValidated:715`, `uhrReferencesValidated:715`, and `staticSiteQuestionBankParityValidated:true`; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` -> pass 1/1; `/home/billy/Swedish_Civic_Test/node_modules/.bin/prettier --check components/quiz/QuestionSourceCitation.tsx components/quiz/QuestionCard.tsx components/index.ts` -> pass; `git diff --check -- components/quiz/QuestionSourceCitation.tsx components/quiz/QuestionCard.tsx components/index.ts` -> pass.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: SCREENS can replace the bespoke `app/(tabs)/exam.tsx` source-citation `<Text>` blocks with exported `QuestionSourceCitation` in an app-owned iteration.

## Iteration 23 - 2026-05-18

Component: ProgressBar localized accessibility value text parity - `components/ProgressBar.tsx`
Variants/states implemented: preserved animated/static progress behavior, clamped percentage math, caller-provided `accessibilityLabel`, and caller `accessibilityValue` overrides; native `accessibilityValue.text` now mirrors the resolved spoken label so localized caller copy is not replaced by the English default.
Tokens used: no new visual tokens; existing `colors.surfaceWarm`, `colors.accent`, `motion.duration.slow`, `radius.pill`, and `space[1]` remain in use.
A11y props: default `accessibilityRole="progressbar"`; derived or caller-provided `accessibilityLabel`; `accessibilityValue` keeps `min`, `max`, `now`, and now uses the resolved localized text before preserving caller overrides.
Verification: `./node_modules/.bin/prettier --check components/ProgressBar.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass; token discipline grep on `components/ProgressBar.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` -> pass 1/1; `git diff --check -- components/ProgressBar.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: DESIGN-TOKENS still needs to publish immutable `lib/theme/flag.ts` before COMPONENTS can complete the fixed Swedish flag color atom for `components/ui/SwedishFlagBand.tsx`.

## Iteration 24 - 2026-05-18

Component: SwedishFlagBand fixed flag constants blocker - `components/ui/SwedishFlagBand.tsx`
Variants/states implemented: no component source change; confirmed the remaining fixed-flag-colors atom is blocked because `SwedishFlagBand` still consumes palette tokens while `origin/main` has no `lib/theme/flag.ts` export for COMPONENTS to import.
Tokens used: existing `colors.swedishBlue`, `colors.swedishGold`, and `radius.pill` remain in place; the intended immutable flag constants are unavailable because DESIGN-TOKENS owns `lib/theme/**`.
A11y props: existing decorative band behavior remains unchanged with `accessibilityElementsHidden` and `importantForAccessibility="no"`.
Verification: read required COMPONENTS iteration docs from `origin/main`; `git ls-tree -r --name-only origin/main lib/theme` confirmed no `lib/theme/flag.ts`; `git show origin/main:components/ui/SwedishFlagBand.tsx` confirmed the palette-token dependency; `codex-tasks/blockers.txt` now records `B-UIUX-COMPONENTS-FLAG-CONSTANTS-20260518` via PR #392 / `1e960aa`; journal-only verification ran `git diff --check`, `prettier --check docs/parallel-sessions/journals/uiux-components.md`, `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership`, and `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false`.
Blocked? yes - COMPONENTS cannot edit `lib/theme/**`, and hardcoding the flag hex in `components/**` would violate `scripts/theme-discipline.test.js`.
Next: DESIGN-TOKENS should publish immutable flag constants from `lib/theme/flag.ts` and export them; then COMPONENTS can switch `SwedishFlagBand` to the fixed constants in a source-code iteration.

## Iteration 25 - 2026-05-18

Component: TopBarActions localized accessibility labels - `components/ui/TopBarActions.tsx`
Variants/states implemented: preserved the existing top-bar icon layout while adding Swedish and English copy for audio switch on/off states, search, saved questions, and settings link accessible names.
Tokens used: no new visual tokens; existing `space[0.5]`, `space[0.75]`, and `space[1.5]` layout tokens remain unchanged.
A11y props: `Pressable` keeps `accessibilityRole="switch"` and checked state, now with localized `accessibilityLabel`; `Link` controls keep `accessibilityRole="link"` with localized labels from the selected settings language.
Verification: `./node_modules/.bin/prettier --check components/ui/TopBarActions.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass; token discipline grep on `components/ui/TopBarActions.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` -> pass 1/1; `git diff --check -- components/ui/TopBarActions.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: Manager can review this bounded TRANSLATE-COMPLETE a11y atom; DESIGN-TOKENS still owns the separate `lib/theme/flag.ts` prerequisite for `SwedishFlagBand`.

## Iteration 26 - 2026-05-18

Component: LanguagePicker localized picker copy - `components/ui/LanguagePicker.tsx`
Variants/states implemented: preserved the global language picker trigger and modal flow while adding Swedish and English copy for trigger speech, modal title/subtitle, close/menu labels, unavailable locale row labels, and unavailable badges.
Tokens used: no new visual tokens; existing `colors.surfaceWarm`, `colors.surfaceMuted`, `colors.surface`, `colors.border`, `colors.badgeBlueBg`, `colors.text`, `colors.textMuted`, `colors.accent`, `radius.pill`, `radius.card`, `radius.small`, `space.*`, and `typography.*` remain unchanged.
A11y props: trigger `Pressable` keeps `accessibilityRole="button"` with localized selected-language label; backdrop close control and modal menu labels are localized; unavailable locale rows now append the selected-language unavailable suffix while retaining disabled accessibility state.
Verification: `./node_modules/.bin/prettier --check components/ui/LanguagePicker.tsx` -> pass; token discipline grep on `components/ui/LanguagePicker.tsx` -> `tokens-only OK`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck -- --pretty false` -> pass; `NODE_OPTIONS='--v8-pool-size=1' npm run test:theme-discipline` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:a11y-labels` -> pass 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` -> pass 1/1; `./node_modules/.bin/prettier --check components/ui/LanguagePicker.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass; `git diff --check -- components/ui/LanguagePicker.tsx docs/parallel-sessions/journals/uiux-components.md` -> pass.
Blocked? no - scoped to COMPONENTS writable files plus append-only component journal only.
Next: Manager can review this bounded TRANSLATE-COMPLETE component atom; DESIGN-TOKENS still owns the separate `lib/theme/flag.ts` prerequisite for `SwedishFlagBand`.
