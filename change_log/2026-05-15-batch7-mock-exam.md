# 2026-05-15 — Batch 7 mock exam

## Added

- TDD coverage for exam generation and scoring.
- Mock exam generator filters to reviewed UHR-referenced questions and honors requested question count.
- Exam scoring returns total score and per-chapter breakdown.
- Exam tab renders 20 UHR-based questions, tracks selected answers, hides explanations during the exam, and shows results after submit.
- Exam screen states that ads are disabled during the exam.

## Verification

- RED: `node --test scripts/exam.test.js` failed before generator/scoring behavior existed.
- GREEN: `npm run validate` passes, including learning and exam tests.
- Expo web + Playwright: `/exam` rendered 20 questions with no explanations during answering; after selecting answers and submitting, result showed `80%`, `16/20 correct`, and chapter breakdown `ch01 8/10`, `ch02 8/10`.
