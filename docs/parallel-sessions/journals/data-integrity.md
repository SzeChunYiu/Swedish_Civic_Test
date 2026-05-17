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

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: UHR section-map source metadata validation atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`.
Verification: `npm run validate:content` passed and reported `uhrSourceMetadataValidated: true` with 500 published questions and 500 UHR references; `npm run test:content` passed 4/4; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js docs/parallel-sessions/journals/data-integrity.md` passed.
Blocked? no - the validator now rejects UHR section maps that are not tied to the expected `Sverige i fokus` UHR source URL, publisher, and ISO retrieved date.
Next suggested validator action: review and accept this DATA-INTEGRITY UHR-reference atom, then keep `npm run validate:content` and `npm run test:content` as the nearest source-metadata regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Published question tag slug schema atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`.
Verification: `npm run validate:content` passed and reported 500 `questionTagsValidated`; `npm run test:content` passed 4/4; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js docs/parallel-sessions/journals/data-integrity.md` passed.
Blocked? no - the content validator now rejects blank, duplicate, or non-lowercase-kebab-case tags before a question can count as schema-valid.
Next suggested validator action: review and accept this DATA-INTEGRITY schema atom, then keep `npm run validate:content` and `npm run test:content` as the nearest tag-schema regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Generated question source-metadata parity atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`.
Verification: `npm run validate:content` passed and reported 400 `generatedSourceMetadataParityValidated`; `npm run test:content` passed 4/4; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` passed.
Blocked? no - the content validator now rejects generated variants that drift from their source question chapter, difficulty, explanations, UHR reference, required source tags, or generated-variant convention tags.
Next suggested validator action: review and accept this DATA-INTEGRITY parity atom, then keep `npm run validate:content` and `npm run test:content` as the nearest generated-source metadata regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Generated question source-metadata parity atom verification addendum.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `npm run validate:content` passed and reported 400 `generatedSourceMetadataParityValidated`; `npm run test:content` passed 4/4; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js docs/parallel-sessions/journals/data-integrity.md` passed; in-memory negative check against `scripts/validate-content.js` passed by rejecting a generated-variant difficulty drift with `generated variant[0] difficulty does not match source question`.
Blocked? no - the atom is verified against both positive content gates and a targeted negative drift case.
Next suggested validator action: review and accept this DATA-INTEGRITY parity atom as the next DI row, then keep `npm run validate:content` and `npm run test:content` as the nearest generated-source metadata regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Published question prompt uniqueness schema atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`, `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `npm run validate:content` passed and reported 500 `questionPromptTextUniquenessValidated`; `npm run test:content` passed 4/4; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check data/additionalQuestions.ts scripts/validate-content.js scripts/content-production.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js data/additionalQuestions.ts content/question-bank.csv docs/parallel-sessions/journals/data-integrity.md` passed; temp-copy negative check passed by rejecting duplicated q022/q017 Swedish and English prompt text.
Blocked? no - the content validator now rejects duplicate published question prompts in either Swedish or English, and q022 was moved from a duplicate Riksdag member-count prompt to a separate UHR `Staten` law-and-budget role prompt before regenerating the CSV export.
Next suggested validator action: review and accept this DATA-INTEGRITY schema atom, then keep `npm run validate:content` and `npm run test:content` as the nearest prompt-uniqueness regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Generated question prompt-template parity atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `npm run validate:content` passed and reported 400 `generatedPromptTemplateParityValidated`; `npm run test:content` passed 4/4; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js docs/parallel-sessions/journals/data-integrity.md` passed before this handoff append; temp-copy negative check passed by rejecting a mutated generated section-practice prompt template with `questionSv does not match generated prompt template`.
Blocked? no - the content validator now rejects generated variants whose Swedish or English prompts drift from the source question prompt and answer labels.
Next suggested validator action: review and accept this DATA-INTEGRITY parity atom, then keep `npm run validate:content` and `npm run test:content` as the nearest generated prompt-template regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Generated question answer-template parity atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `npm run validate:content` passed and reported 400 `generatedAnswerTemplateParityValidated`; `npm run test:content` passed 4/4; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js docs/parallel-sessions/journals/data-integrity.md` passed; in-memory negative check passed by rejecting a generated variant whose `correctOptionId` no longer matched the generated answer template.
Blocked? no - the content validator now rejects generated variants whose answer options or correct answer drift from the section-practice, true-statement, false-statement, and judgement answer templates.
Next suggested validator action: review and accept this DATA-INTEGRITY parity atom, then keep `npm run validate:content` and `npm run test:content` as the nearest generated answer-template regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Published question bilingual text-pair schema atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`, `tests/content-bilingual-text-parity.test.js`, `package.json` (`test:content` entry), `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `npm run validate:content` passed and reported 500 `questionBilingualTextPairsValidated`; `npm run test:content` passed 5/5 including the new bilingual text-pair test; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check package.json scripts/validate-content.js scripts/content-production.test.js tests/content-bilingual-text-parity.test.js` passed; `git diff --check -- package.json scripts/validate-content.js scripts/content-production.test.js tests/content-bilingual-text-parity.test.js docs/parallel-sessions/journals/data-integrity.md` passed; in-memory negative checks passed by rejecting q001 when `questionEn` matched `questionSv` and when `explanationEn` matched `explanationSv`.
Blocked? no - the content validator now rejects published questions whose Swedish and English prompt or explanation text collapses to the same normalized string. Note: shared checkout has unrelated dirty files outside this atom; DATA-INTEGRITY did not touch them.
Next suggested validator action: review and accept this DATA-INTEGRITY schema atom, then keep `npm run validate:content` and `npm run test:content` as the nearest bilingual content regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Chapter metadata schema atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`, `tests/content-chapter-schema.test.js`, `package.json` (`test:content` entry), `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `npm run validate:content` passed and reported 13 `chapterSchemasValidated`; `npm run test:content` passed 6/6 including the new chapter schema test; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check package.json scripts/validate-content.js scripts/content-production.test.js tests/content-chapter-schema.test.js` passed; `git diff --check -- package.json scripts/validate-content.js scripts/content-production.test.js tests/content-chapter-schema.test.js` passed; in-memory negative check passed by rejecting a copied chapter bilingual name with `ch01 nameSv and nameEn must be distinct bilingual text`.
Blocked? no - the content validator now rejects chapter metadata with non-sequential ids, duplicate chapter ids or names, blank bilingual fields, copied Swedish/English chapter text, or invalid positive question counts.
Next suggested validator action: review and accept this DATA-INTEGRITY schema atom, then keep `npm run validate:content` and `npm run test:content` as the nearest chapter metadata regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: True/false option-label convention schema atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `npm run validate:content` passed and reported 218 `trueFalseQuestions` plus 218 `trueFalseOptionLabelsValidated`; `npm run test:content` passed 6/6; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js docs/parallel-sessions/journals/data-integrity.md` passed; temp-copy negative check passed by rejecting a mutated `q002` true/false Swedish label with `true_false questions must use true/false option ids and labels in order`.
Blocked? no - the content validator now rejects published `true_false` questions whose visible Swedish/English option labels drift from the canonical `Sant`/`Falskt` and `True`/`False` labels, not just the `true`/`false` option ids.
Next suggested validator action: review and accept this DATA-INTEGRITY schema atom, then keep `npm run validate:content` and `npm run test:content` as the nearest true/false option-label regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Published question text-normalization schema atom.
Commit: `72a4c82` (`data-integrity: validate content text normalization`)
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`.
Verification: `npm run validate:content` passed and reported 500 `questionTextFieldsNormalizedValidated`; `npm run test:content` passed 6/6; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` passed; temp-copy negative check passed by rejecting a mutated q001 prompt with `questionSv must be trimmed and single-spaced`.
Blocked? no - the content validator now rejects published question prompt, explanation, answer-option, and UHR reference chapter/section text with leading/trailing or repeated whitespace before counting the question as schema-valid.
Next suggested validator action: review and accept this DATA-INTEGRITY schema atom, then keep `npm run validate:content` and `npm run test:content` as the nearest text-normalization regression gates.
