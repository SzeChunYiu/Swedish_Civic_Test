# AGENTS.md — Swedish Civic Test App

## Chain of command

```
User
  └─ Operator (Claude Code main session) — bridge, resource check, artifact inspection
       └─ GM pane — project executive, direction, staffing, priorities
            ├─ VALIDATOR pane — team manager, acceptance, TEAM_PLAN, blocker tracking
            │    ├─ SETUP worker — Expo scaffold, TypeScript, folder structure
            │    ├─ CONTENT worker — data types, question schema, sample questions
            │    └─ DEBUG pane — issue investigation, one slice at a time
            └─ (future lanes as queue grows)
```

## Operator rules

- Do not write project source code in the operator session.
- Check `docs/parallel-sessions/TEAM_PLAN.md` before any pane decisions.
- Verify artifacts (git diff, commits, test output) before marking work done.
- Communicate user direction to GM via the TEAM_PLAN notes section or a direct `tmux send-keys` message.

## GM rules

- Own direction, team structure, and priorities.
- Read `docs/parallel-sessions/gm.md` at every iteration start.
- Update `docs/parallel-sessions/TEAM_PLAN.md` after every decision.
- Never implement project code — delegate to workers.
- Escalate blockers to the operator (append to `docs/parallel-sessions/TEAM_PLAN.md` under BLOCKERS).

## VALIDATOR rules

- Own `docs/parallel-sessions/TEAM_PLAN.md` acceptance rows.
- Read worker journals in `docs/parallel-sessions/journals/` before accepting.
- Mark acceptance only when artifacts exist and pass quality bar.
- Queue next smallest task for idle workers.

## Worker rules (SETUP, CONTENT, and any future lanes)

- Read `docs/parallel-sessions.md` and the lane-specific `.md` at every iteration start.
- One bounded task per iteration. Stop when done or blocked.
- Write handoff to `docs/parallel-sessions/journals/<lane>.md`.
- Never write to another lane's scope (see TEAM_PLAN lease table).

## Content quality bar

A question may NOT be submitted to VALIDATOR if:
- source is unclear or missing,
- correct answer is debatable,
- Swedish wording is wrong,
- English translation is confusing,
- UHR reference field is empty,
- explanation overclaims official authority.

**See `docs/content/wording-rules.md` for the canonical wording rules** — applies to questions, options, explanations, ebook copy, UI strings, and onboarding text in every language. Key rules: no redundant "True or false:" / "Sant eller falskt:" prefixes (UI affords that); no nested-quote answer-judgement templates; no source-authority phrasing in stems; one concept per question; honest provenance labelling; natural target-language phrasing (never literal translation).

## Vercel deploys — DO NOT run `vercel` CLI

Production deploys are driven exclusively by `.github/workflows/scheduled-deploy.yml`, which fires the Vercel Deploy Hook every 30 min. Vercel pulls main from GitHub and builds with `vercel.json` (which expects the committed `site/` directory).

Never run `vercel deploy`, `vercel --prod`, or `vercel link` from this repo or any subdirectory. CLI deploys upload an incomplete file set (missing `site/`) and have repeatedly clobbered production with failed builds. The `vercel.json` `buildCommand` now hard-fails when `site/` is absent so the breakage is loud, but the right answer is to not invoke the CLI at all — push to main and let the scheduled hook do its job. To redeploy on demand, fire the hook (URL is the `VERCEL_DEPLOY_HOOK` repo secret) instead of running the CLI.

## Ownership rule — enforced by pre-commit hook

**Never write legacy-owner names anywhere in any file** — not in comments, strings, doc blocks, or prompts. The CI ownership gate runs a blunt regex scan and will fail even when the mention is negational.

Use `legacy-owner` or `non-SzeChunYiu` as substitutes when referring to the old account.

This project pushes to `SzeChunYiu/Swedish_Civic_Test`. Every pane, every commit, every PR targets that repo.

A pre-commit hook on both the local and LUNARC checkouts enforces this and will block the commit. Override only with `[allow-legacy-owner]` in the commit message when absolutely necessary (e.g. fixing the hook itself).
