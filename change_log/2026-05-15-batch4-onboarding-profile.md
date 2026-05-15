# 2026-05-15 — Batch 4 onboarding and profile

## Added

- Onboarding screen with study-value summary, required disclaimer, and links to Home/Settings.
- Profile screen with local completed-question count, daily goal, language preference, and Settings link.

## Verification

- `npm run validate`
- Expo web + Playwright:
  - `/onboarding` renders welcome steps, disclaimer, and action links with 0 console errors.
  - `/profile` renders completed count, daily goal, language preference, and settings link with 0 console errors.
