# AI Factory acceptance board — Sweden Citizenship Test Prep

This board is the codex-supervisor company/factory control surface for the
running civic-test sessions. It is a **stable, bounded** board: the acceptance
checklist, role ownership, leases, and queue policy. It defines what acceptance
means — it is **not** an append-only log.

> **Hard rule — keep this file lean (≤ ~200 lines).**
> Per-iteration manager accept-logs, validator audit prose, and staffing-cycle
> transcripts do **NOT** go in this file. They go in
> `codex-tasks/logs/<session>-YYYY-MM-DD.md`. Appending accept-prose here is
> what previously grew it to 318 KB and starved every worker's context.
> Full historical log: `docs/parallel-sessions/archive/TEAM_PLAN_FULL_2026-05-18.md`.

## Batch outcome

Running civic-test panes converge on one outcome: a shippable Expo + React
Native + TypeScript citizenship-prep app whose scaffold, content, UI/UX,
data-integrity, QA, and release artifacts are accepted against this checklist
and the lane specs, with `npm run typecheck` clean and no cross-lane ownership
conflicts. Every accepted unit of work lands on `main` as a squash-merged PR
(see `docs/parallel-sessions.md` — PR-per-unit git loop).

## Acceptance checklist

| ID | Requirement / acceptance check | DRI | Status | Evidence |
|---|---|---|---|---|
| A1 | GM confirms team roster, lane leases, and batch outcome before workers start | GM | accepted | role roster + lane/lease table below; disjoint lane scopes |
| A2 | Expo TypeScript project created (`package.json`, TypeScript compiles) | SETUP | accepted | `package.json`; `npm ci`; `npm run typecheck` exit 0 |
| A3 | Folder structure matches `docs/architecture.md` (`app/ components/ data/ lib/ types/`) | SETUP | accepted | scaffold present; `npm run typecheck` exit 0 |
| A4 | `types/content.ts` defines Chapter, PracticeQuestion, UHRReference; all compile | CONTENT | accepted | `types/content.ts`; typecheck exit 0 |
| A5 | 13 chapter records in `data/chapters.ts` | CONTENT | accepted | `ch01`-`ch13` records load |
| A6 | UHR-based questions in `data/questions.ts`, all `reviewStatus:"reviewed"` | CONTENT | accepted | content/export validators pass |
| A7 | Quiz screen `app/(tabs)/practice.tsx` loads questions + answer options | SETUP | accepted | Expo web `/practice` render proof |
| A8 | VALIDATOR signs off acceptance rows; ongoing work tracked in queues | VALIDATOR | in_progress | rolling — accept-logs in `codex-tasks/logs/` |

Statuses: `open` `in_progress` `accepted` `rejected` `blocked`.
Detailed product ledger and per-question acceptance history: the archive file
above and `codex-tasks/` queues — not this board.

## Role roster

| Lane/session | Role type | Manager / escalation | Decision rights | Primary outputs |
|---|---|---|---|---|
| CEO (`codex-prompts-meta`) | fixed-executive | operator | direction, staffing, scope protection | priorities, blocker→atom conversion |
| VALIDATOR / MANAGER-* | fixed-management | CEO | acceptance, leases, worker next steps | accepted rows, queue items |
| REVIEWER / E2E | fixed-quality | MANAGER | one functional/persona pass | queued product defects |
| build/content/uiux/qa/release workers | dynamic-worker | MANAGER then VALIDATOR | one assigned atom inside lane lease | squash-merged PR + handoff |

Role types: `fixed-executive`, `fixed-management`, `fixed-quality`,
`dynamic-worker`.

## Lane and lease table

| Lane group | Session (prompts file) | Writable scope |
|---|---|---|
| meta/CEO | `codex-prompts-meta.txt` | priorities, queues, scope protection (no product code) |
| build | `codex-prompts-team-build.txt` | `app/ components/` (UIUX), scaffold/tooling (SETUP), schema/parity (DATA-INTEGRITY) |
| uiux | `codex-prompts-team-uiux.txt` / `-uiux-design` / `-uiux-runtime` | `lib/theme/` tokens, `components/`, screen polish, motion/a11y |
| content | `codex-prompts-civic-content.txt` | `data/` questions + chapters, UHR citations only |
| qa | `codex-prompts-civic-team-qa.txt` | `__tests__/`, e2e specs, unit tests |
| release | `codex-prompts-civic-team-release.txt` | `docs/release/`, store metadata, privacy docs |

A lane never writes outside its scope. `data/` and `content/` are owned solely
by the content session. If a lane needs another lane's file, read it, do not
modify it; raise it in `codex-tasks/blockers.txt`.

## Queue policy

- `codex-tasks/blockers.txt` — stop-the-line blockers (`docs/blocker-schema.md`); outrank all lane work.
- `codex-tasks/<session>/open.txt` — generic work a dynamic worker can take.
- `codex-tasks/<session>/worker-N.txt` — pane-specific assigned work.
- `codex-tasks/logs/<session>-YYYY-MM-DD.md` — manager accept-logs and validator audit (NOT this file).

## Worker handoff format

```text
Lane:
Host/branch:
Role type and manager:
Task / checklist item:
Changed artifacts:
Verification (commands + result):
Accepted by worker? yes/no/blocked
Next suggested validator action:
```

## CEO cycle handoff

2026-05-18T12:27:59+02:00: Executive cycle decision remains HOLD/add-none.
Required CEO and operating docs were read from the supervisor repo fallback
plus this board. `csup staff --scenario=resume --dry-run` returned
STAFF-DOWN/no queued work for configured LUNARC hosts and reported no remote
task queues in the disabled fs10/fs9 checkouts. Local tmux shows only
`civic-content` active. q008 is now on `origin/main` via PR #172; keep the
current local content team running q009/q010 as separate UHR-only
TRANSLATE-COMPLETE atoms. Next content queue is q011, q037, q071, q072, then
remaining validator-filed source-note explanations.
UIUX/release/build/qa remain unstaffed this cycle. No human escalation is
required; remote disablement remains a staffing constraint, not a product
blocker. CEO directives were queued in `codex-tasks/ceo.txt`,
`codex-tasks/content.txt`, and `codex-tasks/validator.txt`.

2026-05-18T12:43:40+02:00: Executive cycle decision remains HOLD/add-none.
Required CEO and operating docs were read from the supervisor repo fallback
plus this board. A clean `origin/main` staffing gate saw the new #186
research/verify/delight/mascot queues but held each LUNARC line with
`reason=lunarc_requires_slurm_station`; no `--apply` was run. Local tmux shows
only `civic-content` active with six panes. q010 is now on origin/main via PR
#182 / `8d6cead`, and q011 is on origin/main via PR #180 / `793ec73`. Current
content priorities are q037, q071, q072, then q021. Do not staff the new
expansion teams until VALIDATOR maps them into acceptance rows and leases; P0
TRANSLATE-COMPLETE remains the current priority. No human escalation is
required. CEO directives were queued in `codex-tasks/ceo.txt` and
`codex-tasks/validator.txt`; MANAGER-content also received a direct tmux
update.
