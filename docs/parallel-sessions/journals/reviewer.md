Lane: REVIEWER
Artifact reviewed: current `main` exported web bundle plus monetization code/tests for the ads-supported v1.0 target.
Checks run:
- Read `docs/parallel-sessions/PRODUCTIVITY.md`, `docs/parallel-sessions/reviewer.md`, `GOAL.md`, `docs/architecture.md`, `DESIGN.md`, and `docs/parallel-sessions/TEAM_PLAN.md`.
- Inspected current dirty queue state before writing: only operator queue seeds in `codex-tasks/ceo-inbox.txt` and `codex-tasks/open.txt`; no product source dirty state observed.
- `grep -q "REAL_ADS_ENABLED" lib/monetization/ads.ts && ! grep -q "REAL_ADS_ENABLED_FOR_V1 = false" lib/monetization/ads.ts` — exit 1.
- `test -f lib/monetization/purchases.ts && grep -qiE "restore" lib/monetization/purchases.ts && grep -rqi "remove.?ads" app components lib` — exit 1.
- `npm run test:monetization` — exit 0, but the tests still assert the old fail-closed ads posture.
- `CI=1 timeout 360s npx expo export --platform web --output-dir dist-web --max-workers 2` — exit 0.
- Inline Playwright exported-route check using `/usr/bin/google-chrome` — exit 1. `/home` had no ad placement copy; `/profile` had no Remove Ads, no 29 SEK, and no Restore; `/exam` stayed ad-free; console errors 0.
Workspace contract: pass — no product source edited; findings queued instead of patched.
Findings queued: `codex-tasks/validator.txt` item `REVIEWER-ADS-IAP-1`.
Evidence: exported route check observed profile copy: "Premium and ads are deferred for v1.0" plus no current purchase/restore UI. Static gates also show `REAL_ADS_ENABLED_FOR_V1 = false` and missing `lib/monetization/purchases.ts`.
Next manager action: assign source-touching ADS/IAP atoms from `codex-tasks/open.txt`; reject any docs-only acceptance for this defect.

Lane: REVIEWER
Artifact reviewed: exported `/privacy` route plus consent/compliance files for the ad-supported v1.0 target.
Checks run:
- `test -f publishing/public-site/app-ads.txt && grep -rqiE "tracking-transparency|ATT|UMP|consent" lib app && test -f publishing/admob-iap-setup-runbook.md` — exit 1.
- `test -f publishing/public-site/app-ads.txt` — exit 1.
- `rg -n "expo-tracking-transparency|UserMessagingPlatform|UMP|tracking-transparency|consent" package.json app.json app lib` — only found the `app.json` usage-description string, not an app/lib consent implementation.
- Inline Playwright `/privacy` route check using `/usr/bin/google-chrome` — exit 1. Stale copy still says real ad rendering is disabled for v1.0; no Remove Ads, no 29 SEK, no tracking/consent disclosure; console errors 0.
Workspace contract: pass — no product source edited; finding queued.
Findings queued: `codex-tasks/validator.txt` item `REVIEWER-CONSENT-COMPLY-1`.
Evidence: exported privacy route observed "The native build includes Google Mobile Ads test configuration, but real ad rendering is disabled for the v1.0 release candidate..."
Next manager action: assign CONSENT-1/COMPLY-1 source-touching atoms and reject stale disclosure-only acceptance that does not match the new app behavior.

Lane: REVIEWER
Artifact reviewed: release verifier layer after the goal changed from disabled ads to ad-supported v1.0 with Remove Ads IAP.
Checks run:
- `rg -n 'REAL_ADS_ENABLED_FOR_V1=false|real ads disabled|real ads are disabled|fail-closed|no analytics, crash reporting, purchases, or real ads enabled|deferred AdMob decision|Google Mobile Ads SDK test configuration' scripts publishing reports app lib components tests` — exit 0 with stale old-contract matches in tests, preflight logic, publishing docs, and release gate evidence.
- `npm run test:publishing` — exit 0 while still asserting real ads disabled.
- `npm run test:release-gates-writer` — exit 0.
- `node --test scripts/release-preflight.test.js --test-name-pattern 'privacy|AdMob|Google Mobile Ads|real ads'` — exit 0; passing subset includes old-contract privacy/ad SDK posture checks.
Workspace contract: pass — no product source edited; finding queued.
Findings queued: `codex-tasks/validator.txt` item `REVIEWER-RELEASE-GATES-1`.
Evidence: release preflight and publishing tests can remain green while checking for disabled real ads, which conflicts with the current `GOAL.md`.
Next manager action: assign TEST/release-gate source work so green tests mean ads-enabled free tier, no ads when `adsDisabled`, no ads on exam, Remove Ads 29 SEK purchase/restore, and consent/store disclosures are all covered.

