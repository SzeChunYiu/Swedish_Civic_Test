# Parallel Sessions — Shared Protocol (Sweden Citizenship Test Prep)

All codex lanes in the civic-test project follow this protocol.
**Read this file at the start of every iteration**, plus
`docs/parallel-sessions/AI_FACTORY.md`, `docs/parallel-sessions/TEAM_PLAN.md`,
and your lane-specific `docs/parallel-sessions/<lane>.md` before editing.

## Project identity

- **Project:** Sweden Citizenship Test Prep (medborgarskapsprov)
- **Stack:** Expo + React Native + TypeScript
- **Repo:** `https://github.com/SzeChunYiu/Swedish_Civic_Test` (private)
- **Local roots:** `~/Desktop/projects/Swedish_Civic_Test` (laptop / mac-mini)
  or the cloned LUNARC checkout path.

Every pane must confirm its role, manager/escalation lane, branch, and writable
lease before editing. If ownership is unclear, stop and record a blocker in
`codex-tasks/blockers.txt` instead of writing artifacts. Stop-the-line blockers
outrank normal lane queues until VALIDATOR accepts or explicitly defers them.

## Git workflow — **PR per unit of work, never commit straight to `main`**

This is the mechanism that makes work actually ship. A worker that edits files,
writes a handoff, and stops **without** opening and squash-merging a PR has
produced nothing — its work is discarded on the next `git reset --hard
origin/main`. Every unit of work lands as a squash-merged pull request.

`gh` on every host is authenticated as `SzeChunYiu` (the repo owner). If `gh`
complains about the active account, run `gh auth switch --user SzeChunYiu`.

### Per iteration, from the repo checkout:

```
1. git fetch origin && git reset --hard origin/main      # sync to latest main
2. Read this file, docs/parallel-sessions/AI_FACTORY.md,
   docs/parallel-sessions/TEAM_PLAN.md, docs/parallel-sessions/<lane>.md
3. Pick ONE task from your queue (codex-tasks/<session>/open.txt or worker-N.txt)
   that maps to a TEAM_PLAN acceptance row. No side-quests.
4. Do ONE bounded unit of work, writing ONLY into your lane's writable scope
5. Verify (must pass before commit):
     npm run typecheck                 # tsc --noEmit, exit 0
     <lane verify cmd from your lane doc, e.g. content/export validators>
     git diff --check                  # no whitespace errors
6. git add -A
   git commit -m "<lane>: <what changed>"     # add [allow-meta] ONLY for
                                              # non-product/infra commits
7. BR=task/<lane>/$(date +%s)
   git push origin HEAD:"$BR"
8. PR=$(gh pr create --base main --head "$BR" --fill 2>/dev/null | tail -1)
9. Self-review: gh pr diff "$BR". If good and checks are green:
     gh pr merge --squash --delete-branch "$BR"
10. git fetch origin && git reset --hard origin/main     # pick up merged work
11. Append handoff to docs/parallel-sessions/journals/<lane>.md (format below)
12. Check your lane stop condition. If met, stop. Else go to 1.
```

Notes:
- If `gh pr merge` is blocked (conflict / failing check), fix on the branch,
  push again, retry. If it is a real cross-lane conflict you cannot resolve,
  close the PR, log it in `codex-tasks/blockers.txt`, move on.
- Squash-merge keeps `main` linear; `--delete-branch` keeps GitHub tidy.
- Managers/VALIDATOR/CEO follow the **same** PR flow for everything they write
  (queue files, lane docs, board updates).
- The project pre-commit hook (`.shared/productivity-pre-commit.sh`) requires
  product-path touches; for genuine infra/meta commits put `[allow-meta]` in
  the commit message. Never use `--no-verify`.

## Lanes

Sessions and their panes/lanes are defined by the `codex-prompts-*.txt` files:

| Session prompts file | Panes / lanes |
|---|---|
| `codex-prompts-meta.txt` | CEO |
| `codex-prompts-team-build.txt` | MANAGER-build, REVIEWER, SETUP, UIUX, DATA-INTEGRITY |
| `codex-prompts-team-uiux.txt` | MANAGER-uiux, REVIEWER-UX, DESIGN-TOKENS, COMPONENTS, SCREENS |
| `codex-prompts-civic-team-uiux-design.txt` | MANAGER, DESIGN-TOKENS, COMPONENTS |
| `codex-prompts-civic-team-uiux-runtime.txt` | MANAGER, SCREENS, MOTION-A11Y |
| `codex-prompts-civic-team-qa.txt` | MANAGER-qa, E2E, UNIT |
| `codex-prompts-civic-team-release.txt` | MANAGER-release, STORE-METADATA, PRIVACY-DOCS |
| `codex-prompts-civic-content.txt` | MANAGER-content, CONTENT×3, CONTENT-VERIFY |

Writable scope per lane group is the lane/lease table in
`docs/parallel-sessions/TEAM_PLAN.md` and the detail in each `<lane>.md`.

## Conflict rules

- Never edit a file outside your lane's writable scope.
- `data/` and `content/` are owned solely by the content session.
- If you need another lane's file, read it; do not modify it.
- If a `git reset --hard origin/main` would lose a small append to a shared
  queue/journal file, re-apply it after the reset before your next commit.

## When to stop immediately

- Rate limited / usage capped → stop, note in your journal and `codex-tasks/blockers.txt`.
- Ambiguous instruction → stop, write the question in `codex-tasks/blockers.txt`.
- File outside writable scope needed → stop, raise a blocker.

## Compact-avoidance rule

Finish one small PR-merged iteration and stop. The supervisor respawns the next
fresh iteration. Do not keep the goal open. Do not implement outside scope.

## Handoff format (append to `docs/parallel-sessions/journals/<lane>.md`)

```text
Lane:
Host/branch:
Role type and manager:
Task / checklist item:
Changed artifacts:
Verification (commands + result):
PR (number + merged?):
Accepted by worker? yes/no/blocked
Next suggested validator action:
```
