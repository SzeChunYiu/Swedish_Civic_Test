# Team Plan / AI Factory Board — Sweden Citizenship Test Prep (Batch 0)

Owned jointly by GM (direction, staffing) and VALIDATOR (acceptance, leases, queues).
Context budget: 200 lines. Archive to `docs/parallel-sessions/archive/` when full.

## Batch outcome

When Batch 0 is accepted: a working Expo TypeScript app skeleton exists with the
full folder structure from `docs/architecture.md`, all content types compile with
`tsc --noEmit`, 20 UHR-based reviewed questions are in `data/questions.ts`, and
a basic quiz screen loads and shows a question with answer options.

## Acceptance checklist

| ID | Requirement / acceptance check | DRI | Consulted | Status | Evidence |
|---|---|---|---|---|---|
| A1 | GM confirms team roster, lane leases, and batch outcome before workers start | GM | VALIDATOR | accepted | TEAM_PLAN batch outcome, role roster, lane/lease table; workers used disjoint SETUP/CONTENT scopes |
| A2 | Expo TypeScript project created (`package.json` exists, TypeScript compiles) | SETUP | VALIDATOR | accepted | `package.json`, `package-lock.json`; `npm ci`; `npm run typecheck` exit 0 |
| A3 | Full folder structure matches `docs/architecture.md` (`app/`, `components/`, `data/`, `lib/`, `types/`) | SETUP | VALIDATOR | accepted | `find app components data lib types -maxdepth 3 -type f` shows scaffold; `npm run typecheck` exit 0 |
| A4 | `types/content.ts` defines Chapter, PracticeQuestion, UHRReference — all compile | CONTENT | VALIDATOR | accepted | `types/content.ts`; `npm run typecheck` exit 0 |
| A5 | 13 chapter records in `data/chapters.ts` | CONTENT | VALIDATOR | accepted | local validation loaded 13 sequential `ch01`-`ch13` records |
| A6 | 20 sample questions in `data/questions.ts` (10 ch01, 10 ch02), all `reviewStatus:"reviewed"` | CONTENT | VALIDATOR, DEBUG | accepted | local validation loaded 20 questions; counts `{ch01:10,ch02:10}`; UHR refs/options/reviewed OK |
| A7 | Basic quiz screen in `app/(tabs)/practice.tsx` loads questions and shows answer options | SETUP | VALIDATOR | accepted | Playwright on Expo web `/practice`: question, 4 options, disclaimer visible; selecting answer shows `Rätt`, score, explanation; console errors 0 |
| A8 | VALIDATOR signs off all acceptance rows | VALIDATOR | GM | accepted | 2026-05-15 operator/validator audit: A1-A7 evidence checked locally; simulator unavailable, Expo web used for render proof |

Statuses: `open` `in_progress` `accepted` `rejected` `blocked`

## Current build manager intake