Lane: REVIEWER
Artifact reviewed: current `main` dirty DATA-INTEGRITY product changes plus exported web learning path.
Checks run:
- Re-read `docs/parallel-sessions.md`, `docs/parallel-sessions/PRODUCTIVITY.md`, `docs/parallel-sessions/reviewer.md`, `GOAL.md`, `docs/architecture.md`, and `docs/parallel-sessions/TEAM_PLAN.md`.
- Inspected existing reviewer queue first; did not duplicate `REVIEWER-ADS-IAP-1`, `REVIEWER-CONSENT-COMPLY-1`, or `REVIEWER-RELEASE-GATES-1`.
- `npm run validate:content` — exit 0, 13 chapters, 500 questions, 500 published questions.
- `npm run test:content` — exit 0, 2/2 tests passed including question-bank export parity.
- `npm run build:web:export` — exit 0.
- `npm run test:e2e -- tests/e2e/learn-chapter-navigation.spec.ts` — exit 1; missing accessible `Start quiz for Landet Sverige` control on `/chapter/ch01`.
- `npm run test:e2e -- tests/e2e/practice-feedback.spec.ts` — exit 0, practice answer/feedback/advance flow passed.
Workspace contract: pass — no product source edited; product defect queued instead of patched.
Findings queued: `codex-tasks/validator.txt` item `REVIEWER-LEARN-CHAPTER-1`.
Evidence: Playwright failure context shows `/chapter/ch01` renders the chapter and 50 questions, but no start-quiz action; code inspection confirms `app/chapter/[chapterId].tsx` currently has only back navigation plus read-only question/reference rendering. Separate practice-feedback pass remained green. A concurrent dirty edit now exists in `app/quiz/[sessionId].tsx`, so manager should coordinate rather than overwrite it.
Next manager action: assign or finish a source-touching learn/chapter quiz-entry atom and rerun `npm run test:e2e -- tests/e2e/learn-chapter-navigation.spec.ts` after implementation.

Lane: REVIEWER
Artifact reviewed: workspace contract state after reviewer passes.
Checks run:
- `git status --short --branch` — product-source dirty state appeared outside this lane.
- `git diff --name-status` — source changes present in `app/quiz/[sessionId].tsx`, `data/chapters.ts`, `package.json`, `scripts/export-question-bank.js`, and `scripts/validate-content.js`.
Workspace contract: blocked — dirty product-source ownership is ambiguous for additional REVIEWER passes.
Findings queued: `codex-tasks/blockers.txt` item `REVIEWER-BLOCKED-DIRTY-WORKTREE-1`.
Evidence: this lane did not edit product source; it only queued findings and this journal. Continuing would test a mixed artifact without an explicit owner/commit boundary.
Next manager action: resolve or accept/reject the other lane's source edits, then hand REVIEWER a known state for the next functional pass.

Lane: REVIEWER
Artifact reviewed: current exported web mock-exam submit/review flow on `/exam`.
Checks run:
- Re-read `docs/parallel-sessions/PRODUCTIVITY.md`, `docs/parallel-sessions/reviewer.md`, `GOAL.md`, `docs/architecture.md`, `DESIGN.md`, and `docs/parallel-sessions/TEAM_PLAN.md`.
- `CI=1 timeout 360s npm run build:web:export` — exit 0; `dist-web` rebuilt from the current dirty checkout.
- `CI=1 timeout 120s npm run test:e2e -- tests/e2e/exam-submit-review.spec.ts` — exit 1 before app interaction because the bundled Playwright Chromium executable is missing from the local cache.
- Inline Playwright pass against `dist-web` using `/usr/bin/google-chrome` — exit 0; `/exam` rendered 20 UHR-based questions, kept submit disabled until all answers were selected, showed result/review/source sections after submit, and reported no console/page errors.
Workspace contract: pass with caveat — no product source edited; the checked route passed, but the dirty-worktree ownership blocker remains for broader acceptance.
Findings queued: none from this focused pass.
Evidence: inline pass returned `{"route":"/exam","totalQuestions":20,"result":"pass","consoleErrors":[]}`. The local stock Playwright command is verifier-environment limited by the missing cached browser, so reviewer used system Chrome only as a functional evidence fallback.
Next manager action: keep `REVIEWER-BLOCKED-DIRTY-WORKTREE-1` active until source-owner changes are accepted/rejected; separately ensure the acceptance environment can run the official `npm run test:e2e` command without relying on ad hoc browser overrides.

