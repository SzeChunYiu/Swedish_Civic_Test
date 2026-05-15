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

## Decisions and blockers

| ID | Item | Type | Impact | Next action | Owner | Status |
|---|---|---|---|---|---|---|
| B1 | Final app name not decided | type=approval | App Store metadata placeholder only; no blocking on code | User to decide; working name "Sweden Citizenship Test Prep" for now | operator | open |
| B2 | AdMob account not created | type=external | Blocks Phase 8 ads only; not Batch 0 | Deferred to Phase 8 | operator | deferred |
| B3 | `csup staff` could not reliably keep manager/worker panes running for the civic station (`civic-lunarc`) | type=infra | No longer blocks Batch 0 artifacts; remote worker outputs were synced back and verified locally | Keep future supervisor work on a configured station or local lane; current Batch 0 is locally verified | CEO/operator | resolved |

## GM / manager audit log

```
2026-05-15 14:05Z operator/validator: Synced remote Batch 0 artifacts to local checkout, fixed local dependency lock/runtime gaps, added required question-screen disclaimer, verified `npm ci`, `npm run typecheck`, content counts, Expo Metro smoke, and Expo web Practice UI with Playwright. A1-A8 accepted; B3 resolved for Batch 0.
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
