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
| A1 | GM confirms team roster, lane leases, and batch outcome before workers start | GM | VALIDATOR | open | this file |
| A2 | Expo TypeScript project created (`package.json` exists, TypeScript compiles) | SETUP | VALIDATOR | open | `npx tsc --noEmit` |
| A3 | Full folder structure matches `docs/architecture.md` (`app/`, `components/`, `data/`, `lib/`, `types/`) | SETUP | VALIDATOR | open | `ls -R app/ components/ data/ lib/ types/` |
| A4 | `types/content.ts` defines Chapter, PracticeQuestion, UHRReference — all compile | CONTENT | VALIDATOR | open | `npx tsc --noEmit` |
| A5 | 13 chapter records in `data/chapters.ts` | CONTENT | VALIDATOR | open | `cat data/chapters.ts` |
| A6 | 20 sample questions in `data/questions.ts` (10 ch01, 10 ch02), all `reviewStatus:"reviewed"` | CONTENT | VALIDATOR, DEBUG | open | `npx tsc --noEmit` + question count |
| A7 | Basic quiz screen in `app/(tabs)/practice.tsx` loads questions and shows answer options | SETUP | VALIDATOR | open | Expo Go on simulator |
| A8 | VALIDATOR signs off all acceptance rows | VALIDATOR | GM | open | this file |

Statuses: `open` `in_progress` `accepted` `rejected` `blocked`

## Artifact ledger

| Artifact | Producer | Consumer / verifier | Status | Path / command |
|---|---|---|---|---|
| `package.json` | SETUP | VALIDATOR | open | `/package.json` |
| `app/` scaffold | SETUP | VALIDATOR | open | `ls app/` |
| `components/` scaffold | SETUP | VALIDATOR | open | `ls components/` |
| `types/content.ts` | CONTENT | VALIDATOR | open | `types/content.ts` |
| `data/chapters.ts` | CONTENT | VALIDATOR | open | `data/chapters.ts` |
| `data/questions.ts` | CONTENT | VALIDATOR, DEBUG | open | `data/questions.ts` |
| `app/(tabs)/practice.tsx` | SETUP | VALIDATOR | open | `app/(tabs)/practice.tsx` |

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

## Lane and lease table

| Lane | Host | Role | Branch | Writable scope | Status |
|---|---|---|---|---|---|
| GM | mac-mini | fixed-executive | main | `docs/parallel-sessions/TEAM_PLAN.md` (direction rows), `codex-tasks/gm.txt`, `docs/parallel-sessions/journals/gm.md` | active |
| VALIDATOR | mac-mini | fixed-management | main | `docs/parallel-sessions/TEAM_PLAN.md` (acceptance rows), `docs/parallel-sessions/meeting_sheet.md`, `docs/parallel-sessions/VERSION_BOARD.md`, `codex-tasks/` | active |
| DEBUG | mac-mini | fixed-quality | main or assigned | one reviewed slice + adjacent tests | on-call |
| SETUP | mac-mini | specified-worker | `batch/2026-05-15-foundation` | `app/`, `components/`, `lib/`, `package.json`, `app.json`, `tsconfig.json`, `docs/parallel-sessions/journals/setup.md` | queued |
| CONTENT | mac-mini | specified-worker | `batch/2026-05-15-foundation` | `types/`, `data/`, `docs/parallel-sessions/journals/content.md` | queued |

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
- `codex-tasks/blockers.txt` — shared blockers (priority over all other work)
- `codex-tasks/open.txt` — generic tasks any dynamic worker can take
- `codex-tasks/setup.txt` — SETUP lane tasks
- `codex-tasks/content.txt` — CONTENT lane tasks

## Decisions and blockers

| ID | Item | Type | Impact | Next action | Owner | Status |
|---|---|---|---|---|---|---|
| B1 | Final app name not decided | type=approval | App Store metadata placeholder only; no blocking on code | User to decide; working name "Sweden Citizenship Test Prep" for now | operator | open |
| B2 | AdMob account not created | type=external | Blocks Phase 8 ads only; not Batch 0 | Deferred to Phase 8 | operator | deferred |

## GM / manager audit log

```
2026-05-15 10:00Z gm: Batch 0 bootstrap. Two worker lanes (SETUP + CONTENT), disjoint write scopes. GM boots first via csup gm-start.
2026-05-15 10:30Z operator: Updated all factory docs to match updated codex-supervisor system.
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