Lane: REVIEWER
Artifact reviewed: current exported web practice wrong-answer feedback and mistake-review loop.
Checks run:
- Re-read `docs/parallel-sessions/PRODUCTIVITY.md`, `docs/parallel-sessions/reviewer.md`, `GOAL.md`, `docs/architecture.md`, `DESIGN.md`, and `docs/parallel-sessions/TEAM_PLAN.md`.
- Checked existing reviewer queues first; did not duplicate ads/IAP, consent/compliance, release-gate, learn-chapter, dirty-worktree, or Playwright-cache findings.
- `CI=1 timeout 360s npm run build:web:export` — exit 0; `dist-web` rebuilt from the current dirty checkout.
- Inline Playwright pass against `dist-web` using `/usr/bin/google-chrome` — exit 1 because wrong-answer feedback did not reveal the correct answer option.
Workspace contract: pass with caveats — no product source edited; the dirty-worktree ownership blocker and official Playwright cache blocker both remain active.
Findings queued: `codex-tasks/validator.txt` item `REVIEWER-PRACTICE-WRONG-FEEDBACK-1`.
Evidence: selecting `I södra Europa` on `/practice` showed `I södra Europa — Fel`, `Score: 0/1`, explanation text, and no console errors; `/mistakes` showed `Wrong answers: 1` and `Saved for focused review`; the expected correct-answer reveal `I Norden i norra Europa — Rätt` was absent (`correctRevealedCount:0`, plain correct option still present once).
Next manager action: assign a source-touching practice feedback atom and extend e2e coverage for wrong-answer feedback; keep broader acceptance blocked on known dirty-worktree and official Playwright-cache issues.

Lane: REVIEWER
Artifact reviewed: current exported web direct `/exam` entry with the dirty monetization launch-ad changes.
Checks run:
- Re-read `docs/parallel-sessions/PRODUCTIVITY.md`, `docs/parallel-sessions/reviewer.md`, `GOAL.md`, `docs/architecture.md`, and `docs/parallel-sessions/TEAM_PLAN.md`.
- Checked existing reviewer queues first; did not duplicate ads/IAP, consent/compliance, release-gate, learn-chapter, dirty-worktree, Playwright-cache, or practice feedback findings.
- `npm run test:monetization` — exit 0; coverage still misses global route-level ad overlays because it checks only direct imports in `app/(tabs)/exam.tsx`.
- `CI=1 timeout 360s npm run build:web:export` — exit 0; `dist-web` rebuilt from the current dirty checkout.
- Inline Playwright pass against `dist-web` using `/usr/bin/google-chrome` at `/exam` — exit 1 because the global launch ad modal rendered over the mock exam.
Workspace contract: pass with caveats — no product source edited; the dirty-worktree ownership blocker and official Playwright cache blocker both remain active.
Findings queued: `codex-tasks/validator.txt` item `REVIEWER-EXAM-LAUNCH-AD-1`.
Evidence: `/exam` showed `Mock exam`, `Launch sponsor`, `Google AdMob`, and `Close launch sponsor ad` at the same time, while the page also displayed `no ads during exam`; console/page errors were empty.
Next manager action: assign a source-touching monetization/routing atom to suppress `LaunchPopupAd` on exam routes and add route-level coverage for global ad overlays.

