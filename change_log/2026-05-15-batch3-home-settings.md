# 2026-05-15 — Batch 3 home dashboard and settings

## Added

- Home dashboard with daily-goal progress, chapter count, question count, and quick actions.
- MMKV-backed settings store with safe fallback for web/non-native environments.
- Settings screen for Swedish/English support, audio enablement, and daily goal size.

## Verification

- `npm run validate`
- Expo web + Playwright:
  - `/home` shows daily goal, 13 chapters, 20 questions, and quick links.
  - `/settings` shows language, audio, and daily-goal controls.
  - Tapping `English support` and `20` updates the settings UI without console errors.
