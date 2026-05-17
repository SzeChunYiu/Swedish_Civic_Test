Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Chapter question-count parity atom for published content metadata.
Artifacts changed: `data/chapters.ts`, `scripts/validate-content.js`.
Verification: `npm run validate:content` passed and reported 13 chapters, 500 questions, 500 published questions; `npm run test:content` passed 2/2; `npm run typecheck` passed; `npx prettier --check data/chapters.ts scripts/validate-content.js` passed; `git diff --check -- data/chapters.ts scripts/validate-content.js docs/parallel-sessions/journals/data-integrity.md` passed; `npm run test:ownership` passed.
Blocked? no - chapter metadata now matches generated question counts and the content validator enforces parity.
Next suggested validator action: accept this DATA-INTEGRITY parity atom and keep `npm run validate:content` as the nearest regression gate for future content metadata edits.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Question-bank export parity atom for committed CSV versus generated question data.
Artifacts changed: `scripts/export-question-bank.js`, `tests/content-export-parity.test.js`, `package.json`.
Verification: `node scripts/export-question-bank.js --check` passed and reported 500-question parity; `npm run test:content` passed 2/2; `npm run validate:content` passed and reported 13 chapters, 500 questions, 500 published questions; `npm run typecheck` passed; `npm run format:check -- --check package.json scripts/export-question-bank.js tests/content-export-parity.test.js` passed; `git diff --check -- package.json scripts/export-question-bank.js tests/content-export-parity.test.js` passed.
Blocked? no - committed question-bank export drift is now detectable without mutating files during validation.
Next suggested validator action: keep `tests/content-export-parity.test.js` in the content gate and update any manager evidence row that still points to the older script-test location for this atom.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: UHR reference validation atom for published question references.
Artifacts changed: `content/uhr-section-map.json`, `scripts/validate-content.js`, `scripts/content-production.test.js`.
Verification: `npm run validate:content` passed and reported 13 chapters, 500 questions, 500 published questions, 500 UHR references validated; `npm run test:content` passed 2/2; `npm run typecheck` passed; `node scripts/export-question-bank.js --check` passed and reported 500-question parity; `npx prettier --check content/uhr-section-map.json scripts/validate-content.js scripts/content-production.test.js` passed; `git diff --check -- content/uhr-section-map.json scripts/validate-content.js scripts/content-production.test.js` passed; `npm run test:ownership` passed.
Blocked? no - the validator now rejects UHR reference chapters, sections, or approximate pages that are not present in `content/uhr-section-map.json`, and the test asserts all 500 published questions are covered.
Next suggested validator action: review and accept DI3, then keep `npm run validate:content` / `npm run test:content` as the nearest UHR reference regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Runtime question schema validation atom for published content.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`, `lib/content/derivedQuestions.ts`, `scripts/derived-content.test.js`, `content/question-bank.csv`.
Verification: `npm run validate:content` passed and reported 13 chapters, 500 questions, 500 published questions, 500 question schemas validated, 500 UHR references validated; `npm run test:content` passed 2/2; `npm run test:derived-content` passed 1/1; `npm run typecheck` passed; `node scripts/export-question-bank.js --check` passed and reported 500-question parity; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js scripts/derived-content.test.js lib/content/derivedQuestions.ts` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js scripts/derived-content.test.js lib/content/derivedQuestions.ts content/question-bank.csv docs/parallel-sessions/journals/data-integrity.md` passed; `npm run test:ownership` passed.
Blocked? no - validator now rejects malformed question IDs, enum values, bilingual text fields, option shape, true/false option semantics, blank/duplicate tags, and missing tag arrays; generated variants now deduplicate tags before export.
Next suggested validator action: review and accept this DI4 schema atom, then keep `npm run validate:content` and `npm run test:content` as the nearest schema regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: UHR section-map parity atom against chapter metadata.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`.
Verification: `npm run validate:content` passed and reported 13 chapters, 500 questions, 500 published questions, 500 question schemas validated, 13 UHR map chapters validated, 110 UHR map sections validated, and 500 UHR references validated; `npm run test:content` passed 2/2; `node scripts/export-question-bank.js --check` passed and reported 500-question parity; `npm run typecheck` passed; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js docs/parallel-sessions/journals/data-integrity.md` passed; `npm run test:ownership` passed.
Blocked? no - the validator now rejects UHR section-map drift from `data/chapters.ts`, duplicate or blank UHR map sections, duplicate chapter IDs/titles, and non-increasing UHR chapter start pages before accepting question references.
Next suggested validator action: review and accept this DI5 UHR map parity atom, then keep `npm run validate:content` and `npm run test:content` as the nearest UHR map regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Source-to-generated question export parity atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`.
Verification: `npm run validate:content` passed and reported 13 chapters, 500 questions, 100 source questions, 400 generated published questions, generation parity true, 500 question schemas validated, 13 UHR map chapters validated, 110 UHR map sections validated, and 500 UHR references validated; `npm run test:content` passed 2/2; `node scripts/export-question-bank.js --check` passed and reported 500-question parity; `npm run typecheck` passed; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` passed; `npm run test:ownership` passed.
Blocked? no - the validator now rejects drift between the 100 source questions, 400 generated variants, and the ordered 500-row exported question bank.
Next suggested validator action: review and accept this DI6 generation parity atom, then keep `npm run validate:content` and `npm run test:content` as the nearest generation/export regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Question chapter-to-UHR-reference parity atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`, `tests/content-uhr-chapter-parity.test.js`, `package.json`, `data/questions.ts`, `data/chapters.ts`, `content/question-bank.csv`.
Verification: `npm run validate:content` passed and reported 500 `questionChapterReferenceParityValidated`; `npm run test:content` passed 3/3; `node scripts/export-question-bank.js --check` passed and reported 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check package.json data/questions.ts data/chapters.ts scripts/validate-content.js scripts/content-production.test.js tests/content-uhr-chapter-parity.test.js` passed; `git diff --check -- package.json data/questions.ts data/chapters.ts content/question-bank.csv scripts/validate-content.js scripts/content-production.test.js tests/content-uhr-chapter-parity.test.js docs/parallel-sessions/journals/data-integrity.md` passed.
Blocked? no - the validator now rejects any question whose `chapterId` does not match the chapter id mapped from its UHR reference chapter; the current bank was corrected for q016-q020 and regenerated variants q161-q180.
Next suggested validator action: review and accept this DATA-INTEGRITY parity atom, then keep `npm run validate:content` and `npm run test:content` as the nearest chapter/reference drift gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Authored source-to-published source parity atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`, `tests/content-authored-source-parity.test.js`, `package.json`.
Verification: `npm run validate:content` passed and reported 100 `authoredSourceQuestionsValidated` plus 100 `sourcePublicationParityValidated`; `npm run test:content` passed 4/4; `node scripts/export-question-bank.js --check` passed and reported 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check package.json scripts/validate-content.js scripts/content-production.test.js tests/content-authored-source-parity.test.js` passed; `git diff --check -- package.json scripts/validate-content.js scripts/content-production.test.js tests/content-authored-source-parity.test.js` passed.
Blocked? no - the validator now rejects authored source questions that are not reviewed/sequential before publication and rejects any published source row that drifts from its authored source fields beyond the intended `reviewStatus` change.
Next suggested validator action: review and accept this DATA-INTEGRITY parity atom, then keep `npm run validate:content` and `npm run test:content` as the nearest authored-source publication drift gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Published question option-label uniqueness schema atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`.
Verification: `npm run validate:content` passed and reported 500 `questionOptionTextLabelsValidated`; `npm run test:content` passed 4/4; `node scripts/export-question-bank.js --check` passed and reported 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` passed.
Blocked? no - the content validator now rejects duplicate visible answer-option labels in either Swedish or English before a question can count as schema-valid.
Next suggested validator action: review and accept this DATA-INTEGRITY schema atom, then keep `npm run validate:content` and `npm run test:content` as the nearest option-label regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Type-specific option-count schema atom for generated published questions.
Artifacts changed: `lib/content/derivedQuestions.ts`, `scripts/validate-content.js`, `scripts/content-production.test.js`, `scripts/derived-content.test.js`.
Verification: `npm run validate:content` passed and reported 500 `questionTypeOptionCountsValidated`; `npm run test:derived-content` passed 2/2; a direct generated-content shape check reported `single_choice:4` = 281, `true_false:2` = 219, bad single-choice count 0, bad true/false count 0; `npm run test:content` passed 4/4; `node scripts/export-question-bank.js --check` passed and reported 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js scripts/derived-content.test.js lib/content/derivedQuestions.ts` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js scripts/derived-content.test.js lib/content/derivedQuestions.ts docs/parallel-sessions/journals/data-integrity.md` passed.
Blocked? no - the validator now rejects `single_choice` questions without exactly four options while `derivePublishedQuestions` pads true/false-derived single-choice variants to four answer options.
Next suggested validator action: review and accept this DATA-INTEGRITY schema atom, then keep `npm run validate:content`, `npm run test:content`, and `npm run test:derived-content` as the nearest option-count regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Published question option-id convention schema atom.
Artifacts changed: `lib/content/derivedQuestions.ts`, `scripts/validate-content.js`, `scripts/content-production.test.js`, `scripts/derived-content.test.js`, `content/question-bank.csv`.
Verification: `npm run validate:content` passed and reported 500 `questionOptionIdConventionsValidated`; `npm run test:derived-content` passed 2/2; `npm run test:content` passed 4/4; `node scripts/export-question-bank.js --check` passed and reported 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check lib/content/derivedQuestions.ts scripts/validate-content.js scripts/content-production.test.js scripts/derived-content.test.js` passed; `git diff --check -- content/question-bank.csv lib/content/derivedQuestions.ts scripts/validate-content.js scripts/content-production.test.js scripts/derived-content.test.js docs/parallel-sessions/journals/data-integrity.md` passed.
Blocked? no - generated single-choice variants now normalize option ids to `a`/`b`/`c`/`d`, the validator rejects single-choice or true/false option-id convention drift, and the committed question-bank export is in parity with the current question source.
Next suggested validator action: review and accept this DATA-INTEGRITY schema atom, noting concurrent dirty source files outside this lane were already present during handoff and were not reverted by this lane.
