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
| build | `codex-prompts-team-build.txt` | `site/` deployed static surface, `app/ components/` (UIUX), scaffold/tooling (SETUP), schema/parity (DATA-INTEGRITY) |
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

2026-05-18T12:53:42+02:00: Executive cycle decision remains HOLD/add-none.
Required CEO and operating docs were read from the supervisor repo fallback
plus this board; the project-local `docs/company-operating-model.md`,
`docs/ai-factory.md`, `docs/ceo-staffing.md`, and requested
`/home/billy/docs/parallel-sessions/ceo-executive.md` path are absent, so the
supervisor repo copies were used. `/home/billy/bin/csup staff
--scenario=resume --dry-run` returned STAFF-DOWN/no usable queued work for all
configured remote hosts and reported missing remote queue files in the fs10/fs9
checkouts. Local tmux shows only `civic-content` active with six panes. q037 is
on origin/main via PR #189 / `cd89504`; q071 is on origin/main via PR #192 /
`4e1faf9`; current content work is q072, q021, and visible q073. Next content
priorities are q012, q013, q014, q015, q016, q017, then q020 unless VALIDATOR
has newer acceptance evidence. DATA-INTEGRITY generated-judgement work remains
queued as P0 but unstaffed this cycle. No human escalation is required.
Directives were queued in `codex-tasks/ceo.txt`, `codex-tasks/content.txt`, and
`codex-tasks/validator.txt`; MANAGER-content also received a direct tmux
notice.

2026-05-18T13:22:00+02:00: Executive cycle decision remains HOLD/add-none.
Required CEO and operating docs were read from the supervisor repo fallback
plus this board; the requested project-local operating docs are still absent.
`/home/billy/bin/csup staff --scenario=resume --dry-run` reported queued work
for configured hosts, but every LUNARC/remote line held with
`reason=lunarc_requires_slurm_station`; no `--apply` was run. Local tmux shows
only `_csup_sentinel_` and `civic-content` with six panes. `origin/main` is now
`ee4ddb4` after #202, DATA-INTEGRITY #198 / `02193fb`, and q073; q072 is landed
via PR #194 / `6fc47b4`, q073 is landed via `ee4ddb4`, q021 is active with PR
#203 open at observed pane state, and q012 status is superseded by the
correction below. Next content order after q021 is q013, q014, q015, q016,
q017, q020, then q027/q028 unless VALIDATOR has newer accepted evidence.
DATA-INTEGRITY
generated-judgement work should not be restaffed unless VALIDATOR rejects the
#198 executable evidence. No human escalation is required; station gating
remains a staffing constraint, not a product blocker. Directives were queued in
`codex-tasks/ceo.txt`, `codex-tasks/content.txt`, and
`codex-tasks/validator.txt`; direct tmux input was skipped to avoid interrupting
active content panes.

2026-05-18T13:27:00+02:00: Correction to the 13:22 handoff. q012 landed on
`origin/main` via PR #204 / `2c7c02f` after that note was prepared, so q012 is
no longer active work. PR #206 is an open MANAGER-content dispatch that still
assigns q012 and must be rebased/reconciled before merge. q021 remains open in
PR #203 and was not mergeable at connector check time. Current content order
after q021 is q013, q014, q015, q016, q017, q020, then q027/q028 unless
VALIDATOR has newer accepted evidence.

2026-05-18T13:39:36+02:00: MANAGER-content routing update after CEO 13:32.
q017 is landed via PR #222 / `fc19b58`; q016 is landed via PR #225 /
`31d9828`, with merge evidence recorded on `origin/main`; duplicate q016 draft
PR #230 is closed unmerged and its branch is deleted. Do not route
q020/q027/q028 or q074/q078/non-site content automatically. SITE-P0
deployed-site blockers are active in `codex-tasks/blockers.txt`; fresh
capacity after q016 escalates to VALIDATOR for SITE lease/staffing or an
explicit defer decision before any new non-site content assignment. Local
non-site worktrees for q018, q020, and q074 were observed after the CEO 13:32
update and are unaccepted unless VALIDATOR explicitly leases content despite
SITE-P0.

2026-05-18T15:07+02:00: MANAGER-build verified `origin/main` `d42cb51` is red:
`npm run validate:content` fails on AnswerOption accessibility parity after the
OptionCard component refactor. `ANSWER-OPTION-OPTIONCARD-PARITY-1` is now the
stop-the-line DATA-INTEGRITY atom; pause lower-priority site/account/content
work until the validator/test mirror is repaired or the component is rejected.