| ID | Atom | Producer pane | Status | Evidence |
|---|---|---|---|---|
| DI1 | Chapter metadata `questionCount` parity is enforced against generated published questions | DATA-INTEGRITY | accepted | `data/chapters.ts`, `scripts/validate-content.js`; manager verified `npm run validate:content`, `npm run test:content`, `npm run typecheck`, `git diff --check` |
| DI2 | Question-bank CSV export has non-mutating `--check` parity mode covered by content test | DATA-INTEGRITY | accepted | `scripts/export-question-bank.js`, `tests/content-export-parity.test.js`; manager verified `node scripts/export-question-bank.js --check`, `npm run test:content`, `npm run typecheck`, `git diff --check` |
| DI3 | UHR reference validation against `content/uhr-section-map.json` | DATA-INTEGRITY | accepted | `content/uhr-section-map.json`, `scripts/validate-content.js`, `scripts/content-production.test.js`; manager verified `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npx prettier --check content/uhr-section-map.json scripts/validate-content.js scripts/content-production.test.js`, `npm run typecheck`, `npm run test:ownership`, `git diff --check` |
| APP1 | Routed quiz session screen replaces placeholder with answer/feedback flow | SETUP | accepted | `app/quiz/[sessionId].tsx`; pane 2 handoff in `docs/parallel-sessions/journals/setup.md`; manager verified `npx eslint 'app/quiz/[sessionId].tsx'`, `npm run typecheck`, `CI=1 npx expo export --platform web --output-dir dist-web --max-workers 2`, and `/quiz/daily` browser smoke with answer, score, explanation, UHR reference, retry/back controls, console errors 0 |
| APP2 | Chapter-to-quiz session helper resolves first question per chapter | SETUP | accepted | `lib/quiz/practiceFlow.ts`, `scripts/practice-flow.test.js`; pane 2 handoff in `docs/parallel-sessions/journals/setup.md`; manager verified HEAD artifact, `npm run test:practice`, `npm run lint`, `npm run typecheck`, `npx prettier --check lib/quiz/practiceFlow.ts scripts/practice-flow.test.js`, `git diff --check` |
| CNT1 | `q010` natural-resources question is UHR-traceable and exported | CONTENT | accepted | `data/questions.ts`, `content/question-bank.csv`; manager verified UHR PDF `Naturresurser` source, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run typecheck`, `git diff --check` |
| CNT2 | `q032` secret-ballot question is UHR-traceable and exported | CONTENT | accepted | `data/additionalQuestions.ts`, `content/question-bank.csv`; manager verified UHR PDF `Så här går det till att rösta` source, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run test:ownership`, `git diff --check` |
| CNT3 | `q033` political-parties question is UHR-traceable and exported | CONTENT | accepted | `data/additionalQuestions.ts`, `content/question-bank.csv`; manager verified UHR PDF `Politiska partier` source, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run test:ownership`, `npx prettier --check data/additionalQuestions.ts`, `git diff --check` |
| CNT4 | `q034` proportional-elections question is UHR-traceable and exported | CONTENT | accepted | `data/additionalQuestions.ts`, `content/question-bank.csv`; manager verified UHR PDF `Proportionella val` source, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, q034/source-count assertion, `git diff --check` |
| CNT5 | `q035` Riksdag four-percent threshold question is UHR-traceable and exported | CONTENT | accepted | `data/additionalQuestions.ts`, `content/question-bank.csv`; manager verified UHR PDF `Proportionella val` source, HEAD artifact, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run typecheck`, `npm run test:ownership` |
| CNT6 | `q036` four-constitutional-laws question is UHR-traceable and exported | CONTENT | accepted | `data/additionalQuestions.ts`, `content/question-bank.csv`; manager verified UHR PDF `Grundlagarna` source, HEAD artifact, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run typecheck`, `npm run test:ownership` |
| CNT7 | `q037` regeringsformen/public-power question is UHR-traceable and exported | CONTENT | accepted | `data/additionalQuestions.ts`, `content/question-bank.csv`; manager verified UHR PDF `Regeringsformen` source, HEAD artifact, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run typecheck`, `npm run test:ownership`, q037/export assertion |
| DI4 | Runtime schema validation rejects malformed published questions and duplicate tags | DATA-INTEGRITY | accepted | `scripts/validate-content.js`, `scripts/content-production.test.js`, `lib/content/derivedQuestions.ts`, `scripts/derived-content.test.js`; manager verified `npm run validate:content`, `npm run test:content`, `npm run test:derived-content`, `npm run typecheck`, `node scripts/export-question-bank.js --check`, `git diff --check` |
| DI5 | UHR section-map parity is enforced against chapter metadata | DATA-INTEGRITY | accepted | `scripts/validate-content.js`, `scripts/content-production.test.js`; pane 4 handoff in `docs/parallel-sessions/journals/data-integrity.md`; manager verified 13 UHR map chapters, 110 sections, 500 references via `npm run validate:content` and `npm run test:content` |
| DI6 | Source-to-generated question export parity is enforced | DATA-INTEGRITY | accepted | `scripts/validate-content.js`, `scripts/content-production.test.js`; manager verified `generationParityValidated:true` in HEAD, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run typecheck`, `npm run test:ownership` |
| DI7 | Question `chapterId` parity is enforced against UHR reference chapter mapping | DATA-INTEGRITY | accepted | `scripts/validate-content.js`, `scripts/content-production.test.js`, `tests/content-uhr-chapter-parity.test.js`; manager verified 500 `questionChapterReferenceParityValidated`, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run typecheck`, `npm run test:ownership` |
| DI8 | Authored source questions stay reviewed and publish without source-field drift | DATA-INTEGRITY | accepted | `scripts/validate-content.js`, `scripts/content-production.test.js`, `tests/content-authored-source-parity.test.js`; manager verified 100 `authoredSourceQuestionsValidated` and 100 `sourcePublicationParityValidated`, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run typecheck`, `npm run test:ownership` |
| DI9 | Published question answer-option labels are unique per language | DATA-INTEGRITY | accepted | `scripts/validate-content.js`, `scripts/content-production.test.js`; pane 4 handoff in `docs/parallel-sessions/journals/data-integrity.md`; manager verified 500 `questionOptionTextLabelsValidated`, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run typecheck`, `npm run test:ownership`, `npx prettier --check scripts/validate-content.js scripts/content-production.test.js`, `git diff --check` |
| DI10 | Published question option counts match question type | DATA-INTEGRITY | accepted | `lib/content/derivedQuestions.ts`, `scripts/validate-content.js`, `scripts/content-production.test.js`, `scripts/derived-content.test.js`; pane 4 handoff in `docs/parallel-sessions/journals/data-integrity.md`; manager verified 500 `questionTypeOptionCountsValidated`, `npm run validate:content`, `npm run test:content`, `npm run test:derived-content`, `node scripts/export-question-bank.js --check`, `npm run typecheck`, `npm run test:ownership`, direct shape check `single_choice:4`/`true_false:2`, `git diff --check` |
| ADS1 | Env-driven ad unit selection and remove-ads entitlement split replace fail-closed ad gate | SETUP | accepted | `lib/monetization/ads.ts`, `lib/monetization/premium.ts`, `scripts/monetization.test.js`; manager verified `npm run test:monetization`, `npm run typecheck`, `npm run lint`, targeted Prettier, `git diff --check`; reviewer still blocks global `/exam` launch-ad overlay |
| ADS2 | Global launch popup ad is suppressed on `/exam` routes | SETUP | accepted | `app/_layout.tsx`, `scripts/monetization.test.js`; manager verified `npm run test:monetization`, `CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform web --output-dir dist-web --max-workers 2`, and inline Playwright `/exam` smoke with mock exam visible, launch sponsor/Google AdMob/close controls absent, console errors 0 |
| IAP1 | Remove Ads IAP wrapper with secure persisted `adsDisabled` | SETUP | accepted | `lib/monetization/purchases.ts`, `app.json`, `package.json`, `scripts/monetization.test.js`; manager verified `npm run test:monetization`, `npm run typecheck`, `npm run lint`, `npx prettier --check app/_layout.tsx lib/monetization/purchases.ts scripts/monetization.test.js`, `CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform web --output-dir dist-web --max-workers 2`, and `rg -n "REMOVE_ADS_VERIFIER_TOKEN|remove\\.\\?ads" lib/monetization/purchases.ts scripts/monetization.test.js` found no matches |
| UNIT1 | Answer validation has a focused unit test and npm script wiring | UNIT | accepted | `scripts/answer-validation.test.js`, `package.json`; manager verified `npm run test:answer-validation` and package scripts include it in `npm test` |
| E2E1 | Mock exam submit/review E2E spec | E2E | blocked | Not accepted: local official Playwright browser cache is missing; only fallback/system-Chrome evidence exists, which is not acceptance-grade for this row |
| E2E2 | Learn chapter navigation E2E spec | E2E | blocked | Not accepted: `app/chapter/[chapterId].tsx` lacks `Start quiz for Landet Sverige`; `CI=1 timeout 120s npm run test:e2e -- tests/e2e/learn-chapter-navigation.spec.ts --workers=1` also fails on missing Playwright browser cache |

