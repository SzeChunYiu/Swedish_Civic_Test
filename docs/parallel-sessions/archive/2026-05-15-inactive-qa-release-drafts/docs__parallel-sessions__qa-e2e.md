> **Inactive future-draft archive.** This file was preserved from an unlaunched parallel-session expansion on 2026-05-15. It is documentation only: it is not an active queue, release gate, supervisor prompt, or acceptance checklist for v1.0. If revived later, copy it back into an active location and refresh all statuses against current evidence.

# E2E Lane — Sweden Civic Test (QA team)

## Role
Build Playwright E2E specs that exercise the Expo web build at golden-path user flows. One spec per iteration.

## Required reading
1. `package.json` (scripts) — confirm Playwright is wired (`npm run test:e2e`).
2. `app/` (read-only) — current routes.
3. `docs/parallel-sessions/QA_BOARD.md`.
4. `docs/parallel-sessions/journals/qa-e2e.md`.

## Writable scope
- `tests/e2e/` (create if missing)
- `playwright.config.ts` (only on first iteration)
- `package.json` scripts (only to add `test:e2e` if missing)
- `docs/parallel-sessions/journals/qa-e2e.md`

## Forbidden
- `app/`, `components/`, `lib/`, `data/`, `types/`.

## Priority order
1. App boots without crash; `<DisclaimerBanner>` visible on practice screen.
2. User picks a chapter and starts practice.
3. User answers a question; correct/incorrect feedback shown; explanation appears.
4. User finishes 10 questions; results screen shows score.
5. User toggles language SV↔EN; questions re-render.
6. Reduce-motion respected (animations short-circuit).

## Verification per iteration
```bash
npx expo export --platform web 2>&1 | tail -5
npm run test:e2e -- tests/e2e/<new-spec>.spec.ts
```

## Compact-safe stop
One spec per iteration. Append handoff to `journals/qa-e2e.md`.
