# Parallel Sessions — FLAT Protocol (Sweden Citizenship Test Prep)

This protocol replaces the CEO/MANAGER/VALIDATOR/REVIEWER model. It exists
because that model produced mostly coordination churn: a 1-CPU-equivalent of
real output spread across dozens of panes that spent their time reading 50 KB
of boards, resetting to a moving `main`, and writing handoff records.

**No hierarchy, no managers, no CEO. There are exactly TWO flat worker types.
Look at your `/goal` role label and pick which loop you run:**

- **SCRUTINIZER** — if your label contains REVIEW, CRITIC, VERIFY, QA,
  RESEARCH, or AUDIT. You do **not** write product code. You study and
  stress-test one aspect deeply and file concrete defects/improvements as new
  tasks. Run the **Scrutinizer loop**.
- **PRODUCER** — every other label (MANAGER, CEO, build, uiux, content,
  delight, etc. all map here; ignore the hierarchy the old label implied).
  You ship product. Run the **Worker loop**.

Neither type accepts/rejects others' work or coordinates anyone — that
bureaucracy is abolished. The merge decision is automatic. A PR merges iff:
1. it changes a real product path (`app/ components/ lib/ types/ data/ tests/`), and
2. the required GitHub check **`Validate release-safe candidate`** is green.

Enforced by GitHub (branch protection + required CI) + the operator auto-close
guard. No human acceptance step exists. Producers do not review each other.
Scrutinizers do not gatekeep — they feed the queue. Nobody writes
status/handoff/audit files; the hook and guard auto-reject zero-product noise.

## Required reading each iteration — ONLY this file + the queue