Lane: REVIEWER
Artifact reviewed: current exported web settings-to-practice English support path.
Checks run:
- Re-read `docs/parallel-sessions/PRODUCTIVITY.md`, `docs/parallel-sessions/reviewer.md`, `GOAL.md`, `docs/architecture.md`, `DESIGN.md`, and `docs/parallel-sessions/TEAM_PLAN.md`.
- Checked existing reviewer queues first; did not duplicate ads/IAP, consent/compliance, release-gate, learn-chapter, dirty-worktree, Playwright-cache, practice feedback, or exam launch-ad findings.
- `CI=1 timeout 360s npm run build:web:export` — exit 0; `dist-web` rebuilt from the current dirty checkout.
- Inline Playwright pass against `dist-web` using `/usr/bin/google-chrome` on port 4174 — exit 1 because English support did not apply to answer options or explanations.
Workspace contract: pass with caveats — no product source edited; the dirty-worktree ownership blocker and official Playwright cache blocker both remain active.
Findings queued: `codex-tasks/validator.txt` item `REVIEWER-LANGUAGE-SUPPORT-1`.
Evidence: after selecting English support in `/settings`, `/profile` showed `English support` and `/practice` showed `Where is Sweden located?`, but answer labels remained `I Norden i norra Europa`, `I södra Europa`, `I västra Asien`, `I Nordamerika`; `hasEnglishOptionBefore:false`, `hasEnglishExplanationAfter:false`, `hasSwedishExplanationAfter:true`, console/page errors 0.
Next manager action: assign a source-touching language-rendering atom across practice/quiz/exam review components and add coverage; do not accept settings-copy-only or docs-only changes for this defect.

Lane: REVIEWER
Artifact reviewed: current exported web settings screen on a 320x568 mobile viewport.
Checks run:
- Re-read `docs/parallel-sessions/PRODUCTIVITY.md`, `docs/parallel-sessions/reviewer.md`, `GOAL.md`, `docs/architecture.md`, and `docs/parallel-sessions/TEAM_PLAN.md`.
- Checked existing reviewer queues first; did not duplicate prior monetization, learning, feedback, language, dirty-worktree, or Playwright-cache findings.
- Reused the current `dist-web` from the preceding `CI=1 timeout 360s npm run build:web:export` run.
- Inline Playwright pass against `dist-web` using `/usr/bin/google-chrome` on port 4174 — exit 1 because the settings page overflowed below the viewport but did not scroll.
Workspace contract: pass with caveats — no product source edited; the dirty-worktree ownership blocker and official Playwright cache blocker both remain active.
Findings queued: `codex-tasks/validator.txt` item `REVIEWER-SETTINGS-MOBILE-SCROLL-1`.
Evidence: on a 320x568 viewport, `/settings` returned `scrollHeight:734`, `innerHeight:568`, `afterWheel.scrollY:0`, `supportBox.y:701`, `supportInViewport:false`, console/page errors 0.
Next manager action: assign a source-touching settings layout atom, likely making settings scrollable, and add a mobile viewport regression check.

Lane: REVIEWER
Artifact reviewed: current exported web onboarding screen on a 320x568 mobile viewport.
Checks run:
- Re-read `docs/parallel-sessions/PRODUCTIVITY.md`, `docs/parallel-sessions/reviewer.md`, `GOAL.md`, `docs/architecture.md`, and `docs/parallel-sessions/TEAM_PLAN.md`.
- Checked existing reviewer queues first; did not duplicate prior monetization, learning, feedback, language, dirty-worktree, Playwright-cache, settings, or release-gate findings.
- `CI=1 timeout 360s npm run build:web:export` — exit 0; `dist-web` rebuilt from the current dirty checkout.
- Inline Playwright pass against `dist-web` using `/usr/bin/google-chrome` on port 4181 — exit 1 because the onboarding page overflowed below the viewport but did not scroll.
Workspace contract: pass with caveats — no product source edited; the dirty-worktree ownership blocker and official Playwright cache blocker both remain active.
Findings queued: `codex-tasks/validator.txt` item `REVIEWER-ONBOARDING-MOBILE-SCROLL-1`.
Evidence: on a 320x568 viewport, `/onboarding` returned `scrollHeight:739`, `innerHeight:568`, `afterWheelScrollY:0`, `startBox.y:661`, `settingsBox.y:706`, `supportBox.y:610`, `textHasWelcome:true`, and console/page errors 0.
Next manager action: assign a source-touching onboarding layout atom, likely making onboarding scrollable, and add a narrow-mobile regression check.

