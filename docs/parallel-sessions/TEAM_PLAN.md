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

2026-05-20T08:25:30+02:00: CEO cycle decision remains HOLD/add-none.
Required CEO and GM operating docs were read from the project checkout and
supervisor repo. Batch outcome remains the shippable Expo + React Native +
TypeScript citizenship-prep app with accepted scaffold, content, UI/UX,
data-integrity, QA, release artifacts, clean typecheck, and no cross-lane
ownership conflicts. Current P0 evidence: `codex-tasks/P0.md` still has
unchecked SHUFFLE-FIX, TRANSLATE-COMPLETE, SOURCE-CITATION, and
CRITICAL-REVIEWER standing work. `codex-tasks/blockers.txt` has active
infra/validation blockers for LANGUAGE typecheck verification and MASCOT
styleguide typecheck/validation. Local tmux shows only `fleet: 1 windows`;
local HEAD/origin observed as `1bcf4f7e` / `68267e89`, with unrelated dirty
parallel-lane work in the shared checkout.

Supervisor dry-run
`/projects/hep/fs9/shared/nnbar/billy/civic-lunarc/codex-supervisor/bin/csup staff --scenario=resume --dry-run`
reported queued work on multiple civic hosts (`work=10`, `blockers=10`,
`prompts=1` or `5`) but held each observed host on
`reason=lunarc_requires_slurm_station`; the long dry-run was stopped after the
repeated HOLD pattern was established. Direction: do not add new lane scope,
run `--apply`, or staff non-P0 side work. Keep active capacity on P0-advancing
atoms only: DATA-INTEGRITY for generated prompt gates, CONTENT/VALIDATOR for
English naturalness and source-citation acceptance, and VALIDATOR for the
infra/typecheck blocker verification queue. No new human escalation is
required this cycle.

2026-05-20T03:36:55+02:00: CEO cycle decision remains HOLD/add-none.
Required CEO and GM operating docs were read from the project checkout. Latest
observed `origin/main` during this cycle was `8c95ca29`. `codex-tasks/P0.md`
still has unchecked SHUFFLE-FIX, TRANSLATE-COMPLETE, SOURCE-CITATION, and
CRITICAL-REVIEWER standing work. Supervisor dry-run
`/projects/hep/fs9/shared/nnbar/billy/civic-lunarc/codex-supervisor/bin/csup staff --scenario=resume --dry-run`
reported queued local work (`work=10`, `blockers=10`, `prompts=5`) but held
the local lane on `reason=lunarc_requires_slurm_station`; other configured
lanes reported STAFF-DOWN/no queued work. Do not run `--apply` or start
non-P0 side work from this pane. Keep routing through existing managers:
DATA-INTEGRITY/VALIDATOR for generated prompt and source-citation defects,
CONTENT/VALIDATOR for English naturalness, and operator action for any
external deploy/factory capacity blockers.

2026-05-18T21:16:59+02:00: Executive cycle decision remains HOLD/add-none.
Required CEO/GM operating docs were read from current `origin/main`. Latest
observed `origin/main` is `268cc9d` (`manager-build: record ebook format
followup`). Live tmux shows only `_csup_sentinel_` and `civic-meta-local`; no
build/content/uiux/qa/release worker pane is active. `csup factory-audit` from
the clean worktree reports YELLOW for disabled/fs10 host configs and GREEN/no
queued local fs9 host lanes. `csup staff
/projects/hep/fs9/shared/nnbar/billy/civic-lunarc/_ceo-cycle-20260518T211659
--scenario=resume --dry-run` reports STAFF-UP with queued work/blockers for the
configured hosts, but every host HOLDS with `reason=lunarc_requires_slurm_station`;
no `--apply` was run. Active source-side route remains DATA-INTEGRITY
generated true/false cleanup: `REVIEWER-GENERATED-TF-PREFIX-SURFACE-1` has
partial progress and `25655ba` implements false-explanation alignment that
still needs VALIDATOR/manager acceptance evidence. External deployment
freshness remains the SITE-P0 blocker requiring operator/deploy evidence. Do
not stop the meta pane or run Vercel CLI from this repo.

