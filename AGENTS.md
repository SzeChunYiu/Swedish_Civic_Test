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