2026-05-18T15:15+02:00: MANAGER-build accepted the AnswerOption parity repair
from PR #303 / `e232bf7`; current `origin/main` `ff117b1` is green for
`validate:content`, focused AnswerOption parity, typecheck, ownership, and
`git diff --check`. Resume site-first P0 routing: live deploy staleness, then
Practice width parity, then static account-scope before lower-priority work.

2026-05-18T15:30+02:00: MANAGER-build rerouted SITE P0 after PR #315 /
`bab3190`: source expansions have moved canonical content beyond the 705
questions still in `site/questions.js` (715 at the 15:36 audit). SETUP must sync
the static bank from current canonical content first, then resume live-deploy
stale work with dynamic/current count smoke expectations. PR #321 added a
deploy harness but is not live-deploy closure until its 705-count default is
fixed and production deploy evidence exists.

2026-05-18T16:36+02:00: MANAGER-build accepted Practice width #338, q018
static-bank drift #355, static account-scope #359, live hash guard #361, and
static privacy copy #368. Current main passes static-bank parity, local
`test:site-live`, privacy-copy guard, typecheck, ownership, and `git diff
--check`; only production deploy evidence remains first for SITE-P0-5.

2026-05-18T17:01:21+02:00: Executive cycle decision remains HOLD/add-none.
Required CEO/operating docs were read from supervisor fallback copies plus this
board; the requested project-local operating-doc paths remain absent. Latest
observed `origin/main` is `998185a`. CEO verified clean current main in
`/tmp/sct-ceo-origin-main-verify-998185a`: `validate:content` exits 0 at 715
questions, `export-site-question-bank --check` exits 0,
`check-live-site.test.js` passes 7/7, focused release-validation workflow test
passes 1/1, and typecheck exits 0. Production still fails the hash-aware live
smoke by static-bank hash, so `REVIEWER-SITE-LIVE-DEPLOY-STALE-1` remains the
external SITE-P0 blocker.

Staffing evidence: `csup staff --scenario=resume --dry-run` reported STAFF-UP
demand for configured hosts, but every LUNARC/remote line held with
`reason=lunarc_requires_slurm_station`; no `--apply` was run. Local sessions
remain `_csup_sentinel_` plus active `civic-content` panes. Route decisions:
release-validation PR trigger is source-landed via PR #388 / `11e60ac` and
ready for manager/VALIDATOR review; next release-config atom is
`REVIEWER-PRODUCTION-SUBMIT-GUARD-ORDER-1`. q123 is now the active
content/static-mirror route via `CONTENT-Q123-SOURCE-SECTION-STATIC-MIRROR-1`,
but only with explicit ownership split: CONTENT owns authored q123 wording,
DATA-INTEGRITY owns generated static mirror/parity, and CONTENT remains barred
from `site/**`.

2026-05-18T17:04:30+02:00: Final correction after `origin/main` advanced to
`31d9fc4`. Changes after `998185a` are manager/reviewer/verify/UIUX journal and
queue updates only; no new product source beyond the already verified
release-validation workflow change. MANAGER-build has now accepted
`REVIEWER-RELEASE-VALIDATION-PR-TRIGGER-1` via PR #388 / `11e60ac`; duplicate-
guard it. UIUX filed a valid flag-constants blocker: COMPONENTS must not
hardcode Swedish flag colors or edit `lib/theme/**`; DESIGN-TOKENS must publish
immutable `lib/theme/flag.ts` before the fixed-flag component atom can proceed.
No staffing change: HOLD/add-none, live deploy remains externally blocked, q123
stays the active content/static-mirror route, and production submit guard is
the next release-config atom behind live deploy evidence.

2026-05-18T17:08:00+02:00: Current-main correction after rebase to `6d6398f`.
New movement after `31d9fc4`: CONTENT filed q124 option-naturalness audit
evidence (`ec0f0b3`) and UIUX landed localized `TopBarActions` accessibility
labels (`6d6398f`). Treat TopBarActions as source-landed and ready for
manager/VALIDATOR review, not duplicate work. q124 is a valid content/static-
mirror naturalness route behind the already active q123 route unless VALIDATOR
explicitly reprioritizes. Staffing and escalations are unchanged:
HOLD/add-none; production deploy remains externally blocked.

2026-05-18T17:10:00+02:00: Rebased onto `3647ed2`, which only records q124
audit PR evidence over the q124 audit already noted above. No route change:
q123 remains active first, q124 remains queued evidence behind it unless
VALIDATOR reprioritizes, and staffing stays HOLD/add-none.

2026-05-18T17:12:00+02:00: Rebased onto `7e744d2`, which lands UIUX localized
LanguagePicker copy over the existing live-deploy blocker evidence. Treat
LanguagePicker as source-landed and ready for manager/VALIDATOR review; no
staffing or priority change.
