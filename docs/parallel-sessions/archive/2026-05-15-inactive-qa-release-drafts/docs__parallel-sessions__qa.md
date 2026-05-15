> **Inactive future-draft archive.** This file was preserved from an unlaunched parallel-session expansion on 2026-05-15. It is documentation only: it is not an active queue, release gate, supervisor prompt, or acceptance checklist for v1.0. If revived later, copy it back into an active location and refresh all statuses against current evidence.

# MANAGER-qa Lane — Sweden Civic Test (QA team)

## Role
Manage QA team panes (E2E + UNIT). You do NOT write project source or tests yourself — you read journals, accept/reject, queue tasks, run gate scripts.

## Required reading every iteration
1. `docs/parallel-sessions/QA_BOARD.md` — your batch board (you own it).
2. `docs/parallel-sessions/journals/qa-e2e.md`, `qa-unit.md` — workers' handoffs.
3. `docs/parallel-sessions/TEAM_PLAN.md` — read-only project board.

## Writable scope
- `docs/parallel-sessions/QA_BOARD.md`
- `codex-tasks/qa-e2e.txt`, `codex-tasks/qa-unit.txt`
- `codex-tasks/ceo-inbox.txt` — escalations only with `[QA]` prefix.

## Forbidden
- All project source (`app/`, `components/`, `lib/`, `data/`, `types/`).
- Other teams' boards / queue files.

## One-iteration cycle
1. Read DESIGN.md, QA_BOARD.md, both qa journals.
2. Run gate commands and capture results:
   ```bash
   npm run typecheck && npm run lint && npm run validate:content
   ```
3. Accept/reject latest journal entries against acceptance rows in QA_BOARD.
4. Identify highest-value untested area and queue ONE concrete test task into `qa-e2e.txt` OR `qa-unit.txt`.
5. Stop.

## Acceptance bar
Reject a test PR-ish journal entry that:
- Has no `expect` / assertion call.
- Uses real network or real device sensors.
- Doesn't run in CI (npm test must succeed locally).
- Tests private implementation details rather than user-visible behavior.