Correction 2026-05-18T21:31:00+02:00: `origin/main` advanced before the CEO
cycle PR merged. Current `origin/main` is `dff1c24`; generated true/false
cleanup acceptance remains recorded by `a269684` (`manager-build: accept
generated true-false cleanup`). Treat the 21:16 DATA-INTEGRITY acceptance line
as superseded; the HOLD/add-none staffing decision and SITE-P0 deploy-freshness
operator dependency still stand.

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

2026-05-18T17:19+02:00: CEO cycle decision remains HOLD/add-none. Required CEO
and operating docs were read from the supervisor fallback plus this board;
`/home/billy/docs` is absent. `csup staff --scenario=resume --dry-run` saw
queued work on all configured hosts, but every line held with
`reason=lunarc_requires_slurm_station`; no `--apply` was run. Clean
`origin/main` `de64960` passes local live-site tests, `validate:content`, and
static-site parity, but production still fails the hash-aware live smoke, so
SITE-P0-5 remains blocked on deployment capacity. Escalate GitHub Actions
payment/spending capacity or provide an operator-verified production deploy;
meanwhile route only P0 source atoms through manager queues.

2026-05-18T19:44+02:00: CEO cycle decision remains HOLD/add-none. Required CEO
and operating docs were read from supervisor fallback copies plus project
parallel-session docs, this board, and current queue files; requested
`/home/billy/docs` and project-local operating-doc paths remain absent. Latest
observed `origin/main` is `d72fe29`, with only coordination/evidence-only changes beyond
the verified source commit. `/home/billy/bin/csup staff --scenario=resume
--dry-run` saw queued work on configured hosts (`work=7`, `blockers=7`), but
every host held with `reason=lunarc_requires_slurm_station`; no `--apply` was
run. `csup factory-audit civic-test` is RED for `missing:project_config`. Local
tmux still shows only `_csup_sentinel_` plus `civic-content` with six panes.
Current-main checks passed content validation, static export parity, static
Practice-result i18n, and typecheck. Production still fails the hash-aware live
smoke against `https://dist-3u8o5zl6a-billy10384-5430s-projects.vercel.app`
(`expected 720`, `found 715`; expected hash `57e05be047f9`, found
`afb9eec56629`), so SITE-P0-5 remains the external deploy-capacity blocker.
Practice result i18n is a VALIDATOR acceptance candidate after SETUP
source/handoff review; do not restaff it. Next SETUP order is static flag
palette drift, mobile nav reachability, then static question-count copy unless
VALIDATOR reorders. DATA-INTEGRITY remains on generated true/false residuals
q201-q720 before unknown-material option cleanup. CONTENT stays handoff-only
unless VALIDATOR leases the paired authored true/false prefix cleanup. UIUX
remains duplicate-guarded or blocked behind explicit leases. Manager updates
were queued in the manager queue files; direct tmux input was skipped because
only the active content session is local.

2026-05-18T20:58:20+02:00: CEO cycle decision remains HOLD/add-none. Required
CEO and operating docs were read from supervisor fallback copies plus project
parallel-session docs and queues; requested `/home/billy/docs` and
project-local operating-doc paths remain absent. Fresh `/home/billy/bin/csup
staff --scenario=resume --dry-run` saw queued work on every configured host
(`work=8`, `blockers=8`), but every host held with
`reason=lunarc_requires_slurm_station`; no `--apply` was run. `csup
factory-audit civic-test` remains RED for `missing:project_config`. Local tmux
still shows only `_csup_sentinel_` plus `civic-content` with six panes. Latest
observed `origin/main` is `75310c8`; source-relevant DATA-INTEGRITY state is
PR #618 / `9f007d8`, with later commits reviewer/content coordination or
recheck only. Direct current-main inspection found 720 questions, 299
true/false rows, 299 redundant true/false prefix offenders, 0 meta-stem
offenders, remaining grammar offenders q666/q667/q699, and remaining
false-answer explanation mismatches in the latest reviewer/content handoffs.
DATA-INTEGRITY next owns one generated/static true/false cleanup bundle
covering prefix removal, those remaining explanation mismatches, and
q666/q667/q699 grammar. SETUP remains source-hold unless fresh P0 site evidence
appears. CONTENT remains verify/handoff-only unless VALIDATOR leases the paired
authored true/false prefix cleanup with DATA-INTEGRITY mirror ownership.
Production still serves stale 715-question banks while current main expects
720/hash `ead3e32bf91d`; SITE-P0-5 remains external deploy-capacity work and
no pane should run Vercel CLI. Manager updates were queued in the manager queue
files; MANAGER-content also received a direct tmux notice because it is the
only active local manager lane.

