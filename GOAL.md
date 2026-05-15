# GOAL — Swedish_Civic_Test

Updated: 2026-05-15 20:30 by billy (operator)

## Sprint target (≤7 days)

Ship a v1.0-ready Expo app with professional, token-driven UI/UX: every screen consumes a centralized `lib/theme/` design system (no hardcoded colors/spacings/fonts in `app/` or `components/`), every interactive element is accessibility-labeled, and every screen passes a Playwright visual smoke against DESIGN.md (Notion-inspired) on Expo web.

## Acceptance test (executable)

```bash
# 1. lib/theme exists and exports a coherent token API
test -f lib/theme/index.ts && test -f lib/theme/colors.ts && test -f lib/theme/spacing.ts && test -f lib/theme/typography.ts && test -f lib/theme/radius.ts && test -f lib/theme/shadows.ts && test -f lib/theme/motion.ts

# 2. zero hardcoded colors or rgba() in screens or components
test "$(grep -rE '#[0-9a-fA-F]{6}|rgba?\(' app components | wc -l)" -eq 0

# 3. typescript clean
npx tsc --noEmit

# 4. content + lint validations
npm run lint && npm run validate:content

# 5. expo web export succeeds
npx expo export --platform web

# 6. playwright smoke captures every primary route
npm run test:e2e -- tests/e2e/visual-smoke.spec.ts
```

All six MUST pass. The screenshots from step 6 are saved under `reports/2026-05-15-uiux-screenshots/` and committed.

## Product source paths (commits must touch ≥1 of these)

- `app/`
- `components/`
- `lib/`
- `types/`
- `data/`
- `tests/`

## Non-product paths (commits touching ONLY these are REVERTED by managers)

- `docs/`
- `codex-tasks/`
- `change_log/`
- `reports/` (except `reports/2026-05-15-uiux-screenshots/` produced by acceptance test step 6)
- `swedish_citizenship_app_project_plan/`
- `publishing/` (EXCEPTION: the `release` team owns these; for the release team only, `publishing/` IS a product path)

## Banned iteration types

- queue-refresh, planner-audit-without-source-diff, validator-policy-refresh, manager-review-without-rejection-or-accept, docs-only-handoff, status-summary-as-deliverable, "intake" / "sync evidence" / "audit posture" iterations.

## Productivity targets

- ≥6 source-touching commits per day across all civic teams combined.
- ≤20% of commits may have zero `app/components/lib/types/data/tests` lines (allow-meta tagged release/publishing work).
- Each MANAGER must reject at least one bad worker iteration per day or the operator will assume the manager is rubber-stamping.

## Out of scope (do NOT spend time on)

- AI tutor, backend services, user accounts, AI-generated questions inside the app, community features.
- Real device builds, store submission, Expo/EAS login flow (these are external blockers tracked separately).

## Updated by operator only

CEO must not edit this file. Request a new goal via `[CEO->OPERATOR NEEDS-GOAL]` in `codex-tasks/ceo-inbox.txt`.