## Artifact ledger

| Artifact | Producer | Consumer / verifier | Status | Path / command |
|---|---|---|---|---|
| `package.json` | SETUP | VALIDATOR | accepted | `/package.json`, `npm ci`, `npm run typecheck` |
| `app/` scaffold | SETUP | VALIDATOR | accepted | `find app -maxdepth 3 -type f` |
| `components/` scaffold | SETUP | VALIDATOR | accepted | `find components -maxdepth 3 -type f` |
| `types/content.ts` | CONTENT | VALIDATOR | accepted | `types/content.ts`, `npm run typecheck` |
| `data/chapters.ts` | CONTENT | VALIDATOR | accepted | 13 records validated |
| `data/questions.ts` | CONTENT | VALIDATOR, DEBUG | accepted | 20 questions validated |
| `app/(tabs)/practice.tsx` | SETUP | VALIDATOR | accepted | Expo web/Playwright `/practice` |

## Version / PR train

See `docs/parallel-sessions/VERSION_BOARD.md` for full detail.

| Field | Value |
|---|---|
| Base branch | `main` |
| Batch branch | `batch/2026-05-15-foundation` |
| Review-facing PR policy | one PR for the accepted Batch 0 |
| Separate PR exceptions | none |

## Role roster

| Lane | Role type | Manager / escalation | Decision rights | Primary output | Status |
|---|---|---|---|---|---|
| GM | fixed-executive | operator (user via bridge) | direction, staffing, priorities, escalations | TEAM_PLAN direction, staffing ledger, escalations | active |
| VALIDATOR | fixed-management | GM | acceptance, queues, leases, worker next steps | accepted checklist rows, next prompts, VERSION_BOARD | active |
| DEBUG | fixed-quality | VALIDATOR | code-quality in leased slice | small fix or review note | on-call |
| SETUP | specified-worker | VALIDATOR | Expo scaffold + app screens in `app/`, `components/`, `lib/` | working Expo skeleton | queued |
| CONTENT | specified-worker | VALIDATOR | TypeScript types + data in `types/`, `data/` | content.ts, chapters.ts, questions.ts | queued |

