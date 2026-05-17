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

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Theme spacing-token schema and localized UHR source-material parity atom.
Artifacts changed: `scripts/content-production.test.js`, `tests/content-theme-token-schema.test.js`, `tests/content-source-material-link-parity.test.js`.
Verification: `npm run validate:content` passed and reported 24 `themeSpaceTokensValidated`, `themeTokenSchemaValidated:true`, `uhrSourceMaterialLinkParityValidated:true`, and 500 UHR references; `node --test tests/content-theme-token-schema.test.js tests/content-source-material-link-parity.test.js scripts/content-production.test.js` passed 4/4; `npm run test:content` passed 197/197; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check scripts/validate-content.js scripts/content-production.test.js tests/content-theme-token-schema.test.js tests/content-source-material-link-parity.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js tests/content-theme-token-schema.test.js tests/content-source-material-link-parity.test.js docs/parallel-sessions/journals/data-integrity.md` passed before this handoff append.
Blocked? no - the validator schema now matches the current 24-token spacing scale, and the source-material parity test now enforces the localized UHR education-material link labels used by `app/sources.tsx`.
Next suggested validator action: review and accept this DATA-INTEGRITY schema/parity atom, then keep `npm run validate:content` and `npm run test:content` as the nearest regression gates. Note that the shared checkout still contains pre-existing dirty files outside this atom.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Published question option bilingual-text negative schema coverage atom.
Artifacts changed: `tests/content-option-bilingual-text.test.js`.
Verification: `node --test tests/content-option-bilingual-text.test.js` passed 2/2 including the copied-label rejection; `npm run validate:content` passed and reported 500 `questionOptionBilingualTextPairsValidated`; `npm run test:content` passed 198/198; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check tests/content-option-bilingual-text.test.js` passed; `git diff --check -- tests/content-option-bilingual-text.test.js` passed.
Blocked? no - the dedicated option bilingual-text schema test now proves the validator rejects long answer-option labels copied between Swedish and English while preserving short intentional invariant labels.
Next suggested validator action: review and accept this DATA-INTEGRITY schema coverage atom, then keep `tests/content-option-bilingual-text.test.js`, `npm run validate:content`, and `npm run test:content` as the nearest regression gates. Note that the shared checkout still contains pre-existing dirty files outside this atom.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: UHR section-map adjacent page-range negative coverage atom.
Artifacts changed: `tests/content-uhr-map-page-ranges.test.js`.
Verification: `node --test tests/content-uhr-map-page-ranges.test.js` passed 2/2 including adjacent overlap rejection; `npm run validate:content` passed and reported 13 `uhrMapPageRangesValidated` plus 500 `uhrReferencesValidated`; `npm run test:content` passed 199/199; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check tests/content-uhr-map-page-ranges.test.js` passed; `git diff --check -- tests/content-uhr-map-page-ranges.test.js` passed.
Blocked? no - the dedicated UHR page-range test now proves the validator rejects an overlap where one chapter's `endPage` reaches the next chapter's `startPage`.
Next suggested validator action: review and accept this DATA-INTEGRITY UHR coverage atom, then keep `tests/content-uhr-map-page-ranges.test.js`, `npm run validate:content`, and `npm run test:content` as the nearest UHR map page-range regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: UHR section-map text-normalization negative coverage atom.
Artifacts changed: `package.json`, `tests/content-uhr-map-text-normalization.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `node --test tests/content-uhr-map-text-normalization.test.js` passed 2/2 including source title, chapter title, and section whitespace-drift rejection; `npm run validate:content` passed and reported 140 `uhrMapTextFieldsNormalizedValidated`, 13 `uhrMapChaptersValidated`, 110 `uhrMapSectionsValidated`, and 500 `uhrReferencesValidated`; `npm run test:content -- --test-concurrency=1` passed 201/201; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check package.json tests/content-uhr-map-text-normalization.test.js` passed; `git diff --check -- package.json tests/content-uhr-map-text-normalization.test.js docs/parallel-sessions/journals/data-integrity.md` passed before this handoff append.
Blocked? no - the dedicated UHR text-normalization test now proves the validator rejects leading/trailing or repeated whitespace in UHR section-map source, chapter, and section text.
Next suggested validator action: review and accept this DATA-INTEGRITY UHR coverage atom, then keep `tests/content-uhr-map-text-normalization.test.js`, `npm run validate:content`, and `npm run test:content` as the nearest UHR text-normalization regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Question-bank CSV public header negative parity coverage atom.
Artifacts changed: `tests/content-question-bank-csv-contract.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `node --test tests/content-question-bank-csv-contract.test.js` passed 2/2 including the in-memory header-drift rejection; `npm run validate:content` passed and reported 500 `questionBankCsvRowsValidated`; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npx prettier --check tests/content-question-bank-csv-contract.test.js` passed; `git diff --check -- tests/content-question-bank-csv-contract.test.js` passed; `npm run test:content -- --test-concurrency=1` passed 202/202; `npm run typecheck` passed; `npm run test:ownership` passed.
Blocked? no - the dedicated CSV contract test now proves the validator rejects drift in the committed public question-bank header, not only row-count/data happy path parity.
Next suggested validator action: review and accept this DATA-INTEGRITY parity coverage atom, then keep `tests/content-question-bank-csv-contract.test.js`, `npm run validate:content`, and `npm run test:content` as the nearest CSV contract regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Generated question tag-template exact parity negative coverage atom.
Artifacts changed: `tests/content-generated-tag-parity.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `node --test tests/content-generated-tag-parity.test.js` passed 2/2 including the extra generated-only tag rejection; `npm run validate:content` passed and reported 400 `generatedTagTemplateParityValidated`, 400 `generatedSourceMetadataParityValidated`, and 500 published questions; `npm run test:content -- --test-concurrency=1` passed 203/203; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npx prettier --check tests/content-generated-tag-parity.test.js` passed; `git diff --check -- tests/content-generated-tag-parity.test.js` passed.
Blocked? no - the dedicated generated-tag parity test now proves the validator rejects extra generated-only tags, not just missing source or convention tags.
Next suggested validator action: review and accept this DATA-INTEGRITY parity coverage atom, then keep `tests/content-generated-tag-parity.test.js`, `npm run validate:content`, and `npm run test:content` as the nearest generated tag-template regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Published question ID sequence negative schema coverage atom.
Artifacts changed: `tests/content-question-id-sequence.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `node --test tests/content-question-id-sequence.test.js` passed 2/2 including the in-memory q002-to-q001 duplicate/gap rejection; `npm run validate:content` passed and reported 500 `questionIdSequencesValidated`; `node scripts/export-question-bank.js --check` passed with 500-question parity; `npm run test:content -- --test-concurrency=1` passed 204/204 after a rerun; `npm run typecheck` passed; `npm run test:ownership` passed; `npx prettier --check tests/content-question-id-sequence.test.js` passed; `git diff --check -- tests/content-question-id-sequence.test.js docs/parallel-sessions/journals/data-integrity.md` passed.
Blocked? no - the dedicated ID-sequence test now proves the validator rejects a published question ID gap and duplicate, not only the happy-path 500-row count. Note: an earlier serialized content run failed while concurrent q085 content/CSV edits were half-applied in the shared checkout; the current rerun passed after those external edits reached parity.
Next suggested validator action: review and accept this DATA-INTEGRITY schema coverage atom, then keep `tests/content-question-id-sequence.test.js`, `npm run validate:content`, and serialized `npm run test:content` as the nearest question-ID regression gates.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Answer-shuffle validator/export parity atom.
Artifacts changed: `scripts/validate-content.js`, `scripts/content-production.test.js`, `tests/architecture-public-exports.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` passed and reported 282 `answerShuffleSingleChoiceQuestionsValidated`, 218 `answerShuffleTrueFalseQuestionsValidated`, 50 `answerShuffleSeedDistributionsValidated`, and `answerShuffleDistributionParityValidated:true`; `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` passed 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:answer-shuffle` passed 4/4; `NODE_OPTIONS='--v8-pool-size=1' node --test tests/architecture-public-exports.test.js` passed 1/1; `NODE_OPTIONS='--v8-pool-size=1' npm run test:architecture` passed 9/9; `NODE_OPTIONS='--v8-pool-size=1' node scripts/export-question-bank.js --check` passed with 500-question parity; `NODE_OPTIONS='--v8-pool-size=1' npm run test:content -- --test-concurrency=1` passed 204/204; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` passed; `NODE_OPTIONS='--v8-pool-size=1' npx prettier --check scripts/validate-content.js scripts/content-production.test.js tests/architecture-public-exports.test.js` passed; `git diff --check -- scripts/validate-content.js scripts/content-production.test.js tests/architecture-public-exports.test.js` passed before this handoff append.
Blocked? no - content validation now imports the answer-shuffle runtime helpers, verifies the public helper exports, rejects unbalanced correct-answer display distributions across 50 routed session seeds, preserves scoring after option id remapping, and keeps true/false option order fixed.
Next suggested validator action: review and accept this DATA-INTEGRITY parity atom, then keep `npm run validate:content`, `npm run test:content`, `npm run test:answer-shuffle`, and `npm run test:architecture` as the nearest answer-shuffle distribution regression gates. Note that the shared checkout still contains pre-existing dirty content, coordination, report, and prompt-backup files outside this atom.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Chapter metadata text-normalization negative schema coverage atom.
Artifacts changed: `tests/content-chapter-text-normalization.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `node --test tests/content-chapter-text-normalization.test.js` passed 2/2 including in-memory `nameSv` and `descriptionEn` whitespace-drift rejection; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` passed and reported 13 `chapterTextFieldsNormalizedValidated` plus 13 `chapterSchemasValidated`; `NODE_OPTIONS='--v8-pool-size=1' npm run test:content -- --test-concurrency=1` passed 205/205; `NODE_OPTIONS='--v8-pool-size=1' node scripts/export-question-bank.js --check` passed with 500-question parity; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` passed; `npx prettier --check tests/content-chapter-text-normalization.test.js` passed; `git diff --check -- tests/content-chapter-text-normalization.test.js` passed before this handoff append.
Blocked? no - the dedicated chapter text-normalization test now proves the validator rejects leading/trailing or repeated whitespace in chapter metadata, not only the 13-row happy path.
Next suggested validator action: review and accept this DATA-INTEGRITY schema coverage atom, then keep `tests/content-chapter-text-normalization.test.js`, `npm run validate:content`, and serialized `npm run test:content` as the nearest chapter metadata normalization regression gates. Note that the shared checkout still contains pre-existing unrelated dirty files outside this atom.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: UHR source retrieved-date ISO negative schema coverage atom.
Artifacts changed: `tests/content-uhr-source-metadata-schema.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-uhr-source-metadata-schema.test.js` passed 3/3 including non-ISO retrieved-date rejection; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` passed and reported `uhrSourceRetrievedDateValidated:true` plus 500 `uhrReferencesValidated`; `NODE_OPTIONS='--v8-pool-size=1' npm run test:content -- --test-concurrency=1` passed 206/206; `NODE_OPTIONS='--v8-pool-size=1' node scripts/export-question-bank.js --check` passed with 500-question parity; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` passed; `npx prettier --check tests/content-uhr-source-metadata-schema.test.js` passed; `git diff --check -- tests/content-uhr-source-metadata-schema.test.js` passed.
Blocked? no - the dedicated UHR source metadata test now proves the validator rejects non-ISO `retrievedDate` text as well as future dates.
Next suggested validator action: review and accept this DATA-INTEGRITY UHR schema coverage atom, then keep `tests/content-uhr-source-metadata-schema.test.js`, `npm run validate:content`, and serialized `npm run test:content` as the nearest UHR source metadata regression gates. Note that the shared checkout still contains pre-existing unrelated dirty files outside this atom.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: UHR source-material link path negative parity coverage atom.
Artifacts changed: `tests/content-source-material-link-parity.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-source-material-link-parity.test.js` passed 2/2 including off-path UHR map source URL rejection; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` passed and reported `uhrSourceMaterialLinkParityValidated:true` plus 500 `uhrReferencesValidated`; `NODE_OPTIONS='--v8-pool-size=1' node scripts/export-question-bank.js --check` passed with 500-question parity; `NODE_OPTIONS='--v8-pool-size=1' npm run test:content -- --test-concurrency=1` passed 207/207; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` passed; `npx prettier --check tests/content-source-material-link-parity.test.js` passed; `git diff --check -- tests/content-source-material-link-parity.test.js docs/parallel-sessions/journals/data-integrity.md` passed before this handoff append. An earlier serialized `npm run test:content` attempt failed while a concurrent CONTENT q091 data/CSV cleanup was mid-flight; the current rerun passed after that external content parity settled.
Blocked? no - the dedicated source-material link parity test now proves the validator rejects a `content/uhr-section-map.json` source PDF URL that stays on `www.uhr.se` but drifts outside the expected UHR education-material path.
Next suggested validator action: review and accept this DATA-INTEGRITY UHR parity coverage atom, then keep `tests/content-source-material-link-parity.test.js`, `npm run validate:content`, and serialized `npm run test:content` as the nearest source-material link regression gates. Note that the shared checkout still contains unrelated dirty content, SETUP architecture-manifest, coordination, report, and prompt-backup files outside this atom.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: UHR section-map duplicate-section negative coverage atom.
Artifacts changed: `package.json`, `tests/content-uhr-map-section-uniqueness.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-uhr-map-section-uniqueness.test.js` passed 2/2 including duplicate section rejection; `npx prettier --check package.json tests/content-uhr-map-section-uniqueness.test.js` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` passed and reported 110 `uhrMapSectionsValidated`, 13 `uhrMapChaptersValidated`, and 500 `uhrReferencesValidated`; `NODE_OPTIONS='--v8-pool-size=1' npm run test:content -- --test-concurrency=1` passed 209/209; `NODE_OPTIONS='--v8-pool-size=1' node scripts/export-question-bank.js --check` passed with 500-question parity; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` passed; `git diff --check -- package.json tests/content-uhr-map-section-uniqueness.test.js docs/parallel-sessions/journals/data-integrity.md` passed before this handoff append.
Blocked? no - the dedicated UHR section-map uniqueness test now proves the validator rejects duplicate section titles inside a chapter, not only missing, blank, or unlisted UHR sections.
Next suggested validator action: review and accept this DATA-INTEGRITY UHR coverage atom, then keep `tests/content-uhr-map-section-uniqueness.test.js`, `npm run validate:content`, and serialized `npm run test:content` as the nearest duplicate-section regression gates. Note that the shared checkout still contains unrelated accepted DATA-INTEGRITY tests, SETUP architecture-manifest files, coordination, report, and prompt-backup files outside this atom.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Published question type negative schema coverage atom.
Artifacts changed: `tests/content-published-question-types.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-published-question-types.test.js` passed 2/2 including the in-memory published `flashcard` rejection; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` passed and reported 500 `publishedQuestionTypesValidated`; `NODE_OPTIONS='--v8-pool-size=1' node scripts/export-question-bank.js --check` passed with 500-question parity; `NODE_OPTIONS='--v8-pool-size=1' npm run test:content -- --test-concurrency=1` passed 210/210 after the external q093 content/CSV diff appeared; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` passed; `npx prettier --check tests/content-published-question-types.test.js` passed; `git diff --check -- tests/content-published-question-types.test.js docs/parallel-sessions/journals/data-integrity.md data/additionalQuestions.ts content/question-bank.csv` passed after this handoff append.
Blocked? no - the dedicated published-question type test now proves the validator rejects a published `flashcard` question as non-answerable instead of only counting the 500-row happy path.
Next suggested validator action: review and accept this DATA-INTEGRITY schema coverage atom, then keep `tests/content-published-question-types.test.js`, `npm run validate:content`, and serialized `npm run test:content` as the nearest published question type regression gates. Note that an unrelated q093 CONTENT commit landed while this atom was being verified, and the shared checkout still contains unrelated dirty coordination, release-config, report, SETUP architecture-manifest, and accepted DATA-INTEGRITY test files outside this atom.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Authored source publication field-drift negative parity coverage atom.
Artifacts changed: `tests/content-authored-source-parity.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-authored-source-parity.test.js` passed 2/2 including in-memory published `sourceQuestions` `explanationEn` drift rejection; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` passed and reported 100 `authoredSourceQuestionsValidated` plus 100 `sourcePublicationParityValidated`; `NODE_OPTIONS='--v8-pool-size=1' node scripts/export-question-bank.js --check` passed with 500-question parity; first serialized `NODE_OPTIONS='--v8-pool-size=1' npm run test:content -- --test-concurrency=1` failed while an external q094 CONTENT/CSV update was mid-flight, then the current rerun passed 211/211 after that external parity settled; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` passed; `npx prettier --check tests/content-authored-source-parity.test.js` passed; `git diff --check -- tests/content-authored-source-parity.test.js` passed before this handoff append.
Blocked? no - the dedicated authored-source parity test now proves the validator rejects published source rows that drift from reviewed authored fields, not only the 100-row happy path.
Next suggested validator action: review and accept this DATA-INTEGRITY parity coverage atom, then keep `tests/content-authored-source-parity.test.js`, `npm run validate:content`, and serialized `npm run test:content` as the nearest authored-source publication drift regression gates. Note that the shared checkout still contains unrelated q094 CONTENT/CSV edits, accepted dirty DATA-INTEGRITY tests, SETUP architecture-manifest files, coordination/report files, and prompt-backup files outside this atom.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Published question tag-schema negative coverage atom.
Artifacts changed: `package.json`, `tests/content-question-tag-schema.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-question-tag-schema.test.js` passed 2/2 including malformed and duplicate tag rejection; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` passed and reported 500 `questionTagsValidated`; `NODE_OPTIONS='--v8-pool-size=1' node scripts/export-question-bank.js --check` passed with 500-question parity; `NODE_OPTIONS='--v8-pool-size=1' npm run test:content -- --test-concurrency=1` passed 213/213 with the new tag-schema test wired into `test:content`; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` passed; `npx prettier --check package.json tests/content-question-tag-schema.test.js` passed; `git diff --check -- package.json tests/content-question-tag-schema.test.js` passed.
Blocked? no - the dedicated published-question tag schema test now proves the validator rejects malformed uppercase/space tags and duplicate tags, not only the 500-row happy path.
Next suggested validator action: review and accept this DATA-INTEGRITY schema coverage atom, then keep `tests/content-question-tag-schema.test.js`, `npm run validate:content`, and serialized `npm run test:content` as the nearest question-tag regression gates. Note that the shared checkout still contains unrelated dirty coordination, release-config, report, SETUP architecture-manifest, and previously accepted DATA-INTEGRITY test files outside this atom.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Question chapter/UHR reference parity negative coverage atom.
Artifacts changed: `tests/content-uhr-chapter-parity.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-uhr-chapter-parity.test.js` passed 2/2 including in-memory `q001` chapter drift rejection; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` passed and reported 500 `questionChapterReferenceParityValidated` plus 500 `uhrReferencesValidated`; `NODE_OPTIONS='--v8-pool-size=1' node scripts/export-question-bank.js --check` passed with 500-question parity; `NODE_OPTIONS='--v8-pool-size=1' npm run test:content -- --test-concurrency=1` passed 214/214 with the updated UHR chapter parity test; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` passed; `npx prettier --check tests/content-uhr-chapter-parity.test.js` passed; `git diff --check -- tests/content-uhr-chapter-parity.test.js docs/parallel-sessions/journals/data-integrity.md` passed before this handoff append.
Blocked? no - the dedicated UHR chapter parity test now proves the validator rejects a question whose app `chapterId` drifts away from the chapter mapped by its UHR reference.
Next suggested validator action: review and accept this DATA-INTEGRITY UHR parity coverage atom, then keep `tests/content-uhr-chapter-parity.test.js`, `npm run validate:content`, and serialized `npm run test:content` as the nearest chapter/reference regression gates. Note that the shared checkout still contains unrelated dirty coordination, report, prompt-backup, SETUP architecture-manifest, and accepted DATA-INTEGRITY test files outside this atom.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: UHR reference unknown-chapter negative coverage atom.
Artifacts changed: `tests/content-uhr-reference-section-page-parity.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-uhr-reference-section-page-parity.test.js` passed 4/4 including in-memory `q072` unknown UHR chapter rejection; `npx prettier --check tests/content-uhr-reference-section-page-parity.test.js` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` passed and reported 500 `uhrReferencesValidated` plus 500 `questionChapterReferenceParityValidated`; `NODE_OPTIONS='--v8-pool-size=1' node scripts/export-question-bank.js --check` passed with 500-question parity; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run test:content -- --test-concurrency=1` passed 215/215 with the updated UHR reference section/page test.
Blocked? no - the dedicated UHR reference section/page parity test now proves the validator rejects question references whose UHR chapter is absent from `content/uhr-section-map.json`, not only bad sections or out-of-range pages.
Next suggested validator action: review and accept this DATA-INTEGRITY UHR reference coverage atom, then keep `tests/content-uhr-reference-section-page-parity.test.js`, `npm run validate:content`, and serialized `npm run test:content` as the nearest unknown-UHR-chapter regression gates. Note that the shared checkout still contains unrelated dirty coordination, report, prompt-backup, SETUP architecture-manifest, and accepted DATA-INTEGRITY test files outside this atom.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: Source-citation stem negative coverage atom for the public question-bank export.
Artifacts changed: `tests/content-uhr-source-citation-stem.test.js`, `docs/parallel-sessions/journals/data-integrity.md`.
Verification: `NODE_OPTIONS='--v8-pool-size=1' node --test tests/content-uhr-source-citation-stem.test.js` passed 2/2 including in-memory exported CSV connective-phrase rejection; `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content` passed with 500 `questionBankCsvRowsValidated`, 400 `generatedPromptTemplateParityValidated`, 500 `questionAuthorityBoundaryTextValidated`, and 500 `uhrReferencesValidated`; `NODE_OPTIONS='--v8-pool-size=1' node scripts/export-question-bank.js --check` passed with 500-question parity; `npx prettier --check tests/content-uhr-source-citation-stem.test.js` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run test:content -- --test-concurrency=1` passed 214/214 after concurrent CONTENT q098 CSV parity settled; `NODE_OPTIONS='--v8-pool-size=1' npm run typecheck` passed; `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` passed; `git diff --check -- tests/content-uhr-source-citation-stem.test.js docs/parallel-sessions/journals/data-integrity.md` passed.
Blocked? no - the dedicated source-citation stem test now proves the public export gate rejects both Swedish and English UHR-source connective phrasing if it reappears in `questionSv` or `questionEn`, not only that the current CSV is clean. Separate non-DATA-INTEGRITY dirty files appeared during verification and are outside this atom.
Next suggested validator action: review and accept this DATA-INTEGRITY source-citation coverage atom, then keep `tests/content-uhr-source-citation-stem.test.js`, `npm run validate:content`, `node scripts/export-question-bank.js --check`, and serialized `npm run test:content` as the nearest regression gates.
