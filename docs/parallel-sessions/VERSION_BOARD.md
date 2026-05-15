# Batch Version / PR Train Board — Sweden Citizenship Test Prep

Owned by VALIDATOR. Updated when worker commits are accepted into the batch branch.

## Current train

- Batch outcome: working Expo scaffold + content types + 20 sample questions + basic quiz screen
- Base branch: `main`
- Integration branch: `batch/2026-05-15-foundation`
- Planned PR title: "Batch 0: Expo scaffold, content types, and 20 sample UHR questions"
- Release owner: `VALIDATOR`
- Split decision: `single_batch_pr`

## PR grouping policy

Default: all accepted worker commits merge into `batch/2026-05-15-foundation`.
Only VALIDATOR opens the final review-facing PR from that branch.

Allowed exceptions: `hotfix`, `independent_release`, `risk_isolation`, `review_size`.
None currently declared.

## Worker branch intake

| Worker branch / commit | Lane | Checklist ID | Intake status | Evidence | Notes |
|---|---|---|---|---|---|
| `work/batch-0/setup-scaffold` | SETUP | A2, A3 | open | `npx tsc --noEmit` | Expo scaffold + folder structure |
| `work/batch-0/setup-quiz` | SETUP | A7 | open | Expo Go | Basic quiz screen |
| `work/batch-0/content-types` | CONTENT | A4 | open | `npx tsc --noEmit` | types/content.ts |
| `work/batch-0/content-chapters` | CONTENT | A5 | open | `cat data/chapters.ts` | 13 chapter records |
| `work/batch-0/content-questions` | CONTENT | A6 | open | question count + tsc | 20 sample questions |

Statuses: `open` `accepted` `rejected` `needs_followup` `deferred`

## Integration ledger

| Commit / artifact | Source lane | Integrated into batch? | Verification |
|---|---|---|---|
| (none yet) | — | no | — |

## Separate PR exceptions

None declared.

## Final batch PR checklist

- [ ] All TEAM_PLAN.md acceptance rows A1–A8 accepted or blocked with evidence
- [ ] All accepted worker commits merged into `batch/2026-05-15-foundation`
- [ ] `npx tsc --noEmit` passes on batch branch
- [ ] Basic quiz screen verified in Expo Go
- [ ] PR body links TEAM_PLAN.md, VERSION_BOARD.md, and verification output
- [ ] Temporary worker branches deleted or documented
