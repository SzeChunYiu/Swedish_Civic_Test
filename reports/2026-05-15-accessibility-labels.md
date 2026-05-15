# Accessibility semantics evidence — 2026-05-15

## Scope

`GOAL.md` requires every interactive element to expose accessibility semantics before v1.0 ships.

## Implemented artifacts

- Added explicit `accessibilityLabel` props to interactive `Pressable`, `Link`, and shared `Button` call sites in `app/` and `components/`.
- Added `scripts/accessibility-labels.test.js`.
- Wired `npm run test:a11y-labels` into `npm test`. The gate now checks labels, roles, link role correctness, and disabled/selected/checked state coverage.

## Red/green evidence

- Red: `npm run test:a11y-labels` initially failed, listing unlabeled interactive elements across settings, exam, home, learn, mistakes, practice, profile, chapter, onboarding, compliance links, legal pages, audio button, and answer options.
- Green: after labeling those call sites and adding explicit roles/states, `npm run test:a11y-labels` passed.

## Verification

- `npm run typecheck` passed after normalizing the shared `Button` accessibility-state merge.
- `npm run validate` passed on 2026-05-15 20:46 CEST and now includes `npm run test:a11y-labels`.
- `npm run build:web:export` passed.
- `npm run test:e2e -- tests/e2e/visual-smoke.spec.ts` passed and refreshed `reports/2026-05-15-uiux-screenshots/manifest.json`.

## Status

Interactive accessibility semantics gate: READY locally.

Remaining release blockers are unchanged external gates: EAS auth, device audio, store records, final device/store screenshots, and store submission/post-launch evidence.
