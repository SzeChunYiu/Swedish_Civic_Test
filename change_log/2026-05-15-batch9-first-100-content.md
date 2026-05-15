# 2026-05-15 — Batch 9 first 100 content

## Added

- Expanded reviewed UHR-referenced practice content from 20 to 100 questions.
- Added `data/additionalQuestions.ts` with 80 new questions across chapters 3–13.
- Added `content/uhr-section-map.json` to map UHR chapters, sections, and source metadata.
- Added `content/question-bank.csv` as a spreadsheet-friendly content database export.
- Added `scripts/export-question-bank.js` and `npm run content:export` for regenerating the CSV database.
- Hardened `scripts/validate-content.js` to load split TypeScript content modules and validate 100 reviewed questions across all 13 chapters.
- Added content-production test coverage for the first 100-question milestone.

## Verification

- RED: `node --test scripts/content-production.test.js` failed with `20 !== 100` before content expansion.
- GREEN: `npm run validate` passes, including typecheck, lint, format, learning tests, exam tests, audio tests, content-production test, and content validation.
- Content export: `npm run content:export` exported 100 questions to `content/question-bank.csv`.

## Source basis

- UHR `Sverige i fokus` education material, 1st edition, retrieved 2026-05-15 from `https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/` and the linked PDF.
