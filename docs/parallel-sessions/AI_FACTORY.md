# AI Factory Board — Sweden Citizenship Test Prep

This file is the local AI factory operating model for this project.
Reference: `docs/ai-factory.md` in the codex-supervisor repo for the full protocol.

## Factory invariants for this project

1. **One batch outcome.** Declared in `TEAM_PLAN.md` before workers start.
2. **Prompt-to-artifact flow.** Work enters through `codex-tasks/` queues; acceptance requires artifacts (files, TypeScript compile, working screen).
3. **GM owns direction; VALIDATOR owns convergence.** GM sets priorities and staffing. VALIDATOR updates checklist, assigns leases, verifies evidence.
4. **Workers do not invent parallel products.** No side-quests. Every task maps to a TEAM_PLAN.md acceptance row.
5. **No green proxy status.** "DONE" is only accepted after VALIDATOR maps it to the checklist.
6. **Blockers are stop-the-line.** Shared blockers in `codex-tasks/blockers.txt` take priority over lane-local work.
7. **GM starts before teams.** Operator runs `csup gm-start civic-test --host=mac-mini --apply` first.

## Batch 0 outcome

When Batch 0 is accepted: a working Expo TypeScript app skeleton exists with full folder structure, all content types compile, 20 UHR-based sample questions are in `data/questions.ts`, and a basic quiz screen loads and displays questions.

## Required factory docs (all must be present for GREEN audit)

| File | Status |
|---|---|
| `docs/parallel-sessions.md` | ✓ references AI_FACTORY.md |
| `docs/parallel-sessions/AI_FACTORY.md` | ✓ this file |
| `docs/parallel-sessions/TEAM_PLAN.md` | ✓ has Batch outcome + Acceptance checklist |
| `docs/parallel-sessions/VERSION_BOARD.md` | ✓ has worker branch intake |
| `docs/blocker-schema.md` | ✓ has type=code|data|approval|infra|empirical|external |

## Factory audit command

```bash
~/bin/csup factory-audit civic-test
```

Expected output: `FACTORY civic-test/mac-mini status=GREEN` (after queues are drained)
or `status=YELLOW` (queued acceptance-gap work remains).

## Management loop (Batch 0)

1. GM boots → reads TEAM_PLAN + queues → confirms roster + leases.
2. VALIDATOR creates VERSION_BOARD batch branch `batch/2026-05-15-foundation`.
3. SETUP lane: scaffold → folder structure → quiz screen (one task per iteration).
4. CONTENT lane: types → chapters → 20 questions (one task per iteration).
5. Each worker writes handoff → VALIDATOR verifies artifact → marks checklist row.
6. When all A1–A8 rows accepted → batch PR opened from `batch/2026-05-15-foundation`.