Lane: REVIEWER
Artifact reviewed: current exported web in-app support screen.
Checks run:
- Re-read `docs/parallel-sessions/PRODUCTIVITY.md`, `docs/parallel-sessions/reviewer.md`, `GOAL.md`, `docs/architecture.md`, and `docs/parallel-sessions/TEAM_PLAN.md`.
- Checked existing reviewer queues first; did not duplicate prior monetization, learning, feedback, language, dirty-worktree, Playwright-cache, settings, onboarding, or release-gate findings.
- Reused the current `dist-web` from the preceding `CI=1 timeout 360s npm run build:web:export` run.
- Inline Playwright pass against `dist-web` using `/usr/bin/google-chrome` on port 4182 — exit 1 because `/support` still renders a pre-launch placeholder with no support contact action.
Workspace contract: pass with caveats — no product source edited; the dirty-worktree ownership blocker and official Playwright cache blocker both remain active.
Findings queued: `codex-tasks/validator.txt` item `REVIEWER-SUPPORT-CONTACT-1`.
Evidence: `/support` returned `titleVisible:true`, `placeholderCopyVisible:true`, `linkCount:1`, only `Back to Profile`, `hasMailto:false`, `hasExternalSupportLink:false`, and console/page errors 0.
Next manager action: assign a source-touching support-surface atom so the app exposes the verified support destination or contact path and removes the pre-launch placeholder copy.

Lane: REVIEWER
Artifact reviewed: current exported web sources screen.
Checks run:
- Re-read `docs/parallel-sessions/PRODUCTIVITY.md`, `docs/parallel-sessions/reviewer.md`, `GOAL.md`, `docs/architecture.md`, and `docs/parallel-sessions/TEAM_PLAN.md`.
- Checked existing reviewer queues first; did not duplicate prior monetization, learning, feedback, language, dirty-worktree, Playwright-cache, settings, onboarding, support, or release-gate findings.
- Reused the current `dist-web` from the preceding `CI=1 timeout 360s npm run build:web:export` run.
- First inline Playwright attempt on port 4183 hit a strict-locator ambiguity on the page title before product evaluation.
- Heading-specific inline Playwright rerun against `dist-web` using `/usr/bin/google-chrome` on port 4184 — exit 1 because the UHR URL is visible text but not an actionable link.
Workspace contract: pass with caveats — no product source edited; the dirty-worktree ownership blocker and official Playwright cache blocker both remain active.
Findings queued: `codex-tasks/validator.txt` item `REVIEWER-SOURCES-LINK-1`.
Evidence: `/sources` returned `headingVisible:true`, `showsUhrUrlText:true`, `linkCount:1`, only `Back to Profile`, `hasExternalUhrLink:false`, and console/page errors 0.
Next manager action: assign a source-touching legal/source page atom so primary source URLs are accessible external links, not plain text only.

Lane: REVIEWER
Artifact reviewed: current dirty-checkout monetization surface after ads/IAP source changes.
Checks run:
- Re-read `docs/parallel-sessions/PRODUCTIVITY.md`, `docs/parallel-sessions/reviewer.md`, `GOAL.md`, `docs/architecture.md`, and `docs/parallel-sessions/TEAM_PLAN.md`.
- Rechecked existing `REVIEWER-ADS-IAP-1` instead of creating a duplicate because app/monetization source changed after the original finding.
- `grep -q "REAL_ADS_ENABLED" lib/monetization/ads.ts && ! grep -q "REAL_ADS_ENABLED_FOR_V1 = false" lib/monetization/ads.ts` — exit 0.
- `test -f lib/monetization/purchases.ts && grep -qiE "restore" lib/monetization/purchases.ts && grep -rqi "remove.?ads" app components lib` — exit 1.
- `npm run test:monetization` — exit 0, 10/10 tests passed.
- `CI=1 timeout 360s npm run build:web:export` — exit 0; `dist-web` rebuilt from the current dirty checkout.
- Inline Playwright route pass against `/home`, `/profile`, and `/exam` using `/usr/bin/google-chrome` on port 4185 — exit 1 because `/profile` still lacks Remove Ads, 29 SEK, and Restore UI.
Workspace contract: pass with caveats — no product source edited; source changed during the reviewer loop, so acceptance still needs a manager-owned artifact boundary.
Findings queued: `codex-tasks/validator.txt` item `REVIEWER-ADS-IAP-1 update`.
Evidence: `/home` now shows AdMob test placement (`googleAdMobCount:2`, `homeBannerVisible:1`), `/exam` no longer shows global launch ads (`launchSponsorVisible:0`, `googleAdMobVisible:0`), but `/profile` returned `removeAdsVisible:false`, `priceVisible:false`, `restoreVisible:false`, and stale deferred copy still visible; console/page errors 0.
Next manager action: keep ADS/IAP open for a source-touching paywall UI/entitlement atom; do not accept monetization solely on green unit tests or fixed home/exam ad rendering.