## Staffing ledger

GM owns this table. Every decision must cite demand, capacity, and command used.

| Time | Decision | Demand signal | Resource signal | Manager readiness | Command | Status |
|---|---|---|---|---|---|---|
| 2026-05-15 10:00Z | hold — GM-only boot | Batch 0 not started; no queued work verified yet | local mac-mini, 16 GB RAM, 8 panes max | VALIDATOR ready | `csup gm-start civic-test --host=mac-mini --apply` | open |
| 2026-05-15 09:29Z | staff-up desired, blocked by host config | 7 queued tasks (`gm` 1, `setup` 3, `content` 3), blockers 0, acceptance A1-A8 open | SLURM job `civic-csup` on `cn069`, 20 allocated CPUs/32G job memory; current pane cap 1, actual session `civic-test-station-1` has CEO pane only; project host `civic-lunarc` is not a configured SLURM station for `csup staff` | Managers are planned but not running in this station; do not dispatch workers until GM/VALIDATOR are active | `csup staff --dry-run`; `csup staff --apply` | blocked: both returned `STAFF-UP ...` then `HOLD ... reason=lunarc_requires_slurm_station` |

| 2026-05-15 09:38Z | hold — staff-up attempted but station unreachable | 10 queued /goal items before blocker queue update (ceo 1, gm 2, validator 1, setup 3, content 3, open 0, blockers 0); all A1-A8 acceptance rows remain open. After queuing B3, blockers=1. | current node cn062 has 250Gi RAM total/236Gi available, fs10 245T free, root 53G free, load avg about 3.38/2.18/10.91; csup target host ng-meta-lunarc/lunarc is unreachable and no station capacity is available. | Manager lanes are queued but not reachable/running; workers must wait for active GM/VALIDATOR and leases | `csup staff --scenario=resume --dry-run`; `csup staff --scenario=resume --apply`; `docs/parallel-sessions/staffing-cycle-2026-05-15T0940Z.md` | blocked: STAFF-UP sized 1 session/5 workers, then HOLD login_unreachable/no_station_capacity |

