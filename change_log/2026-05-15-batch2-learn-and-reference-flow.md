# 2026-05-15 — Batch 2 learn and reference flow

## Added

- Learn tab now renders all 13 chapters with question counts.
- Chapter detail route renders chapter metadata, question cards, and UHR references.
- Practice screen now reuses `QuestionCard`, `ExplanationPanel`, and `UHRReferenceCard`.
- Question-detail surfaces include the required independent-app disclaimer.

## Verification

- `npm run validate`
- Expo web + Playwright:
  - `/learn` shows all 13 chapter cards and counts.
  - `/chapter/ch01` shows chapter details, disclaimer, 10 question cards, and UHR references.
  - `/practice` shows the question, options, explanation, score, and UHR reference after answer selection.
