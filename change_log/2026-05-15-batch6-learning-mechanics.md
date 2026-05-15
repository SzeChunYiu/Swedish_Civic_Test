# 2026-05-15 — Batch 6 learning mechanics

## Added

- TDD coverage for XP, levels, streaks, mastery, weak-topic detection, spaced repetition, and badges.
- XP and level calculation helpers.
- Streak logic based on consecutive answer dates.
- Mastery and weak-chapter calculations.
- Spaced repetition next-review scheduling.
- Badge derivation for early study milestones.
- Progress store now persists total XP, answer dates, and next-review timestamps.
- Home/Profile show XP, level, streak, weak chapters, and badges.

## Verification

- RED: `node --test scripts/learning.test.js` failed before learning helpers existed.
- GREEN: `npm run validate` passes, including 5 learning tests.
- Expo web + Playwright: answered a practice question; `/home` showed daily goal progress, XP, streak, and weak-chapter count.
