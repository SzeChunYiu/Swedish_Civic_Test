# Completion audit - civic PR merge/save

Generated: 2026-05-21T16:52:38Z
Repository: SzeChunYiu/Swedish_Civic_Test

## Objective decomposition

- Merge currently open PRs to `main` when they are eligible/mergeable.
- Use a random PR number as the starting point.
- Save failed/blocked PRs as durable artifacts.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
|---|---|---|
| Start with a random PR number | `.codex-pr-merge/admin-random-order-20260521T163625Z.json`; first saved random PR #2335 | OK |
| Merge open PRs that became eligible/mergeable | `.codex-pr-merge/merged-since-continuation-20260521T165223Z.json` records 29 PRs no longer open from the 114-PR continuation snapshot | OK |
| Save failed/blocked PRs | `.codex-pr-merge/failed-or-blocked-open-prs-final-20260521T165223Z.jsonl` has 86 records; current open PR count is 86 | OK |
| No passing clean open PR left unmerged | `final-counts-20260521T165223Z.json` eligible_left length = 0 | OK |
| Non-failing open PRs are still blocked | `final-counts-20260521T165223Z.json` nonfail_open = [{'number': 2505, 'title': 'static ebook: add safe source link attributes', 'checkStatus': 'PENDING', 'mergeStateStatus': 'UNSTABLE', 'mergeable': 'MERGEABLE', 'blockers': ['draft', 'ci_pending', 'unstable_required_checks']}, {'number': 2422, 'title': 'content: guard generated Sweden scope parity', 'checkStatus': 'NO_CHECKS', 'mergeStateStatus': 'DIRTY', 'mergeable': 'CONFLICTING', 'blockers': ['no_checks', 'merge_conflicts']}, {'number': 2410, 'title': 'test: centralize Home e2e setup', 'checkStatus': 'PENDING', 'mergeStateStatus': 'UNSTABLE', 'mergeable': 'MERGEABLE', 'blockers': ['ci_pending', 'unstable_required_checks']}, {'number': 2339, 'title': 'test: harden question provenance validation', 'checkStatus': 'PENDING', 'mergeStateStatus': 'DIRTY', 'mergeable': 'CONFLICTING', 'blockers': ['ci_pending', 'merge_conflicts']}] | OK_BLOCKED |
| No non-main open PRs missed | Latest `open-prs-final-20260521T165223Z.json` uses unfiltered open PR listing; all current open PRs are included | OK |
| Failed PRs retained/saved, not lost | Canonical `.codex-pr-merge/failed-or-blocked-open-prs.jsonl` refreshed from final snapshot | OK |

## Final current-state counts

- Open PRs remaining: 86
- Check statuses: {'PENDING': 3, 'FAIL': 82, 'NO_CHECKS': 1}
- Draft statuses: {'True': 1, 'False': 85}
- Merge states: {'UNSTABLE': 2, 'DIRTY': 84}
- Eligible clean PASS/NO_CHECKS PRs left: 0

## Conclusion

The merge/save objective is satisfied for the current GitHub state: all currently merge-eligible open PRs observed in the continuation have either merged or are no longer open, and every remaining open PR has been saved as failed/blocked evidence. The current non-failing open PRs are blocked by merge conflicts or stale/unknown mergeability rather than being clean merge candidates.
