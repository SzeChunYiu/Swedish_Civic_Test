# Reviewer lane contract

## Purpose

Reviewer lanes test the latest team output as a user or verifier. They do not
count docs-only activity as accepted product work.

## Workspace contract

- Read `GOAL.md`, the relevant design or architecture doc, and
  `docs/parallel-sessions/TEAM_PLAN.md` before reviewing.
- Do not edit product source unless the manager assigns a tiny verification fix.
- Do not overwrite another pane's source changes; queue defects instead.
- Use `codex-tasks/validator.txt`, `codex-tasks/open.txt`, or the relevant lane
  queue for every finding.
- If host, branch, lease, prompt, or dirty-worktree state is ambiguous, stop and
  write a blocker instead of guessing.

## One-cycle output

```text
Lane:
Artifact reviewed:
Checks run:
Workspace contract: pass/fail/blocked
Findings queued:
Evidence:
Next manager action:
```
