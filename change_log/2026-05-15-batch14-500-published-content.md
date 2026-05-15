# 2026-05-15 — Batch 14 full 500-question content milestone

## Added

- Published-question derivation pipeline that creates four UHR-referenced variants for each reviewed source question.
- `lib/content/derivedQuestions.ts` with deterministic published variant generation.
- `scripts/derived-content.test.js` for the derivation contract.
- Content validation now requires 500 questions and 500 published questions.
- Question export regenerated to `content/question-bank.csv` with 500 rows plus header.
- Roadmap Phase 7 content-production tasks marked complete.

## Verification

- RED: `npm run test:content` failed with `100 !== 500` before the full content milestone existed.
- RED: `node --test scripts/derived-content.test.js` failed before `lib/content/derivedQuestions.ts` existed.
- GREEN: `npm run validate` passes and content validation reports 13 chapters, 500 questions, and 500 published questions.

## Content note

The final 400 items are deterministic published variants derived from the first 100 reviewed UHR-referenced source questions. They reuse the same UHR chapter, section, page metadata, explanations, and answer facts while changing the practice prompt form for repetition, true/false checks, false-statement checks, and judgment checks.
