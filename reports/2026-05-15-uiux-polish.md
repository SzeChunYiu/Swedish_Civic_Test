# UI/UX polish evidence — 2026-05-15

## Scope

Operator reopened the internal UI/UX gate in `GOAL.md` and `codex-tasks/ceo-inbox.txt`: the app must use a central Notion-inspired theme and must not ship hardcoded colors/spacings in `app/` or `components/`.

## Implemented artifacts

- `lib/theme/colors.ts`
- `lib/theme/spacing.ts`
- `lib/theme/typography.ts`
- `lib/theme/radius.ts`
- `lib/theme/shadows.ts`
- `lib/theme/motion.ts`
- `lib/theme/index.ts`
- Refactored `app/**/*.tsx` and `components/**/*.tsx` style colors, border radii, gaps, margins, heights, and padding to consume theme tokens.
- Added `scripts/theme-discipline.test.js` and wired it into `npm test` as `npm run test:theme-discipline`.
- Added Playwright visual smoke:
  - `playwright.config.ts`
  - `tests/e2e/serve-dist-web.cjs`
  - `tests/e2e/visual-smoke.spec.ts`
  - package script `npm run test:e2e`

## Executable acceptance evidence

- `npm run test:theme-discipline` passes.
- `grep -rE '#[0-9a-fA-F]{6}|rgba?\(' app components` returns zero lines.
- `grep -rE '\b(padding(Horizontal|Vertical)?|marginTop|gap|borderRadius):[[:space:]]*[0-9]' app components` returns zero lines.
- `npm run validate` passes after adding the theme-discipline test.
- `npm run build:web:export` passes.
- `npm run test:e2e -- tests/e2e/visual-smoke.spec.ts` passes and captures all primary routes.

## Screenshot evidence

Screenshot manifest: `reports/2026-05-15-uiux-screenshots/manifest.json`

Captured routes:

- `/`
- `/onboarding`
- `/home`
- `/learn`
- `/practice`
- `/exam`
- `/mistakes`
- `/profile`
- `/settings`
- `/chapter/ch01`
- `/disclaimer`
- `/privacy`
- `/terms`
- `/sources`
- `/support`

Manual visual spot-check: `home.png`, `learn.png`, and `exam.png` show consistent warm-white/white Notion-style cards, whisper borders, blue accent links/buttons, and no obvious rendering errors on the iPhone 12 viewport.

## Status

UI/UX token gate: READY locally.

Remaining release blockers are unchanged external gates: EAS auth, device audio, store records, final device/store screenshots, and store submission/post-launch evidence.
