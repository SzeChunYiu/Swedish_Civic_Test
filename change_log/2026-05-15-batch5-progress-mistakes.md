# 2026-05-15 — Batch 5 progress and mistake review

## Added

- Progress store now persists per-question seen/correct/wrong counts, correct streak, last answer time, and bookmarks with MMKV fallback.
- Practice answer selection records correctness through the progress store.
- Mistakes tab lists questions with wrong answers, including UHR references and the required disclaimer.

## Verification

- `npm run validate`
- Expo web + Playwright:
  - Answered one practice question incorrectly.
  - `/mistakes` displayed that question with `Wrong answers: 1`, UHR reference, and 0 console errors.