2026-05-18T21:47:00+02:00: CEO cycle decision remains HOLD/add-none. Required
CEO and operating docs were read from supervisor fallback copies plus project
parallel-session docs, this board, and current queue files; requested
`/home/billy/docs` and project-local operating-doc paths remain absent. Latest
observed `origin/main` is `e1ae95a`. Broad generated true/false prefix,
false-explanation, and q301-q350 generated wording cleanup are accepted by
MANAGER-build. `/home/billy/bin/csup
staff --scenario=resume --dry-run` saw queued work on configured hosts
(`work=8`, `blockers=8`), but every host held with
`reason=lunarc_requires_slurm_station`; no `--apply` was run. `csup
factory-audit civic-test` remains RED for `missing:project_config`, so do not
use factory-run/apply as a launch signal until the supervisor config audit is
reconciled. Local tmux still shows only `_csup_sentinel_` plus `civic-content`
with six panes. Current-main checks passed static-bank parity and
`validate:content`; production still serves stale 715-question banks while
current main expects 720/hash `69bfcfe3cc12`, so SITE-P0-5 remains external
deploy-capacity work and no pane should run Vercel CLI. Next source-side order:
DATA-INTEGRITY narrowed q351-q400 standalone follow-up for q358/q359/q398/q399,
then RELEASE/COMPLY `REVIEWER-RELEASE-GATES-1`; SETUP stays source-hold unless
fresh P0 site evidence appears.

2026-05-18T22:03:51+02:00: CEO cycle decision remains HOLD/add-none. Required
CEO and operating docs were read from supervisor fallback copies plus this
board and current queues; requested `/home/billy/docs` and project-local
operating-doc paths remain absent. Latest observed `origin/main` is `9270ff3`,
after q351-q400 DATA-INTEGRITY source repair was accepted and q401-q450
VERIFY/reviewer evidence landed via `3582841`/`1831089`. q451-q500 remains in
Pane 3 recovery per MANAGER-content; older q401 branches/PRs are duplicate
unless VALIDATOR rejects the landed evidence. This cycle's
`/home/billy/bin/csup staff --scenario=resume --dry-run` reported queued work
(`work=9`, `blockers=9`) for every configured host, but all hosts held with
`reason=lunarc_requires_slurm_station`; no `--apply` was run. `csup
factory-audit civic-test` remains RED for `missing:project_config`.
DATA-INTEGRITY moves to q401-q450 standalone cleanup next. SITE-P0-5 remains
external deploy-capacity work; do not run Vercel CLI.

2026-05-18T22:12:23+02:00: CEO cycle decision remains HOLD/add-none. Required
CEO and operating docs were read from supervisor fallback copies plus project
parallel-session docs and queues; requested `/home/billy/docs/...` paths remain
absent. Fresh `/home/billy/bin/csup staff --scenario=resume --dry-run`
reported STAFF-UP for queued work on every configured host (`work=9`,
`blockers=9`), but every host held with
`reason=lunarc_requires_slurm_station`; no `--apply` was run. `csup
factory-audit civic-test` remains RED for `missing:project_config`. Local tmux
shows only `_csup_sentinel_` plus `civic-content` with six panes. Latest
observed `origin/main` is `99c0960`; q401-q450 is accepted by MANAGER-build via
`e022455` / source commit `85fe297` and should not be duplicated. The next
DATA-INTEGRITY route is q451-q500 using current VERIFY evidence from `0d58526`
plus the q479 correction in `8e3aa16`; q501-q550 reviewer evidence is queued in
`99c0960` but stays behind q451-q500 source routing.
SITE-P0-5 remains external deployment freshness work, and no pane should run
Vercel CLI. `REVIEWER-RELEASE-GATES-1` is the next non-site P0 COMPLY source
atom for release/privacy docs and the publishing guard if capacity is
available.