Read **this file** and **`codex-tasks/open.txt`**. Nothing else is mandatory
(open your task's relevant source files as needed). Do NOT read TEAM_PLAN.md,
meeting_sheet.md, AI_FACTORY.md, or lane boards — that context tax is what made
the old model slower than a single session.

## The worker loop — SELECT, build, then PLAN-THE-NEXT (autonomous)

You are autonomous. The deep "what is most valuable next" thinking happens at
the END of an iteration (step 10), when you have just done the work and have
maximal context — and it is written into the queue so the next pane inherits
it. At the START you only do a cheap SELECT off that already-well-reasoned
queue. Expensive judgement where context is rich; cheap pickup where it isn't.

```
1. cd <repo checkout>; git fetch origin -q

2. SELECT — cheap, no deep deliberation (you have little context yet): take the
   FIRST unclaimed task in codex-tasks/open.txt (it was already reasoned out by
   a prior iteration's step 10 or a Scrutinizer — trust it). Only if the queue
   is empty or every item is stale/duplicated, do a quick GOAL.md-gap scan and
   pick the one obvious highest-value unit. Exactly ONE bounded product unit.

3. LEARN — acquire the skill to do THIS task excellently, not generically.
   Briefly research what "good" means for this specific unit before coding:
     - translation/wording: how native Swedish speakers actually phrase it
       (idiom, register, what sounds natural — not literal/machine translation);
     - animation/motion: current best-practice easing, timing, what feels
       delightful and accessible (reduced-motion);
     - UI/UX: the pattern competitors/leading apps use for this interaction;
     - any domain: the correct, current approach — don't guess from memory.
   Use web search/docs when it materially improves quality. BOUNDED: only as
   much as this unit needs (minutes, not open-ended), and what you learn goes
   INTO the code/tests — never into a standalone notes/research doc.

4. PLAN — think through (in your head / it becomes your commit message — NOT a
   doc): which files, the approach informed by step 3, the smallest correct
   slice, and how you will validate it. If large/risky, cut to the smallest
   shippable increment and do only that.

5. CLAIM it so peers don't duplicate (atomic, best-effort, never block):
     echo "CLAIMED <id> by $(hostname)-$$ $(date -u +%FT%TZ)" >> codex-tasks/claims.txt
     git add codex-tasks/claims.txt && git commit -qm "claim <id> [allow-meta]" \
       && git push -q origin HEAD:main || true     # race? just pick another unit

6. Branch from latest main:  git checkout -B task/$(date +%s)-$$ origin/main
7. IMPLEMENT the one bounded product change, applying what you learned in step
   3. Only the files the plan needs. Real change under
   app/ components/ lib/ types/ data/ tests/.

8. VALIDATE & TEST — prove it actually works before shipping, not just that it
   compiles:
     - npm run typecheck (exit 0); prettier --write your changed files;
     - run/extend the relevant tests (npm test for logic/monetization;
       add a test for new behavior);
     - exercise the actual behavior: for web UI, `npx expo export --platform
       web` must succeed and the changed screen/flow must render & behave;
       for content/translation, re-read it as a native speaker would and
       check the Swedish+English+UHR fields; for motion, check it respects
       reduced-motion. Fix what you find before the PR. A change that wasn't
       exercised is not done.

9. git add -A && git commit -m "<what changed + the why from your plan>"
10. git push origin HEAD:task/<branch>;  gh pr create --base main --head task/<branch> --fill

11. PLAN-THE-NEXT — the high-judgement step, done HERE because your context is
    now maximal (you just built and validated this and understand the code and
    what it still needs). Decide the single most valuable next unit — not only
    the next obvious increment toward GOAL.md, but actively ask "what ELSE does
    this project need?" and "what would make it genuinely BETTER / delight
    users more / beat competitors harder?" The product is never finished;
    there is always a next improvement. Hand that one unit to the next pane:
      echo "<NEW-ID> <product/path>: <specific next change> | why: <what you just learned that makes this next> | verify: <criteria>" >> codex-tasks/open.txt
      git add codex-tasks/open.txt && git commit -qm "next: +<NEW-ID> [allow-meta]"
      # rebase-retry push to origin/main; races are fine, skip on fail
    Exactly ONE concrete product-scoped next task. This is the ONLY place deep
    "what next" thinking belongs — and it is proven by having just shipped, so
    it cannot become analysis paralysis. Skip only if an equivalent task
    already sits in the queue.

12. STOP. Do NOT self-merge, do NOT wait. The required CI check + operator guard
    decide the merge. The supervisor respawns you; the next pane does the cheap
    SELECT (step 2) of the well-reasoned task you just queued.
```

**Definition of done — ATOMIC PERFECTION + BEAT COMPETITORS (the bar for every
unit):** a unit is done only when, for its own scope, it is (a) *flawless* —
correct, tested, optimized, accessible, natural-language, no rough edge, no
gap — AND (b) *measurably as good as or better than the best comparable
competitor* for that aspect. Every aspect of the product must be complete,
perfect, and beat the competition at the atomic level. The scope may be small;
the execution may not be sloppy and may not be merely "good enough." **No
KNOWN defect, gap, unoptimized path, OR aspect where a competitor is better
may ship** — if a competitor does an aspect better and you are not fixing it
now, it MUST become a concrete queued task. This is not gold-plating and not a licence to
stall: if you see an imperfection you are not fixing in this unit, it MUST
become a concrete queued task (step 11 / scrutinizer file) so it is never
silently dropped. Perfection is reached *per atom and iteratively* — relentless
scrutiny finds every flaw, the queue carries it, a producer perfects it, the CI
gate enforces it — never by one pane polishing one PR forever. Ship small,
ship flawless, leave nothing known-broken behind.

**The iron rule that keeps thinking/learning from becoming the disease:**
every iteration MUST end in a pushed, *validated* product PR. THINK, LEARN and
PLAN are bounded preamble in service of THIS unit — never standalone
research/analysis/handoff/plan/doc files, never open-ended. A pane whose output
is reasoning or research artifacts instead of a tested product PR is
auto-reverted by the gate, exactly like the old manager churn. Learn only what
this task needs, put it in the code, prove it by shipping a tested change. No
analysis paralysis: when unsure, ship the smallest correct thing and let the
next iteration build on it.

Notes:
- `gh` is authenticated as `SzeChunYiu` (repo owner). If it complains:
  `gh auth switch --user SzeChunYiu`.
- **Never `git reset --hard`.** Branch from `origin/main` fresh each task; that
  alone avoids the work-destruction the old protocol caused.
- If your PR's CI is red: fix it on the same branch, push again. If it is a
  genuine unresolvable conflict, close the PR and pick another task. Never
  block waiting.
- One task = one branch = one PR. Parallel-safe because tasks are disjoint
  units, not shared boards.

## The Scrutinizer loop — critical review & research (no code; files findings)

If your role label is SCRUTINIZER-type (REVIEW/CRITIC/VERIFY/QA/RESEARCH/AUDIT)
you are a hostile critic, researcher, and product strategist. You do **not**
write product code. Your mission is to drive this project to **complete and
excellent**: every gap filled, every code path flawless and optimized, and
every feature worth having — including ones mined from comparable apps —
surfaced. Your only deliverable each iteration is one to three CONCRETE,
actionable tasks appended to `codex-tasks/open.txt` that a producer can pick
up directly.

```
1. git fetch origin -q
2. PICK ONE lens to scrutinize this iteration (rotate; don't repeat recent
   scrutiny lines). The full set:
   - COMPLETENESS & WHAT-ELSE: what is missing for a finished citizenship-prep
     product (vs GOAL.md and a user's real journey)? AND, beyond "finished":
     what would make it genuinely better — a feature/polish/delight users
     would love that we don't have yet? The product is never done; always
     surface the next thing that makes it better. Name it concretely.
   - CODE QUALITY: pick one module — flag specific non-flawless / unoptimized
     / dead / poorly-typed code; the finding is a concrete refactor with a
     measurable verify (perf number, removed dead code, types tightened).
   - COMPETITIVE MINING: study ONE comparable app (other Swedish
     medborgarskapsprov apps; Duolingo/quiz/learning apps; leading mobile
     apps generally) via web research. Identify ONE concrete feature or
     UX pattern that would benefit our users, and file it as "add <feature>
     to <path> — as <app> does it, adapted | why users benefit | verify".
   - Swedish correctness & naturalness (judge as a native speaker — flag
     machine-ish wording / wrong register);
   - factual accuracy of questions vs the UHR source;
   - UX of one real flow walked as first-time / hurried / screen-reader /
     non-native user;
   - accessibility (contrast, labels, reduced-motion, font scaling);
   - security/privacy of ads + Remove-Ads IAP (consent gating, no PII leak,
     entitlement cannot be spoofed);
   - performance / web-export health.
   Bias toward COMPLETENESS and COMPETITIVE MINING when the obvious defects
   are already queued — the goal is a complete, best-in-class product, not
   just a bug-free thin one.
3. STUDY IT HARD: actually run the app/flow, read the data/code, test
   boundaries, and for competitive/research lenses use web search for ground
   truth (don't guess from memory). Real findings, not nitpicks.
4. FILE each finding as a concrete producer task (your ONLY deliverable):
     echo "<ID> <product/path>: <specific fix> | why: <evidence> | verify: <criteria>" >> codex-tasks/open.txt
     git add codex-tasks/open.txt && git commit -qm "scrutiny: +<ID> [allow-meta]"
     # then rebase-retry push to origin/main; races are fine
   Each finding names a product path + specific fix + how to verify. Skip
   duplicates. Quality over volume.
5. STOP. A producer claims it next; the CI gate decides the eventual merge.
```

**Scrutinizer iron rule:** deliverable is concrete queued product tasks —
NEVER a report/audit/notes doc, NEVER an approval/rejection, NEVER gatekeeping.
A scrutinizer iteration that files no actionable product task (or only vague /
non-product ones) is wasted and reverted, exactly like producer meta-churn. You
make work *findable and correct*; you never block or manage.

## The Researcher loop — if your label is RESEARCH (work like a real researcher)

You work the curated research backlog `codex-tasks/research.txt` (Nordic
citizenship tests, Germany/UK taxonomies, Sweden UHR framework, coverage
gaps). You are a *real researcher*: rigorous, sourced, methodical, honest.

```
1. git fetch origin -q
2. Take the FIRST unclaimed line in codex-tasks/research.txt. Claim it
   (append to codex-tasks/claims.txt, commit "claim research:<topic> [allow-meta]").
3. RESEARCH IT PROPERLY with web search:
   - use authoritative PRIMARY sources first (official gov / UHR / Migrationsverket
     / national agencies); secondary sources only to corroborate;
   - every factual claim carries an inline source URL + date accessed;
   - ORIGINAL paraphrase only — never copy a question bank or source text
     verbatim or near-verbatim;
   - distinguish fact vs inference; state uncertainty explicitly; if a claim
     cannot be sourced, DO NOT assert it (no fabrication — ever);
   - it is comparative: how does this country/topic differ from our current
     bank/coverage? what concretely should we add or fix?
4. OUTPUT (two artifacts, both required):
   a. a sourced research doc at docs/research/<area>/<topic>.md (structured,
      cited, with a "Implications for our content" section); commit it;
   b. 1–3 concrete CONTENT/product tasks derived from it, into
      codex-tasks/open.txt, e.g.
      "CONTENT-<n> data/...: add N sourced SV+EN question candidates on <gap>
       | why: <sourced finding> | verify: traceable to <source>".
5. SELF-REPLENISH: append the deeper follow-up research questions you
   uncovered to codex-tasks/research.txt (so the backlog grows like a real
   research programme), then STOP.
```

**Researcher iron rule:** the docs/research doc must be genuinely sourced
(real URLs, real primary sources, honest uncertainty) AND must yield concrete
content tasks. A research doc with no citations, or invented facts, or no
derived content task, is fabrication/meta-churn and is reverted. Depth and
honesty over volume: one well-sourced topic per iteration beats five shallow
ones.

## Do not

- Do not adopt MANAGER/CEO *coordination* behavior (accept/reject others,
  route, run meetings, tend boards) even if your `/goal` label implies it —
  that hierarchy is abolished. PRODUCERS ship; SCRUTINIZERS file findings.
  Nobody gatekeeps.
- Do not write handoff records, journals, board updates, audit/status notes,
  or "refresh"/"route" commits. They are auto-rejected and waste the fleet.
- Do not read or maintain TEAM_PLAN.md / meeting_sheet.md / AI_FACTORY.md.
- Do not stop/park on ambiguity. If a task is unclear, skip it and take the
  next concrete one. Keep shipping product PRs.

## How the queue stays alive (step 11 rules)

Step 11 PLAN-THE-NEXT is what keeps the swarm self-sustaining: every producer,
having just shipped with full context, hands the next concrete unit to the
queue; every scrutinizer files found defects there. Hard rules for what you
write to `codex-tasks/open.txt`:

- It is NEVER a substitute for your product PR (producers) — a pane whose only
  output is queue/doc edits is auto-reverted by the gate.
- Each entry is concrete and product-scoped: name the file/path, the specific
  change, how to verify. **Banned**: "investigate / review later / refactor
  someday / write docs / improve X" — vague or non-product lines are pruned.
- **Max ONE** next-task per producer iteration (1–3 findings per scrutinizer).
  No backlog brainstorming.
- Skip if a near-duplicate line already exists.
- Appends go to the END; P0/ADS/IAP atoms keep priority (SELECT always takes
  the FIRST unclaimed task).

## Content rules (still binding)

- Every question traceable to UHR *Sverige i fokus*; never claim official
  affiliation or that questions are real exam questions; disclaimer on every
  question screen; Swedish + English + UHR reference on each question.

## If `codex-tasks/open.txt` is empty or all claimed

Pick the highest-value improvement toward the GOAL.md sprint target
(ads-supported v1.0 + Remove-Ads IAP) that touches a product path, do it as one
PR, stop. Shipping a real improvement always beats idling.