| 2026-05-15 09:51Z | hold — staff-up still blocked by station capacity | 13 queued `/goal` items (ceo 1, gm 3, validator 2, setup 3, content 3, blockers 1, open 0); A1-A8 all open; live civic session has CEO pane only | cn062 SLURM job `AI-factory-csup-b` running; `civic-lunarc` reports up on job 3067596; 250Gi RAM total/235Gi available, fs10 245T free, root 53G free, load avg about 3.47/4.09/7.02 | Manager/worker lanes remain not running; dispatch must wait for reachable station/session capacity | `csup staff --scenario=resume --dry-run`; `csup staff --scenario=resume --apply`; `docs/parallel-sessions/staffing-cycle-2026-05-15T0951Z.md` | blocked: both returned `STAFF-UP` for 1 session/5 workers, then `HOLD reason=login_unreachable` and `HOLD reason=no_station_capacity` |

## Lane and lease table

| Lane | Host | Role | Branch | Writable scope | Status |
|---|---|---|---|---|---|
| GM | mac-mini | fixed-executive | main | `docs/parallel-sessions/TEAM_PLAN.md` (direction rows), `codex-tasks/gm.txt`, `docs/parallel-sessions/journals/gm.md` | active |
| VALIDATOR | mac-mini | fixed-management | main | `docs/parallel-sessions/TEAM_PLAN.md` (acceptance rows), `docs/parallel-sessions/meeting_sheet.md`, `docs/parallel-sessions/VERSION_BOARD.md`, `codex-tasks/` | active |
| DEBUG | mac-mini | fixed-quality | main or assigned | one reviewed slice + adjacent tests | on-call |
| SETUP | mac-mini/LUNARC then local sync | specified-worker | `batch/2026-05-15-foundation` | `app/`, `components/`, `lib/`, `package.json`, `app.json`, `tsconfig.json`, `docs/parallel-sessions/journals/setup.md` | completed |
| CONTENT | mac-mini/LUNARC then local sync | specified-worker | `batch/2026-05-15-foundation` | `types/`, `data/`, `docs/parallel-sessions/journals/content.md` | completed |

## Communication and write-lock table

| Lock ID | File / scope | Owner | Purpose | Status |
|---|---|---|---|---|
| — | — | — | no active locks | — |

Communication surfaces:
- `docs/parallel-sessions/meeting_sheet.md` — cross-lane questions and flags
- `docs/parallel-sessions/journals/<lane>.md` — append-only per-lane journals
- `docs/parallel-sessions/journals/gm.md` — GM reflection + staffing decisions

## Queue policy

- `codex-tasks/gm.txt` — GM-only executive decisions and escalations
- `codex-tasks/validator.txt` — VALIDATOR manager actions and acceptance/lease updates
- `codex-tasks/blockers.txt` — shared blockers (priority over all other work)
- `codex-tasks/open.txt` — generic tasks any dynamic worker can take
- `codex-tasks/setup.txt` — SETUP lane tasks
- `codex-tasks/content.txt` — CONTENT lane tasks
- `codex-tasks/ceo-inbox.txt` — operator → CEO direction queue
- `codex-tasks/uiux-manager.txt` / `uiux-design-tokens.txt` / `uiux-components.txt` / `uiux-screens.txt` / `uiux-motion-a11y.txt` — UI/UX team queues

## Active parallel batches

| Batch | Board | Status | Notes |
|---|---|---|---|
| UIUX-Batch-1 | `docs/parallel-sessions/UIUX_BOARD.md` | accepted to launch (2026-05-15) | 5-pane UI/UX team (MANAGER-uiux + DESIGN-TOKENS + COMPONENTS + SCREENS + MOTION-A11Y) on host `civic-team-uiux-lunarc`. Preconditions met: `DESIGN.md` present, `UIUX_BOARD.md` authored, all 5 lane md files present, queue files seeded. While active, build SETUP lane lease tightens (no writes to `components/`, `app/`, `lib/theme/`, `lib/motion/`, `lib/a11y/`). |

## Decisions and blockers

| ID | Item | Type | Impact | Next action | Owner | Status |
|---|---|---|---|---|---|---|
| B1 | Final app name not decided | type=approval | App Store metadata placeholder only; no blocking on code | User to decide; working name "Sweden Citizenship Test Prep" for now | operator | open |
| B2 | AdMob account not created | type=external | Blocks Phase 8 ads only; not Batch 0 | Deferred to Phase 8 | operator | deferred |
| B3 | `csup staff` could not reliably keep manager/worker panes running for the civic station (`civic-lunarc`) | type=infra | No longer blocks Batch 0 artifacts; remote worker outputs were synced back and verified locally | Keep future supervisor work on a configured station or local lane; current Batch 0 is locally verified | CEO/operator | resolved |

