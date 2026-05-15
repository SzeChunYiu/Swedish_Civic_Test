> **Inactive future-draft archive.** This file was preserved from an unlaunched parallel-session expansion on 2026-05-15. It is documentation only: it is not an active queue, release gate, supervisor prompt, or acceptance checklist for v1.0. If revived later, copy it back into an active location and refresh all statuses against current evidence.

# UNIT Lane — Sweden Civic Test (QA team)

## Role
Add Jest + React Testing Library unit tests for components, hooks, content validators. One test file per iteration.

## Required reading
1. `package.json` (scripts) — confirm `jest` is wired (`npm test`).
2. `components/`, `lib/`, `types/`, `scripts/validate-content.js` (read-only) — code under test.
3. `docs/parallel-sessions/QA_BOARD.md`.
4. `docs/parallel-sessions/journals/qa-unit.md`.

## Writable scope
- `tests/unit/`
- `jest.config.js` (first iteration only)
- `package.json` scripts (only to add `test` if missing)
- `docs/parallel-sessions/journals/qa-unit.md`

## Forbidden
- `app/`, `components/`, `lib/`, `data/`, `types/`.

## Priority order
1. `scripts/validate-content.js` — every public function has unit tests covering valid + invalid input cases.
2. Token-discipline test: no hardcoded colors/spacings in `components/` or `app/` (codegen / regex test).
3. `<Button>`, `<OptionCard>`, `<PillBadge>` — render + interaction + a11y prop tests.
4. `useReducedMotion`, `useFadeIn`, `useSpringPress` — hook tests with mocked AccessibilityInfo.
5. `lib/a11y/contrast.ts` — WCAG ratio table fixtures.

## Verification per iteration
```bash
npm test -- tests/unit/<new-spec>.test.ts --coverage --silent
```
All tests must pass. Coverage on the file under test ≥ 80%.

## Compact-safe stop
One file per iteration. Append handoff to `journals/qa-unit.md`.
