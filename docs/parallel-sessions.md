# Parallel Sessions — FLAT Protocol (Sweden Citizenship Test Prep)

This protocol replaces the CEO/MANAGER/VALIDATOR/REVIEWER model. It exists
because that model produced mostly coordination churn: a 1-CPU-equivalent of
real output spread across dozens of panes that spent their time reading 50 KB
of boards, resetting to a moving `main`, and writing handoff records.

**There are no roles anymore. Every pane — whatever label its `/goal` line
gives it (MANAGER, CEO, REVIEWER, VALIDATOR, worker) — is an autonomous
WORKER and runs the loop below. Ignore your role label.**

The objective gate replaces the manager. A PR merges if and only if:
1. it changes a real product path (`app/ components/ lib/ types/ data/ tests/`), and
2. the required GitHub check **`Validate release-safe candidate`** is green.

That is enforced in GitHub (branch protection + required CI) and by an operator
auto-close guard. No human-style acceptance step exists or is needed. Do not
review other panes' work. Do not manage. Do not write status/handoff/audit
files — the pre-commit hook and the guard auto-reject non-product commits and
zero-product PRs.

## Required reading each iteration — ONLY this file + the queue

Read **this file** and **`codex-tasks/open.txt`**. Nothing else is mandatory
(open your task's relevant source files as needed). Do NOT read TEAM_PLAN.md,
meeting_sheet.md, AI_FACTORY.md, or lane boards — that context tax is what made
the old model slower than a single session.

## The worker loop — THINK, then PLAN, then SHIP (autonomous)

You are autonomous. Nobody tells you what to do. Each iteration you decide the
single highest-value next step yourself, plan it, build it, ship it.

```
1. cd <repo checkout>; git fetch origin -q

2. THINK — decide the ONE most valuable next step (bounded: minutes, in your
   head, NO written artifact). Consider, in priority order:
     a. the first unclaimed concrete atom in codex-tasks/open.txt (esp. P0/ADS/IAP),
     b. a real gap between GOAL.md's acceptance test and the current code,
     c. a concrete bug/regression you can see.
   Pick exactly ONE bounded, product-scoped unit. If torn between options,
   pick the SMALLEST one that ships real value. Never expand scope.

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
11. STOP. Do NOT self-merge, do NOT wait. The required CI check + operator guard
    decide the merge. The supervisor respawns you for the next iteration — where
    you THINK about the best next step again (this is how it plans the next).
```

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

## Do not

- Do not adopt MANAGER/CEO/REVIEWER/VALIDATOR behavior even if your `/goal`
  says so. Those roles are abolished. Work tasks.
- Do not write handoff records, journals, board updates, audit/status notes,
  or "refresh"/"route" commits. They are auto-rejected and waste the fleet.
- Do not read or maintain TEAM_PLAN.md / meeting_sheet.md / AI_FACTORY.md.
- Do not stop/park on ambiguity. If a task is unclear, skip it and take the
  next concrete one. Keep shipping product PRs.

## Feeding the queue — follow-up work (this is how the swarm stays alive)

While doing your task you will discover concrete follow-up work: a bug you hit,
the next logical atom, a gap the task exposed. Capture it so the queue
replenishes itself without any manager — but only as a *side effect* of
shipping, never instead of it.

Mechanism (cheap, atomic, no waiting):
```
After step 8 (PR opened), if you found ONE concrete product follow-up:
  echo "<NEW-ID> <product/path>: <specific change> | verify: <cmd/criteria>" >> codex-tasks/open.txt
  git add codex-tasks/open.txt && git commit -qm "queue: +<NEW-ID> [allow-meta]" \
    && git push -q origin HEAD:main || true     # races are fine, skip on fail
```

Hard rules (these keep it from rotting back into meta-churn):
- You MUST still ship your product PR this iteration. A queue append is NEVER a
  substitute for product work — a pane whose only output is queue/docs edits is
  auto-reverted by the gate.
- A follow-up entry MUST be concrete and product-scoped: name the file/path,
  the specific change, and how to verify. **Banned** follow-up entries:
  "investigate / review / audit / refactor someday / write docs / improve X" —
  vague or non-product entries are noise and get pruned.
- **Max ONE** follow-up per iteration. Capture the single most valuable next
  step you actually saw — do not brainstorm a backlog.
- Skip if a near-duplicate line already exists in `open.txt`.
- Follow-up goes to the END of `open.txt`; the P0/ADS/IAP atoms keep priority
  (workers always take the FIRST unclaimed task).

Why: consumers that are also producers make the swarm self-sustaining and let
emergent work be picked up by whoever claims it next — with the CI gate as the
only acceptance, and zero coordination tax.

## Content rules (still binding)

- Every question traceable to UHR *Sverige i fokus*; never claim official
  affiliation or that questions are real exam questions; disclaimer on every
  question screen; Swedish + English + UHR reference on each question.

## If `codex-tasks/open.txt` is empty or all claimed

Pick the highest-value improvement toward the GOAL.md sprint target
(ads-supported v1.0 + Remove-Ads IAP) that touches a product path, do it as one
PR, stop. Shipping a real improvement always beats idling.