## GM / manager audit log

```
2026-05-15 14:05Z operator/validator: Synced remote Batch 0 artifacts to local checkout, fixed local dependency lock/runtime gaps, added required question-screen disclaimer, verified `npm ci`, `npm run typecheck`, content counts, Expo Metro smoke, and Expo web Practice UI with Playwright. A1-A8 accepted; B3 resolved for Batch 0.
2026-05-17 08:22Z manager-build: Accepted DI10 after the DATA-INTEGRITY handoff landed and manager checks passed: 500 `questionTypeOptionCountsValidated`, derived-content 2/2, content 4/4, export parity, typecheck, ownership, Prettier, direct option-count shape check, and `git diff --check`.
2026-05-17 08:21Z manager-build: Accepted only completed, manager-verified atoms from pane handoffs: APP2, CNT7, DI9. Left the newer type-specific option-count edits unaccepted because the DATA-INTEGRITY worker was still writing/verifying them. E2E1/E2E2 remain blocked on official Playwright cache and missing learn chapter quiz-entry control.
2026-05-17 08:17Z manager-build: Accepted only verified stable atoms from panes after manager-side checks: CNT5-CNT6, DI6-DI8, ADS2, IAP1. Left active q037/content and option-label schema edits unaccepted because they were still dirty/in-progress. E2E1/E2E2 remain blocked on official Playwright cache and missing learn chapter quiz-entry control.
2026-05-17 08:04Z manager-build: Accepted only verified atoms from active panes: CNT1-CNT4, DI4-DI5, ADS1, UNIT1. Blocked E2E1/E2E2 instead of accepting because official Playwright cache is missing and Learn chapter quiz-entry control is absent. SETUP IAP work was still in flight and not accepted in this pass.
2026-05-15 10:00Z gm: Batch 0 bootstrap. Two worker lanes (SETUP + CONTENT), disjoint write scopes. GM boots first via csup gm-start.
2026-05-15 10:30Z operator: Updated all factory docs to match updated codex-supervisor system.
2026-05-15 09:29Z ceo: Executive staffing cycle complete. Read CEO/company/AI-factory/staffing docs and TEAM_PLAN. Workload is 7 queued tasks and no shared blockers. Node resources are adequate in memory/disk but current station has only one CEO pane and `csup staff --apply` held with `reason=lunarc_requires_slurm_station`; B3 records the infra blocker. Manager update sent via meeting_sheet and queues.
2026-05-15 09:38Z ceo: Refreshed staffing cycle. Read CEO/company/AI-factory/staffing docs plus local plans/queues. Assessed workload/resources: 10 queued goals, A1-A8 open, cn062 has ample RAM/disk. `csup staff` dry-run/apply both STAFF-UP to 1 session/5 workers but HOLD with login_unreachable/no_station_capacity. Queued B3 blocker plus CEO/GM/VALIDATOR updates; worker dispatch remains held. Evidence transcript: `docs/parallel-sessions/staffing-cycle-2026-05-15T0940Z.md`.
2026-05-15 09:51Z ceo: Executive staffing cycle refreshed. Required docs read; project-local CEO support docs are absent so supervisor copies were used. Workload: 13 queued goals including B3 blocker, A1-A8 open, one live civic CEO pane. Resources: cn062 has ample RAM/disk and `civic-lunarc` reports up on SLURM job 3067596. `csup staff --scenario=resume --dry-run` and `--apply` both STAFF-UP to 1 session/5 workers but HOLD with login_unreachable/no_station_capacity. Decision: hold worker dispatch; manager updates queued. Evidence transcript: `docs/parallel-sessions/staffing-cycle-2026-05-15T0951Z.md`.
```

## Worker handoff format

```
Lane:
Host/branch:
Task/checklist item:
Artifacts changed:
Verification:
Blocked? yes/no — reason
Next suggested validator action:
```