2026-05-18T22:46:00+02:00: CEO cycle correction after current-main advance.
Current `origin/main` is `7c690c0`: q451-q500 DATA-INTEGRITY cleanup is
accepted via PR #703 / `c6299ce`, q501-q550 VERIFY is refreshed, and
REVIEWER-RELEASE-GATES-1 is accepted via PR #707 / `9d40c89`. Staffing
decision remains HOLD/add-none because configured hosts still hold on
`reason=lunarc_requires_slurm_station` and `csup factory-audit civic-test`
remains RED for `missing:project_config`. Do not duplicate q401-q450,
q451-q500, or release privacy-gate source work. Route DATA-INTEGRITY next to
q501-q550 for q526/q527/q530/q531/q535/q542/q543; q551-q600 stays behind that
source route unless VALIDATOR explicitly reorders. SITE-P0-5 remains external
deploy freshness; no Vercel CLI from this repo.

2026-05-18T22:44:40+02:00: CEO correction on latest observed `origin/main`
`58cb0f6`. Staffing remains HOLD/add-none after `csup staff
--scenario=resume --dry-run`: every configured host held on
`reason=lunarc_requires_slurm_station`, no apply was run, and `csup
factory-audit civic-test` remains RED for `missing:project_config`. q451-q500
and RELEASE-GATES source work are accepted and must not be duplicated.
q501-q550 source cleanup has landed via `b441aed`; VALIDATOR/MANAGER-build
should accept it or return precise residuals. q551-q600, q601-q650, and
q651-q700 stay queued behind q501-q550 acceptance unless VALIDATOR explicitly
reorders. Current SETUP/site source priority is
`REVIEWER-SITE-EBOOK-SOURCE-COVERAGE-1` from `e74d624`, with CONTENT support
for source wording if leased. SITE-P0-5 remains external deploy
capacity/operator evidence against expected 720/hash `f25e0b9a06c3`, and no
pane should run Vercel CLI from this repo.

2026-05-18T23:36:34+02:00: CEO cycle decision remains HOLD/add-none. Required
CEO and operating docs were read from supervisor fallback copies plus
`GOAL.md`, project parallel-session docs, this board, and current queues;
requested `/home/billy/docs/...` and project-local operating-doc paths remain
absent. Latest observed `origin/main` is `4fee33f`; q698 proper-noun
capitalization is accepted as partial q651-q700 closure by MANAGER-build in
`08f836d`, while q663/q670/q671 remain current DATA-INTEGRITY residuals.
Commits after q698 source repair are coordination/evidence only. Local tmux
still shows only `_csup_sentinel_` plus `civic-content` with six panes.
Cwd-based `csup staff --scenario=resume --dry-run` reported queued work on
every configured host but held each on `reason=lunarc_requires_slurm_station`;
explicit `csup staff civic-test` and `factory-audit civic-test` still expose
`missing:project_config`, so no apply/factory-run is safe. Next priority:
DATA-INTEGRITY q663/q670/q671, then the generated single-choice filler bundle
covering 133 ordinary filler/meta-prefix rows and 22 true/false judgement-shell
rows. SETUP stays source-held; CONTENT stays VERIFY/report-only unless leased.
SITE-P0-5 remains external deploy freshness with stale 715-question production
banks while current main expects 720/hash `d7ab78d7fffc`. No pane should run
Vercel CLI from this repo.

2026-05-18T23:46:00+02:00: CEO cycle decision remains HOLD/add-none. Required
CEO and operating docs were read from supervisor fallback copies plus `GOAL.md`,
project parallel-session docs, this board, and current queues; requested
`/home/billy/docs/...` and project-local operating-doc paths remain absent.
Latest observed `origin/main` is `d468f31`; commits after the q698 source
repair are coordination/evidence only, and the latest UIUX audit does not
unblock component source work. Cwd-based `csup staff --scenario=resume
--dry-run` reported queued work on every configured host (`work=9`,
`blockers=9`) but held every host on `reason=lunarc_requires_slurm_station`;
explicit `csup staff civic-test` and `factory-audit civic-test` still expose
`missing:project_config`, so no apply/factory-run is safe. Next priority:
DATA-INTEGRITY q663/q670/q671 with q698 preserved as a regression check; then
the generated single-choice filler bundle covering 133 ordinary
meta-stem/fallback rows and 22 true/false judgement-shell rows. SETUP stays
source-held; CONTENT stays VERIFY/report-only unless leased. UIUX stays blocked
until MANAGER-uiux supersedes the stale ResultSummary queue item and
DESIGN-TOKENS publishes `lib/theme/flag.ts`. SITE-P0-5 remains external deploy
freshness. No pane should run Vercel CLI from this repo.
