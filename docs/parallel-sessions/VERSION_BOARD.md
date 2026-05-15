# Batch Version / PR Train Board — Sweden Citizenship Test Prep

Owned by VALIDATOR. Updated when worker commits are accepted into the batch branch.

## Current train

- Batch outcome: working Expo scaffold + content types + 20 sample questions + basic quiz screen
- Base branch: `main`
- Integration branch: `batch/2026-05-15-foundation`
- Planned PR title: no PR needed for the already-fast-forwarded local integration; private GitHub remote now exists at `Babbloo-studio/Swedish_Civic_Test`.
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
| `work/batch-0/setup-scaffold` | SETUP | A2, A3 | accepted | `npm ci`; `npm run typecheck`; structure audit | Expo scaffold + folder structure |
| `work/batch-0/setup-quiz` | SETUP | A7 | accepted | Expo web/Playwright `/practice` (simulator unavailable) | Basic quiz screen + required disclaimer |
| `work/batch-0/content-types` | CONTENT | A4 | accepted | `npm run typecheck` | types/content.ts |
| `work/batch-0/content-chapters` | CONTENT | A5 | accepted | validation loaded 13 records | 13 chapter records |
| `work/batch-0/content-questions` | CONTENT | A6 | accepted | validation loaded 20 questions, 10/10 split | 20 sample questions |

Statuses: `open` `accepted` `rejected` `needs_followup` `deferred`

## Integration ledger

| Commit / artifact | Source lane | Integrated into batch? | Verification |
|---|---|---|---|
| Local working tree | SETUP/CONTENT/operator validation | pending commit on `batch/2026-05-15-foundation` | `npm ci`; `npm run typecheck`; content validation; Expo smoke; Playwright `/practice` |

## Separate PR exceptions

None declared.

## Final batch PR checklist

- [x] All TEAM_PLAN.md acceptance rows A1–A8 accepted with evidence
- [x] Accepted worker artifacts synced into local working tree; commit pending
- [x] `npm run typecheck` passes locally
- [x] Basic quiz screen verified with Expo web + Playwright (`/practice`); iOS/Android simulator unavailable here
- [x] Private GitHub remote configured and pushed: `origin` -> `Babbloo-studio/Swedish_Civic_Test`
- [x] PR not opened for batch integration: local `main` already contains the batch branch; batch branch pushed for traceability
- [x] Temporary remote worker state documented in TEAM_PLAN/journals; no local worker branches created
