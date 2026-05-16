
Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-EXAM-SCOPE-1 — schema/parity atom requiring published question-bank items to carry `examScope: "uhr_based"` and mock exam generation to exclude non-UHR scopes.
Artifacts changed:
- `types/content.ts` — added `ExamScope` and `DraftPracticeQuestion` schema types; `PracticeQuestion` now carries required `examScope`.
- `data/additionalQuestions.ts` — builder-created source questions now set `examScope: "uhr_based"`.
- `data/questions.ts` — base authored questions use draft typing and are published through the normal publisher.
- `lib/content/derivedQuestions.ts` — publishing/derived variants normalize/preserve `examScope`.
- `lib/quiz/examGenerator.ts` — mock exam selection now requires `examScope === "uhr_based"` in addition to reviewed/published UHR references.
- `scripts/validate-content.js` — content validator fails any published question bank row without `examScope: "uhr_based"`.
- `scripts/exam.test.js` — exam test fixture includes `examScope`, with a non-UHR context question proving exclusion.
Verification:
- `node scripts/validate-content.js` → PASS (`Content validation OK`, 13 chapters, 500 questions, 500 published questions).
- Scope audit transpiling `data/questions.ts` → PASS (`total: 500`, `scopes.uhr_based: 500`, `missing: 0`).
- `npm run test:exam` → PASS (8/8 node tests).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check types/content.ts data/additionalQuestions.ts data/questions.ts lib/content/derivedQuestions.ts lib/quiz/examGenerator.ts scripts/validate-content.js scripts/exam.test.js` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:content` → PASS (1/1 node test).
- `NODE_OPTIONS='--v8-pool-size=1' npx tsc --noEmit --pretty false` → PASS (exit 0).
Blocked? no — resource contention caused one earlier unbounded content-test attempt to hang/EAGAIN while other panes had export/prettier jobs; reran after guard cleared with `NODE_OPTIONS='--v8-pool-size=1'` and passed.
Next suggested validator action: Review/accept DATA-INTEGRITY-EXAM-SCOPE-1 as a verified schema/parity atom; if accepted, consider a later atom that carries richer UHR reference metadata (`sourceUrl`/document title/edition) from the project schema.

Amendment: Current data diff also contains a reviewed UHR reference seed `q501` for `Valborgsmässoafton` and a `TARGET_QUESTION_COUNT` cap that keeps the exported bank at 500 after adding the source seed. I verified the Valborg fact/reference against the UHR `Sverige i fokus` PDF search result: page 46, chapter 13 `Traditioner och högtider`, section `Valborgsmässoafton`, describing 30 April, large evening bonfires, and traditional spring songs. Existing verification above includes this current diff and confirms the public `questions` export remains exactly 500 published `uhr_based` items.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-UHR-SOURCE-METADATA-1 — schema/UHR-reference atom requiring every published question-bank UHR reference to carry source document title, source edition, and direct UHR PDF URL metadata.
Artifacts changed:
- `types/content.ts` — `UHRReference` now includes `documentTitle`, `sourceEdition`, and `sourceUrl`; draft references can remain compact before publishing.
- `lib/content/derivedQuestions.ts` — publishing normalizes draft references with default UHR source metadata for `Sverige i fokus: Utbildningsmaterial till medborgarskapsprov`, `2026, 1:a upplagan`, and the direct UHR PDF URL.
- `data/additionalQuestions.ts` — helper return types now use draft question/reference types so authored refs stay compact while published refs are normalized.
- `scripts/validate-content.js` — validator fails any exported question whose UHR reference lacks the expected source metadata and reports `uhrSourceMetadataComplete`.
- `scripts/derived-content.test.js` and `scripts/content-production.test.js` — focused regression coverage for source metadata normalization and 500/500 complete published refs.
- `scripts/export-question-bank.js` and `content/question-bank.csv` — CSV export now includes `uhrDocumentTitle`, `uhrSourceEdition`, and `uhrSourceUrl` columns.
Verification:
- Official UHR source checked: `https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/` links `Sverige i fokus. Utbildningsmaterial till medborgarskapsprov. Grundläggande kunskaper om det svenska samhället. 1:a upplagan`; direct PDF URL used in schema metadata.
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `uhrSourceMetadataComplete: 500`).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/derived-content.test.js scripts/content-production.test.js` → PASS (2/2).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --target ES2020 --module commonjs --moduleResolution node types/content.ts lib/content/derivedQuestions.ts data/additionalQuestions.ts data/questions.ts` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check types/content.ts lib/content/derivedQuestions.ts data/additionalQuestions.ts scripts/validate-content.js scripts/derived-content.test.js scripts/content-production.test.js scripts/export-question-bank.js` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run content:export` → PASS; CSV header includes `uhrDocumentTitle,uhrSourceEdition,uhrSourceUrl`.
- `NODE_OPTIONS='--v8-pool-size=1' npx tsc --noEmit --pretty false` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run validate:content && NODE_OPTIONS='--v8-pool-size=1' npm run test:derived-content && NODE_OPTIONS='--v8-pool-size=1' npm run test:content` → PASS.
Blocked? no — used low-thread verification only; no export/Playwright resource contention needed for this data atom.
Next suggested validator action: Review/accept DATA-INTEGRITY-UHR-SOURCE-METADATA-1 as a verified UHR-reference/schema atom; next data-integrity atom can validate section/page ranges against a maintained chapter map without touching UI route proof.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-CHAPTER-PARITY-1 — parity atom requiring every published question's `chapterId` to agree with the Swedish UHR chapter title stored in `uhrReference.chapter`.
Artifacts changed:
- `data/questions.ts` — corrected base questions q010, q016, q017, q018, q019, and q020 so their app chapter IDs match their cited UHR chapters before derived variants are published.
- `scripts/validate-content.js` — content validator now fails any question whose `uhrReference.chapter` does not match the `nameSv` for its `chapterId`, and reports `chapterTitleParityComplete`.
- `scripts/content-production.test.js` — production content regression now asserts all 500 published questions pass chapter-title parity.
Verification:
- Official UHR PDF spot-check: `Sverige i fokus` lines around the Stockholm/municipality fact place it under `Så här styrs Sverige`, `Kommunernas ansvar`; riksdag/prime minister facts under `Så här styrs Sverige`, `Staten`; voting/referendum facts under `Politiska val och partier`.
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `uhrSourceMetadataComplete: 500`, `chapterTitleParityComplete: 500`).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (1/1).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check data/questions.ts scripts/validate-content.js scripts/content-production.test.js` → PASS.
- Focused parity audit transpiling `data/questions.ts` and `data/chapters.ts` → PASS (`total: 500`, `mismatches: 0`).
Blocked? no — used low-thread focused data validation only; no export/Playwright/broad TypeScript during active export guard.
Next suggested validator action: Review/accept DATA-INTEGRITY-CHAPTER-PARITY-1 as a verified data parity atom; next DATA-INTEGRITY atom can add page-range/section coverage once one owner has a maintained UHR reference map.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-UHR-PAGE-RANGE-PARITY-1 — parity atom requiring every published question's `uhrReference.pageApprox` to fall within the UHR chapter page range for its `chapterId`.
Artifacts changed:
- `data/uhrReferenceMap.ts` — added a maintained 13-chapter UHR page-range map keyed by app chapter id and Swedish chapter title.
- `scripts/validate-content.js` — validator now loads the map, checks map/title consistency against `data/chapters.ts`, fails out-of-range UHR pages, and reports `uhrPageRangeParityComplete`.
- `scripts/content-production.test.js` — production content regression now asserts all 500 published questions pass UHR page-range parity.
Verification:
- Source audit: `tmp/uhr/sverige-i-fokus.txt` table of contents pages 2-3 lists the official UHR chapter starts (5, 10, 12, 14, 16, 20, 22, 27, 30, 32, 39, 42, 45); ranges end before the next chapter start, with the final traditions chapter references covered through page 47.
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `uhrSourceMetadataComplete: 500`, `chapterTitleParityComplete: 500`, `uhrPageRangeParityComplete: 500`).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (1/1).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check data/uhrReferenceMap.ts scripts/validate-content.js scripts/content-production.test.js` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --target ES2020 --module commonjs --moduleResolution node data/uhrReferenceMap.ts` → PASS.
Blocked? no — used low-thread content/schema verification only; no export/Playwright resource needed.
Next suggested validator action: Review/accept DATA-INTEGRITY-UHR-PAGE-RANGE-PARITY-1 as a verified UHR reference parity atom; next data atom can add section-heading normalization or export the page-range map to the CSV if desired.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-UHR-CSV-PAGE-RANGE-1 — UHR reference/export atom requiring the generated question-bank CSV to carry the maintained UHR chapter page range next to each exported question's approximate page.
Artifacts changed:
- `scripts/export-question-bank.js` — loads `data/uhrReferenceMap.ts`, fails export when a question has no chapter page range, and writes `uhrChapterStartPage`/`uhrChapterEndPage` columns.
- `content/question-bank.csv` — regenerated 500 exported rows with UHR chapter start/end page columns plus existing source metadata.
- `scripts/content-production.test.js` — added CSV regression coverage that parses the persisted export, checks the new page-range columns, and verifies every row's `uhrPageApprox` falls within the exported range.
Verification:
- Source basis: existing `data/uhrReferenceMap.ts` ranges trace to `tmp/uhr/sverige-i-fokus.txt` table of contents, pages 2-3, which lists UHR chapter starts 5, 10, 12, 14, 16, 20, 22, 27, 30, 32, 39, 42, and 45; ranges end before the next chapter start, with the traditions chapter covered through page 47.
- `NODE_OPTIONS='--v8-pool-size=1' npm run content:export` → PASS (`Exported 500 questions to content/question-bank.csv`).
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `uhrSourceMetadataComplete: 500`, `chapterTitleParityComplete: 500`, `uhrPageRangeParityComplete: 500`).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (2/2).
- Focused CSV audit script → PASS (`{"rows":500,"pageRangeCsvComplete":500}`).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check scripts/export-question-bank.js scripts/content-production.test.js` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' git diff --check -- scripts/export-question-bank.js scripts/content-production.test.js content/question-bank.csv` → PASS.
Blocked? no — one attempted Prettier check included `content/question-bank.csv`, but Prettier has no CSV parser; replaced with focused JS Prettier plus `git diff --check` for the CSV. No export/Playwright or broad TypeScript was started.
Next suggested validator action: Review/accept DATA-INTEGRITY-UHR-CSV-PAGE-RANGE-1 as a verified UHR reference export atom; next DATA-INTEGRITY atom can add a dedicated test that compares the maintained page-range map against `data/chapters.ts` without going through the full validator.
- Post-handoff ownership gate: `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1), confirming the new CSV/export/test/journal atom did not introduce blocked ownership text.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-UHR-MAP-DIRECT-TEST-1 — parity atom adding a focused regression test for the maintained UHR page-range map, independent of the full content validator.
Artifacts changed:
- `scripts/uhr-reference-map.test.js` — new direct parity test that loads `data/chapters.ts` and `data/uhrReferenceMap.ts`, requires all 13 app chapters in order, checks the Swedish chapter titles, checks the official UHR table-of-contents start pages, and verifies contiguous end pages through page 47.
Verification:
- Source basis: `tmp/uhr/sverige-i-fokus.txt` pages 2-3 table of contents lists chapter starts at pages 5, 10, 12, 14, 16, 20, 22, 27, 30, 32, 39, 42, and 45; the final traditions chapter references are covered through page 47.
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/uhr-reference-map.test.js` → PASS (1/1).
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `uhrSourceMetadataComplete: 500`, `chapterTitleParityComplete: 500`, `uhrPageRangeParityComplete: 500`).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js scripts/uhr-reference-map.test.js` → PASS (3/3).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check scripts/uhr-reference-map.test.js` → PASS.
- `git diff --check -- scripts/uhr-reference-map.test.js` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used low-thread focused data/test commands only; no app export, Playwright, or broad TypeScript started.
Next suggested validator action: Review/accept DATA-INTEGRITY-UHR-MAP-DIRECT-TEST-1 as a verified parity/test atom; next DATA-INTEGRITY atom can add section-heading normalization or CSV section coverage if desired.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-UHR-SECTION-PARITY-1 — parity atom requiring every published question's `uhrReference.section` to be present in the maintained UHR reference map for its chapter and for `pageApprox` to fall inside that section's mapped page range.
Artifacts changed:
- `data/uhrReferenceMap.ts` — extended each chapter map entry with reviewed UHR section ranges for the section labels currently allowed in published question references.
- `scripts/validate-content.js` — validator now fails unmapped UHR sections and section/page mismatches, and reports `uhrSectionParityComplete`.
- `scripts/content-production.test.js` — production content regression now asserts all 500 published questions pass section parity.
- `scripts/uhr-reference-map.test.js` — direct map regression now checks expected per-chapter section ranges, duplicate-free section titles, and section containment inside chapter page ranges.
Verification:
- Source basis: `tmp/uhr/sverige-i-fokus.txt` text extracted from the UHR `Sverige i fokus` PDF; table of contents pages 2-3 plus chapter text pages 5-47 were used to map section labels and page spans.
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `uhrSectionParityComplete: 500`).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/uhr-reference-map.test.js scripts/content-production.test.js` → PASS (3/3).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check data/uhrReferenceMap.ts scripts/validate-content.js scripts/content-production.test.js scripts/uhr-reference-map.test.js` → PASS.
- `git diff --check -- data/uhrReferenceMap.ts scripts/validate-content.js scripts/content-production.test.js scripts/uhr-reference-map.test.js` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --target ES2020 --module commonjs --moduleResolution node data/uhrReferenceMap.ts` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used low-thread data/schema/test verification only; no export, browser, or broad TypeScript proof started.
Next suggested validator action: Review/accept DATA-INTEGRITY-UHR-SECTION-PARITY-1 as a verified UHR section parity atom; next DATA-INTEGRITY atom can export section start/end pages to the CSV if desired.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-UHR-CSV-SECTION-RANGE-1 — UHR reference/export atom requiring the generated question-bank CSV to carry maintained UHR section start/end page ranges next to each exported question's approximate page.
Artifacts changed:
- `scripts/export-question-bank.js` — now resolves each question's mapped UHR section range and fails export if the section is missing from `data/uhrReferenceMap.ts`.
- `content/question-bank.csv` — regenerated 500 exported rows with `uhrSectionStartPage` and `uhrSectionEndPage` columns.
- `scripts/content-production.test.js` — CSV regression now checks section range columns and verifies every exported `uhrPageApprox` falls inside the exported section range.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' npm run content:export` → PASS (`Exported 500 questions to content/question-bank.csv`).
- CSV header check → PASS: header includes `uhrSectionStartPage,uhrSectionEndPage`.
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `uhrSectionParityComplete: 500`).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (2/2).
- Focused CSV audit script → PASS (`{"rows":500,"sectionRangeColumns":2}`).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check scripts/export-question-bank.js scripts/content-production.test.js data/uhrReferenceMap.ts scripts/validate-content.js scripts/uhr-reference-map.test.js` → PASS.
- `git diff --check -- scripts/export-question-bank.js scripts/content-production.test.js content/question-bank.csv data/uhrReferenceMap.ts scripts/validate-content.js scripts/uhr-reference-map.test.js docs/parallel-sessions/journals/data-integrity.md` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used low-thread export/content checks only; no browser/export-web or broad TypeScript proof started.
Next suggested validator action: Review/accept DATA-INTEGRITY-UHR-CSV-SECTION-RANGE-1 as a verified UHR reference export atom; next DATA-INTEGRITY atom can add a dedicated derived-content guard to prove generated variants preserve the exact section metadata object.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-UHR-MAP-RESOLVER-1 — parity atom centralizing UHR chapter/section/page lookup in the maintained UHR reference map so validators and exports use the same resolver instead of separate ad hoc scans.
Artifacts changed:
- `data/uhrReferenceMap.ts` — added canonical `findUhrChapterPageRange`, `findUhrSectionReference`, and `isPageInsideUhrRange` helpers beside the maintained UHR chapter/section ranges.
- `scripts/validate-content.js` — now uses the shared UHR map helpers for chapter page parity, section parity, and parity summary counts.
- `scripts/export-question-bank.js` — now resolves exported chapter and section range columns through the same UHR map helpers and still fails missing mappings.
- `scripts/uhr-reference-map.test.js` — added direct coverage for the canonical resolver on the reviewed ch13/Valborg section range and negative out-of-range/missing-section cases.
Verification:
- Source basis: existing `data/uhrReferenceMap.ts` ranges trace to `tmp/uhr/sverige-i-fokus.txt` table-of-contents pages 2-3 and reviewed section spans across UHR PDF text pages 5-47; this atom does not alter those facts, only centralizes their resolver.
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/uhr-reference-map.test.js` → PASS (2/2).
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `uhrSourceMetadataComplete: 500`, `chapterTitleParityComplete: 500`, `uhrPageRangeParityComplete: 500`, `uhrSectionParityComplete: 500`).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js scripts/uhr-reference-map.test.js` → PASS (4/4).
- `NODE_OPTIONS='--v8-pool-size=1' npm run content:export` → PASS (`Exported 500 questions to content/question-bank.csv`).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check data/uhrReferenceMap.ts scripts/validate-content.js scripts/export-question-bank.js scripts/uhr-reference-map.test.js scripts/content-production.test.js` → PASS.
- `git diff --check -- data/uhrReferenceMap.ts scripts/validate-content.js scripts/export-question-bank.js scripts/uhr-reference-map.test.js scripts/content-production.test.js content/question-bank.csv` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --target ES2020 --module commonjs --moduleResolution node data/uhrReferenceMap.ts` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used low-thread map/content/export checks only; no browser, Expo export, or broad TypeScript proof started.
Next suggested validator action: Review/accept DATA-INTEGRITY-UHR-MAP-RESOLVER-1 as a verified parity/refactor atom; next DATA-INTEGRITY atom can add a derived-content guard proving generated variants preserve the exact normalized UHR reference values.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-DERIVED-UHR-REFERENCE-PARITY-1 — parity atom proving generated question variants preserve the exact normalized UHR reference and exam scope from their source question.
Artifacts changed:
- `scripts/content-production.test.js` — added a production-content regression that loads `sourceQuestions` and `generatedPublishedQuestions`, maps every generated `q101+` variant back to its source by derivation offset, and asserts exact `uhrReference`, `examScope`, `chapterId`, and published status parity.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (3/3), including the new generated UHR-reference parity subtest.
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `uhrSourceMetadataComplete: 500`, `chapterTitleParityComplete: 500`, `uhrPageRangeParityComplete: 500`, `uhrSectionParityComplete: 500`).
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:content` → PASS (3/3).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check scripts/content-production.test.js` → PASS.
- `git diff --check -- scripts/content-production.test.js` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used focused low-thread content/test checks only; no browser, Expo export, or broad TypeScript proof started.
Next suggested validator action: Review/accept DATA-INTEGRITY-DERIVED-UHR-REFERENCE-PARITY-1 as a verified production parity atom; next DATA-INTEGRITY atom can add a direct fixture-level guard in `scripts/derived-content.test.js` for custom UHR metadata preservation if desired.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-DERIVED-UHR-FIXTURE-PARITY-1 — direct fixture-level parity atom proving generated variants preserve an explicitly reviewed UHR reference object and non-default exam scope exactly.
Artifacts changed:
- `scripts/derived-content.test.js` — added a focused fixture with explicit `documentTitle`, `sourceEdition`, `sourceUrl`, `examScope`, chapter, and Valborg UHR fields, then asserts all four generated variants keep the exact UHR reference, exam scope, chapter, and published status.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/derived-content.test.js` → PASS (2/2), including the new explicit-UHR-metadata/exam-scope parity subtest.
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `uhrSourceMetadataComplete: 500`, `chapterTitleParityComplete: 500`, `uhrPageRangeParityComplete: 500`, `uhrSectionParityComplete: 500`).
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:derived-content` → PASS (2/2).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check scripts/derived-content.test.js` → PASS.
- `git diff --check -- scripts/derived-content.test.js` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used focused low-thread content/test checks only; no browser, Expo export, or broad TypeScript proof started.
Next suggested validator action: Review/accept DATA-INTEGRITY-DERIVED-UHR-FIXTURE-PARITY-1 as a verified fixture-level parity atom; next DATA-INTEGRITY atom can add a CSV/export guard that row IDs remain unique and aligned with generated IDs if desired.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-CSV-ID-ORDER-PARITY-1 — CSV/export parity atom requiring persisted question-bank row IDs to stay unique and exactly aligned with `data/questions.ts` production order, including generated IDs.
Artifacts changed:
- `scripts/content-production.test.js` — added a production regression that checks all question IDs and generated IDs are unique, generated IDs remain contiguous from `q101`, and CSV row IDs match `data/questions.ts` order exactly.
- `content/question-bank.csv` — regenerated the persisted 500-row export so the latest reviewed source question set and generated range are reflected in CSV order.
Verification:
- Initial focused `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` caught stale CSV drift: the persisted export was missing the current latest source row and still carried an extra generated row. Regenerated via `NODE_OPTIONS='--v8-pool-size=1' npm run content:export`.
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (4/4), including the new ID/order parity subtest.
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `uhrSourceMetadataComplete: 500`, `chapterTitleParityComplete: 500`, `uhrPageRangeParityComplete: 500`, `uhrSectionParityComplete: 500`).
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:content` → PASS (4/4).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check scripts/content-production.test.js scripts/export-question-bank.js` → PASS.
- `git diff --check -- scripts/content-production.test.js scripts/export-question-bank.js content/question-bank.csv` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used focused low-thread content/export/test checks only; no browser, Expo export, or broad TypeScript proof started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-ID-ORDER-PARITY-1 as a verified CSV parity atom; next DATA-INTEGRITY atom can add validator-side uniqueness enforcement so duplicate production IDs fail before export.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-VALIDATOR-CSV-ORDER-PARITY-1 — validator-side parity atom making stale `content/question-bank.csv` row order a content validation failure instead of only a separate test failure.
Artifacts changed:
- `scripts/validate-content.js` — parses `content/question-bank.csv`, verifies the `id` column exists, checks CSV row count against the 500-question production export, fails row-by-row ID/order drift, and reports `questionBankCsvOrderParityComplete`.
- `scripts/content-production.test.js` — asserts the validator summary reports `questionBankCsvOrderParityComplete: 500`.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `questionBankCsvOrderParityComplete: 500`, plus existing UHR parity counts at 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (4/4).
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:content` → PASS (4/4).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check scripts/validate-content.js scripts/content-production.test.js` → PASS.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js content/question-bank.csv` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used focused low-thread content/schema checks only; no browser, Expo export, or broad TypeScript proof started.
Next suggested validator action: Review/accept DATA-INTEGRITY-VALIDATOR-CSV-ORDER-PARITY-1 as a verified validator parity atom; next DATA-INTEGRITY atom can add export-side duplicate-ID refusal before writing CSV.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-UHR-MAP-RESOLVER-TS-NARROWING-1 — schema/parity fix clearing the strict TypeScript blocker for the canonical UHR map resolver used by validation and CSV export.
Artifacts changed:
- `data/uhrReferenceMap.ts` — tightened `isPageInsideUhrRange` so optional `pageApprox` is explicitly narrowed to a number before comparing against chapter/section ranges.
- `docs/parallel-sessions/journals/data-integrity.md` — appended this handoff.
Verification:
- Reproduced pre-fix blocker: `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/tsc --noEmit --pretty false` failed only at `data/uhrReferenceMap.ts(225,10/47)` because `pageApprox` was possibly undefined.
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/tsc --noEmit --pretty false` → PASS (exit 0), clearing the broad TypeScript gate that manager-build held for DATA-INTEGRITY-UHR-MAP-RESOLVER-1.
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `uhrPageRangeParityComplete: 500`, `uhrSectionParityComplete: 500`, `questionBankCsvOrderParityComplete: 500`).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/uhr-reference-map.test.js scripts/content-production.test.js` → PASS (6/6).
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:content` → PASS (4/4).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check data/uhrReferenceMap.ts scripts/validate-content.js scripts/export-question-bank.js scripts/content-production.test.js scripts/uhr-reference-map.test.js` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — focused low-thread schema/content checks only; no browser, Expo export, or cache-heavy route proof started.
Next suggested validator action: Review/accept this as the TS-narrowing addendum for DATA-INTEGRITY-UHR-MAP-RESOLVER-1; update `codex-tasks/open.txt`/TEAM_PLAN B7 once the broad TypeScript blocker is cleared.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-EXPORT-DUPLICATE-ID-REFUSAL-1 — export-side parity atom making duplicate question IDs fail before `content/question-bank.csv` rows are written.
Artifacts changed:
- `scripts/export-question-bank.js` — refactored the CSV writer behind a `require.main` guard, exported `assertUniqueExportQuestionIds`, and calls it before row generation so duplicate question IDs fail before CSV output.
- `scripts/content-production.test.js` — added a focused regression that proves the export guard allows unique IDs and throws on a duplicate `q001` before writing rows.
- `content/question-bank.csv` — regenerated through the guarded exporter; row content remains aligned with the 500-question production bank.
- `docs/parallel-sessions/journals/data-integrity.md` — appended this handoff.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' npm run content:export` → PASS (`Exported 500 questions to content/question-bank.csv`).
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `questionBankCsvOrderParityComplete: 500`, plus UHR metadata/title/page/section parity counts at 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (5/5), including `question bank export refuses duplicate question IDs before writing CSV rows`.
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check scripts/export-question-bank.js scripts/content-production.test.js` → PASS after formatting `scripts/export-question-bank.js`.
- `git diff --check -- scripts/export-question-bank.js scripts/content-production.test.js content/question-bank.csv` → PASS.
- Focused trailing-whitespace scan over `scripts/export-question-bank.js`, `scripts/content-production.test.js`, `content/question-bank.csv`, and this journal → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used focused low-thread content/export checks only; no browser, Expo web export, or duplicate broad TypeScript proof started while another pane owned route/build checks.
Next suggested validator action: Review/accept DATA-INTEGRITY-EXPORT-DUPLICATE-ID-REFUSAL-1 as a verified CSV export parity atom; if still needed, separately accept the already-journaled UHR map TS-narrowing addendum against the broad TypeScript gate.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-CSV-UHR-REFERENCE-PARITY-1 — validator/test parity atom requiring each persisted `content/question-bank.csv` row to preserve the exact normalized UHR reference metadata from `data/questions.ts`.
Artifacts changed:
- `scripts/validate-content.js` — added shared CSV row parsing helpers, fails missing UHR CSV metadata columns, fails row-by-row drift for `uhrChapter`, `uhrSection`, `uhrPageApprox`, `uhrDocumentTitle`, `uhrSourceEdition`, and `uhrSourceUrl`, and reports `questionBankCsvUhrReferenceParityComplete`.
- `scripts/content-production.test.js` — asserts the validator summary reports 500 complete CSV/UHR-reference rows and adds a direct row-by-row CSV parity regression against `data/questions.ts`.
- `content/question-bank.csv` — regenerated through the guarded exporter after the stricter validator caught stale CSV order/metadata drift from the current 500-question bank.
Verification:
- Initial focused `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` caught stale persisted CSV drift at the current q531/q101 boundary before regeneration.
- `NODE_OPTIONS='--v8-pool-size=1' npm run content:export` → PASS (`Exported 500 questions to content/question-bank.csv`).
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `questionBankCsvOrderParityComplete: 500`, `questionBankCsvUhrReferenceParityComplete: 500`, plus existing UHR metadata/title/page/section parity counts at 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (6/6), including the new exported UHR-reference metadata parity subtest.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:content` → PASS (6/6).
- Focused CSV audit script → PASS (`{"rows":500,"uhrReferenceCsvParityComplete":500}`).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check scripts/validate-content.js scripts/content-production.test.js scripts/export-question-bank.js` → PASS.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js content/question-bank.csv` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used focused low-thread content/schema/export checks only; no browser, Expo web export, route proof, or duplicate broad TypeScript job started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-UHR-REFERENCE-PARITY-1 as a verified CSV/UHR-reference parity atom; next DATA-INTEGRITY atom can add validator-side export header contract enforcement if another compact iteration is needed.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-CSV-HEADER-CONTRACT-1 — validator/export parity atom requiring the persisted question-bank CSV header to match the exporter’s canonical column contract exactly.
Artifacts changed:
- `scripts/export-question-bank.js` — extracted and exported `QUESTION_BANK_CSV_HEADER` and uses it as the single CSV header source of truth.
- `scripts/validate-content.js` — imports the canonical header, fails header drift before row-level CSV checks, and reports `questionBankCsvHeaderContractComplete`.
- `scripts/content-production.test.js` — asserts the validator header-contract summary and adds a direct exact-header regression for `content/question-bank.csv`.
- `content/question-bank.csv` — regenerated through the guarded exporter; header/order remains aligned with the canonical 19-column contract.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' npm run content:export` → PASS (`Exported 500 questions to content/question-bank.csv`).
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questionBankCsvHeaderContractComplete: 19`, CSV order/UHR-reference parity 500/500, and existing UHR metadata/title/page/section parity counts 500/500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (7/7), including `exported question bank header matches the export contract exactly`.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:content` → PASS (7/7).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check scripts/export-question-bank.js scripts/validate-content.js scripts/content-production.test.js` → PASS.
- `git diff --check -- scripts/export-question-bank.js scripts/validate-content.js scripts/content-production.test.js content/question-bank.csv` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used focused low-thread content/export/test checks only; no browser, Expo web export, or broad TypeScript job started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-HEADER-CONTRACT-1 as a verified CSV/export parity atom; next DATA-INTEGRITY atom can add validator/export parity for option serialization if another compact iteration is needed.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-CSV-OPTIONS-PARITY-1 — validator/export parity atom requiring the persisted question-bank CSV to carry answer-option payloads that match `data/questions.ts` exactly.
Artifacts changed:
- `scripts/export-question-bank.js` — added canonical `serializeQuestionOptions`, exported it for tests, added `optionsJson` to `QUESTION_BANK_CSV_HEADER`, and writes stable option JSON for each exported row.
- `scripts/validate-content.js` — validates the `optionsJson` CSV column against the same exporter serialization and reports `questionBankCsvOptionsParityComplete`.
- `scripts/content-production.test.js` — asserts validator option-parity summary coverage and adds a direct row-by-row option serialization regression.
- `content/question-bank.csv` — regenerated the 500-row export with the new `optionsJson` column under the canonical 20-column header contract.
- `docs/parallel-sessions/journals/data-integrity.md` — appended this handoff.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' npm run content:export` → PASS (`Exported 500 questions to content/question-bank.csv`).
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questionBankCsvOptionsParityComplete: 500`, `questionBankCsvHeaderContractComplete: 20`, CSV order/UHR parity 500/500, and existing UHR metadata/title/page/section parity counts 500/500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (8/8), including `exported question bank preserves serialized answer options for each row`.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:content` → PASS (8/8).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check scripts/export-question-bank.js scripts/validate-content.js scripts/content-production.test.js` → PASS after formatting `scripts/validate-content.js`.
- `git diff --check -- scripts/export-question-bank.js scripts/validate-content.js scripts/content-production.test.js content/question-bank.csv` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used focused low-thread content/export/test checks only; no browser, Expo web export, route proof, or broad TypeScript job started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-OPTIONS-PARITY-1 as a verified CSV/export parity atom; next DATA-INTEGRITY atom can add a negative validator fixture for malformed `optionsJson` if another compact iteration is needed.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-OPTION-ID-UNIQUENESS-SCHEMA-1 — schema/parity atom requiring every published question to use unique answer option IDs so `correctOptionId` resolves unambiguously.
Artifacts changed:
- `scripts/validate-content.js` — now fails duplicate option IDs inside a question and reports `questionOptionIdUniquenessComplete` in the validator summary.
- `scripts/content-production.test.js` — asserts the validator summary covers all 500 questions and adds a direct production regression that each question has unique option IDs and a matching `correctOptionId`.
- `docs/parallel-sessions/journals/data-integrity.md` — appended this handoff.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `questionOptionIdUniquenessComplete: 500`, plus existing UHR metadata/title/page/section and CSV parity counts).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (9/9), including `published questions keep answer option IDs unique within each question`.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:content` → PASS (9/9).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check scripts/validate-content.js scripts/content-production.test.js` → PASS.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used focused low-thread schema/content checks only; no browser, Expo web export, route proof, or broad TypeScript job started.
Next suggested validator action: Review/accept DATA-INTEGRITY-OPTION-ID-UNIQUENESS-SCHEMA-1 as a verified schema/parity atom; next DATA-INTEGRITY atom can add a negative validator fixture for malformed CSV `optionsJson` if another compact iteration is needed.

Lane: DATA-INTEGRITY
Host/branch: cn014/main
Task/checklist item: DATA-INTEGRITY-CSV-OPTIONS-JSON-SCHEMA-1 — validator-side CSV schema atom requiring persisted `optionsJson` values to be parseable option arrays before option-parity acceptance.
Artifacts changed:
- `scripts/validate-content.js` — added `QUESTION_BANK_CSV_PATH` override support for negative fixtures, validates each CSV `optionsJson` cell as JSON array option objects with string `id`/`textSv`/`textEn`, reports `questionBankCsvOptionsJsonSchemaComplete`, and preserves exact serialized-options parity.
- `scripts/content-production.test.js` — asserts 500/500 options JSON schema coverage and adds temp-file negative regressions proving malformed, non-array, and incomplete-option CSV `optionsJson` values fail content validation without mutating the committed question bank.
- `docs/parallel-sessions/journals/data-integrity.md` — appended this handoff.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questions: 500`, `publishedQuestions: 500`, `questionBankCsvOptionsJsonSchemaComplete: 500`, `questionBankCsvOptionsParityComplete: 500`, plus existing CSV/UHR parity counts).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (10/10), including `content validator rejects invalid CSV optionsJson values` with malformed, non-array, and missing-field negative fixtures.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:content` → PASS (10/10).
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --write scripts/content-production.test.js` → formatted the expanded negative fixture loop.
- `NODE_OPTIONS='--v8-pool-size=1' ./node_modules/.bin/prettier --check scripts/validate-content.js scripts/content-production.test.js` → PASS.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — used focused low-thread content/schema checks only; no browser, Expo web export, route proof, or broad TypeScript job started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-OPTIONS-JSON-SCHEMA-1 as a verified CSV schema/parity atom; next DATA-INTEGRITY atom can add CSV parity/schema coverage for `tags` or `difficulty` if another compact iteration is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-DIFFICULTY-TAGS-SCHEMA-PARITY-1 — validator/export schema+parity atom requiring persisted `difficulty` and `tags` CSV fields to be schema-valid and exactly aligned with `data/questions.ts`.
Artifacts changed:
- `scripts/validate-content.js` — added difficulty/tags CSV schema validators, row-by-row parity checks, and summary counters `questionBankCsvDifficultyTagSchemaComplete` + `questionBankCsvDifficultyTagParityComplete`.
- `scripts/content-production.test.js` — asserts the new 500/500 summary counters and adds negative fixture regressions proving invalid `difficulty` and malformed `tags` values are rejected.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questionBankCsvDifficultyTagSchemaComplete: 500`, `questionBankCsvDifficultyTagParityComplete: 500`, existing CSV/UHR/options parity unchanged).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (11/11), including new `content validator rejects invalid CSV difficulty and tags schema values` fixture test.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export heavy/E2E work started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-DIFFICULTY-TAGS-SCHEMA-PARITY-1 as a verified schema/parity atom; next DATA-INTEGRITY atom can add CSV `type` schema guard parity if another compact iteration is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-TYPE-SCHEMA-PARITY-1 — validator/export schema+parity atom requiring persisted CSV `type` values to be valid `QuestionType` members and exactly aligned with `data/questions.ts`.
Artifacts changed:
- `scripts/validate-content.js` — added CSV `type` schema validation (`single_choice|true_false|flashcard`), per-row parity checks, and summary counters `questionBankCsvTypeSchemaComplete` + `questionBankCsvTypeParityComplete`.
- `scripts/content-production.test.js` — asserts both new counters are 500/500 and adds a negative fixture proving invalid CSV `type` is rejected.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questionBankCsvTypeSchemaComplete: 500`, `questionBankCsvTypeParityComplete: 500`, all prior parity counters unchanged).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (12/12), including `content validator rejects invalid CSV type schema values`.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy/broad TypeScript tasks started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-TYPE-SCHEMA-PARITY-1 as a verified schema/parity atom; next DATA-INTEGRITY atom can add `examScope` CSV schema/parity guard if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-EXAMSCOPE-SCHEMA-PARITY-1 — validator/export schema+parity atom requiring persisted CSV `examScope` values to match `ExamScope` and stay exactly aligned with `data/questions.ts`.
Artifacts changed:
- `scripts/export-question-bank.js` — added `examScope` column to canonical CSV header/rows so export carries explicit scope metadata.
- `scripts/validate-content.js` — added `examScope` CSV schema validator (`uhr_based|official_context|vocabulary_support|background_learning`), row-level parity check, and summary counters `questionBankCsvExamScopeSchemaComplete` + `questionBankCsvExamScopeParityComplete`.
- `scripts/content-production.test.js` — asserts new 500/500 counters and adds a negative fixture proving invalid CSV `examScope` fails validation.
- `content/question-bank.csv` — regenerated through canonical export with the new 21-column contract including `examScope`.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' npm run content:export` → PASS (`Exported 500 questions to content/question-bank.csv`).
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questionBankCsvHeaderContractComplete: 21`, `questionBankCsvExamScopeSchemaComplete: 500`, `questionBankCsvExamScopeParityComplete: 500`, and prior CSV/UHR/options/difficulty/tags/type parity counters all 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (13/13), including `content validator rejects invalid CSV examScope schema values`.
- `git diff --check -- scripts/export-question-bank.js scripts/validate-content.js scripts/content-production.test.js content/question-bank.csv` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-EXAMSCOPE-SCHEMA-PARITY-1 as a verified schema/parity atom; next DATA-INTEGRITY atom can add CSV UHR title/edition/url schema guards if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-UHR-SOURCE-SCHEMA-PARITY-1 — validator/export schema+parity atom requiring persisted CSV UHR source metadata (`uhrDocumentTitle`, `uhrSourceEdition`, `uhrSourceUrl`) to stay schema-valid and exactly aligned with `data/questions.ts`.
Artifacts changed:
- `scripts/validate-content.js` — added UHR source schema checks (non-empty source title/edition strings + valid http(s) URL for source URL), row-level parity checks, and summary counters `questionBankCsvUhrSourceSchemaComplete` + `questionBankCsvUhrSourceParityComplete`.
- `scripts/content-production.test.js` — asserts new 500/500 counters and adds negative fixtures proving invalid/empty UHR source metadata fails validation.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questionBankCsvUhrSourceSchemaComplete: 500`, `questionBankCsvUhrSourceParityComplete: 500`, prior counters unchanged).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (14/14), including `content validator rejects invalid CSV UHR source metadata schema values`.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-UHR-SOURCE-SCHEMA-PARITY-1 as a verified schema/parity atom; next DATA-INTEGRITY atom can add CSV `chapterId`/`id` format schema guards if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-IDENTITY-SCHEMA-PARITY-1 — validator/export schema+parity atom requiring persisted CSV identity fields (`id`, `chapterId`) to match strict formats and remain exactly aligned with `data/questions.ts`.
Artifacts changed:
- `scripts/validate-content.js` — added identity schema checks (`id` must match `qNNN`, `chapterId` must match `chNN`), row-level parity checks, and summary counters `questionBankCsvIdentitySchemaComplete` + `questionBankCsvIdentityParityComplete`.
- `scripts/content-production.test.js` — asserts new 500/500 counters and adds negative fixtures proving invalid `id`/`chapterId` formats fail validation.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questionBankCsvIdentitySchemaComplete: 500`, `questionBankCsvIdentityParityComplete: 500`, prior counters unchanged).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (15/15), including `content validator rejects invalid CSV identity schema values`.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-IDENTITY-SCHEMA-PARITY-1 as a verified schema/parity atom; next DATA-INTEGRITY atom can add `correctOptionId` format/schema guards if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-CORRECT-OPTION-SCHEMA-PARITY-1 — validator/export schema+parity atom requiring persisted CSV `correctOptionId` to be non-empty, present in the row `optionsJson`, and exactly aligned with `data/questions.ts`.
Artifacts changed:
- `scripts/validate-content.js` — added `correctOptionId` schema check against parsed row `optionsJson` option IDs, plus summary counters `questionBankCsvCorrectOptionSchemaComplete` + `questionBankCsvCorrectOptionParityComplete`.
- `scripts/content-production.test.js` — asserts new 500/500 counters and adds a negative fixture proving invalid `correctOptionId` fails validation.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questionBankCsvCorrectOptionSchemaComplete: 500`, `questionBankCsvCorrectOptionParityComplete: 500`, prior counters unchanged).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (16/16), including `content validator rejects invalid CSV correctOptionId schema values`.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-CORRECT-OPTION-SCHEMA-PARITY-1 as a verified schema/parity atom; next DATA-INTEGRITY atom can de-duplicate cascading error noise when `optionsJson` schema is already invalid if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-PROMPT-SCHEMA-PARITY-1 — validator/export schema+parity atom requiring persisted CSV prompt fields (`questionSv`, `questionEn`) to be non-empty, trimmed strings and exactly aligned with `data/questions.ts`.
Artifacts changed:
- `scripts/validate-content.js` — added prompt-field schema checks (non-empty + no surrounding whitespace), row-level parity checks, and summary counters `questionBankCsvPromptSchemaComplete` + `questionBankCsvPromptParityComplete`.
- `scripts/content-production.test.js` — asserts new 500/500 counters and adds a negative fixture proving blank `questionEn` fails validation.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questionBankCsvPromptSchemaComplete: 500`, `questionBankCsvPromptParityComplete: 500`, prior counters unchanged).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (17/17), including `content validator rejects invalid CSV prompt schema values`.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-PROMPT-SCHEMA-PARITY-1 as a verified schema/parity atom; next DATA-INTEGRITY atom can de-duplicate cascading `correctOptionId` errors when `optionsJson` schema is already invalid if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-OPTIONS-NO-CASCADE-1 — validator-side schema atom preventing duplicate cascade errors by suppressing `correctOptionId` validation when row `optionsJson` is already schema-invalid.
Artifacts changed:
- `scripts/validate-content.js` — skips `correctOptionId` schema checks when `optionsJson` is malformed/non-array for that same row, while preserving normal `correctOptionId` schema+parity checks when options JSON is valid.
- `scripts/content-production.test.js` — added `optionsJson schema failures do not cascade into correctOptionId errors` negative fixture asserting malformed options emit the primary options error without the secondary cascade error.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all counters still 500, including correct-option and options schema/parity).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (18/18), including no-cascade fixture.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-OPTIONS-NO-CASCADE-1 as a verified schema-quality atom; next DATA-INTEGRITY atom can add focused row-ID/index mismatch fixture isolation if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-ROW-COUNT-PARITY-1 — validator/export parity atom making CSV row-count drift explicitly measurable and test-enforced.
Artifacts changed:
- `scripts/validate-content.js` — added summary counter `questionBankCsvRowCountParityComplete` (full credit only when CSV rows exactly match `data/questions.ts` length).
- `scripts/content-production.test.js` — asserts `questionBankCsvRowCountParityComplete: 500` in production and adds negative fixture `content validator rejects CSV row count parity drift` that removes one row and verifies validation failure.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (`questionBankCsvRowCountParityComplete: 500`, existing parity/schema counters unchanged).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (19/19), including row-count drift rejection fixture.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-ROW-COUNT-PARITY-1 as a verified parity atom; next DATA-INTEGRITY atom can suppress secondary missing-field cascades when row-count mismatch is already detected if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-ROW-COUNT-NO-CASCADE-1 — validator quality atom suppressing secondary row-level parity/schema cascades when CSV row-count parity is already broken.
Artifacts changed:
- `scripts/validate-content.js` — gates row-index parity/schema loops on exact row-count parity so a row-count mismatch emits the primary count failure without hundreds of derivative missing-row mismatches.
- `scripts/content-production.test.js` — strengthened `content validator rejects CSV row count parity drift` fixture to assert missing-row cascades are absent while the primary row-count failure remains enforced.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all summary counters remain 500 on healthy dataset).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (19/19), including row-count no-cascade assertion.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-ROW-COUNT-NO-CASCADE-1 as a verified validator-quality atom; next DATA-INTEGRITY atom can add one compact summary metric for no-cascade coverage if needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-PROMPT-TRIM-SCHEMA-1 — validator schema atom enforcing CSV prompt fields are trimmed (no leading/trailing whitespace) while preserving exact parity with `data/questions.ts`.
Artifacts changed:
- `scripts/content-production.test.js` — added `content validator rejects CSV prompt values with surrounding whitespace` negative fixture that injects leading whitespace into `questionSv` and asserts the dedicated trim-schema failure.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (prompt schema/parity counters remain 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (20/20), including whitespace-trim prompt schema rejection.
- `git diff --check -- scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-PROMPT-TRIM-SCHEMA-1 as a verified schema atom; next DATA-INTEGRITY atom can add one compact fixture for trailing-whitespace prompt rejection symmetry if another cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-PROMPT-TRIM-SCHEMA-TRAILING-1 — validator schema atom adding trailing-whitespace symmetry coverage for prompt-field trim enforcement.
Artifacts changed:
- `scripts/content-production.test.js` — added `content validator rejects CSV prompt values with trailing whitespace` negative fixture injecting trailing space into `questionEn` and asserting the trim-schema failure.
- `content/question-bank.csv` — regenerated via `npm run content:export` after upstream question-order drift so parity gates re-align before verification.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' npm run content:export` → PASS (`Exported 500 questions to content/question-bank.csv`).
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all schema/parity counters remain 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (21/21), including trailing-whitespace prompt rejection.
- `git diff --check -- scripts/content-production.test.js content/question-bank.csv` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-PROMPT-TRIM-SCHEMA-TRAILING-1 as a verified schema atom; next DATA-INTEGRITY atom can add compact row-order drift fixture isolation if another cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-ROW-ORDER-PARITY-FIXTURE-1 — validator parity atom adding explicit row-order drift fixture coverage for the question-bank CSV.
Artifacts changed:
- `scripts/content-production.test.js` — added `content validator rejects CSV row order parity drift` fixture that swaps the first two data rows and asserts row-ID order mismatch failures (`row 2 id q002 does not match q001`, `row 3 id q001 does not match q002`).
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all summary counters remain 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (22/22), including row-order drift rejection fixture.
- `git diff --check -- scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-ROW-ORDER-PARITY-FIXTURE-1 as a verified parity atom; next DATA-INTEGRITY atom can add an optionsJson row-order diagnostic clarity fixture if another cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-ROW-ORDER-OPTIONS-DIAGNOSTIC-1 — parity-diagnostics atom ensuring row-order drift explicitly reports `optionsJson` parity mismatches in addition to row-ID mismatches.
Artifacts changed:
- `scripts/content-production.test.js` — added `row-order drift surfaces optionsJson parity diagnostics` fixture that swaps the first two CSV rows and asserts `row 2 optionsJson does not match q001` and `row 3 optionsJson does not match q002` are emitted.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all schema/parity summary counters remain 500 on canonical CSV).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (23/23), including new optionsJson row-order diagnostics fixture.
- `git diff --check -- scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity diagnostics only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-ROW-ORDER-OPTIONS-DIAGNOSTIC-1 as a verified parity-diagnostics atom; next DATA-INTEGRITY atom can compact duplicate failure-line assertions if another cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-UHR-SOURCE-URL-PROTOCOL-SCHEMA-1 — validator schema atom adding explicit non-http(s) URL fixture coverage for `uhrSourceUrl`.
Artifacts changed:
- `scripts/content-production.test.js` — extended `content validator rejects invalid CSV UHR source metadata schema values` with `non-http-source-url` fixture (`ftp://...`) and assertion `uhrSourceUrl must be an http(s) URL`.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all schema/parity summary counters remain 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (23/23), including non-http UHR source URL rejection fixture.
- `git diff --check -- scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-UHR-SOURCE-URL-PROTOCOL-SCHEMA-1 as a verified schema atom; next DATA-INTEGRITY atom can compact duplicate row-order fixture assertions if another cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-ID-MISMATCH-DEDUPE-1 — validator quality atom de-duplicating row-order ID mismatch diagnostics so identity checks do not emit redundant duplicate ID mismatch lines.
Artifacts changed:
- `scripts/validate-content.js` — tracks row indexes with order-level ID mismatches and skips duplicate identity-level `id` mismatch emission for those rows; keeps chapterId identity checks unchanged.
- `scripts/content-production.test.js` — tightened row-order drift fixture to assert each ID mismatch line appears exactly once and updated identity fixture expectation to the primary row-order mismatch message for malformed ID values.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all schema/parity summary counters remain 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (23/23), including deduped row-order mismatch assertion.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity quality checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-ID-MISMATCH-DEDUPE-1 as a verified validator-quality atom; next DATA-INTEGRITY atom can similarly dedupe non-ID repeated row-order parity lines if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-UHR-SOURCE-TRIM-SCHEMA-1 — validator schema atom enforcing UHR source metadata fields are trimmed (no leading/trailing whitespace).
Artifacts changed:
- `scripts/validate-content.js` — added trim guard for UHR source metadata fields so non-empty values with surrounding whitespace fail schema (`must not start or end with whitespace`).
- `scripts/content-production.test.js` — extended UHR source metadata negative fixtures with `source-edition-leading-space` case and assertion for the trim-schema failure.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all schema/parity summary counters remain 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (23/23), including leading-whitespace UHR source edition rejection fixture.
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-UHR-SOURCE-TRIM-SCHEMA-1 as a verified schema atom; next DATA-INTEGRITY atom can dedupe repeated non-ID row-order mismatch lines if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-UHR-DOCUMENT-TITLE-TRIM-SCHEMA-1 — schema atom extending UHR source trim validation with dedicated trailing-whitespace fixture coverage for `uhrDocumentTitle`.
Artifacts changed:
- `scripts/content-production.test.js` — extended UHR source metadata negative fixture matrix with `document-title-trailing-space` case and assertion for `uhrDocumentTitle must not start or end with whitespace`.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all schema/parity summary counters remain 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (23/23), including document-title trailing-whitespace rejection fixture.
- `git diff --check -- scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-UHR-DOCUMENT-TITLE-TRIM-SCHEMA-1 as a verified schema atom; next DATA-INTEGRITY atom can target deduping repeated non-ID row-order mismatch lines if another cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-CHAPTERID-EMPTY-SCHEMA-1 — identity-schema atom adding explicit empty `chapterId` fixture coverage for CSV validation.
Artifacts changed:
- `scripts/content-production.test.js` — extended `content validator rejects invalid CSV identity schema values` fixture matrix with `empty-chapterid` case and assertion `chapterId must be a non-empty string`.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all schema/parity summary counters remain 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (23/23), including empty `chapterId` schema rejection fixture.
- `git diff --check -- scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-CHAPTERID-EMPTY-SCHEMA-1 as a verified schema atom; next DATA-INTEGRITY atom can dedupe repeated non-ID row-order mismatch lines if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-CSV-CORRECT-OPTION-EMPTY-SCHEMA-1 — correct-option schema atom adding explicit empty `correctOptionId` fixture coverage.
Artifacts changed:
- `scripts/content-production.test.js` — expanded `content validator rejects invalid CSV correctOptionId schema values` into a two-case matrix: empty `correctOptionId` (`must be a non-empty string`) and non-matching `correctOptionId` (`must match one option id in optionsJson`).
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all schema/parity summary counters remain 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (23/23), including empty+invalid `correctOptionId` schema rejection fixtures.
- `git diff --check -- scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-CORRECT-OPTION-EMPTY-SCHEMA-1 as a verified schema atom; next DATA-INTEGRITY atom can dedupe repeated non-ID row-order mismatch lines if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-UHR-SOURCE-URL-EMPTY-SCHEMA-1 — schema atom adding explicit empty `uhrSourceUrl` fixture coverage in UHR source metadata validation.
Artifacts changed:
- `scripts/content-production.test.js` — extended UHR source metadata negative matrix with `empty-source-url` case and assertion `uhrSourceUrl must be a non-empty string`.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all schema/parity summary counters remain 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (23/23), including empty-source-url rejection fixture.
- `git diff --check -- scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-UHR-SOURCE-URL-EMPTY-SCHEMA-1 as a verified schema atom; next DATA-INTEGRITY atom can dedupe repeated non-ID row-order mismatch lines if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/main
Task/checklist item: DATA-INTEGRITY-UHR-SOURCE-URL-EMPTY-FIXTURE-1 — UHR source schema atom adding explicit empty-url fixture coverage to complement malformed/protocol URL guards.
Artifacts changed:
- `scripts/content-production.test.js` — extended `content validator rejects invalid CSV UHR source metadata schema values` with `empty-source-url` case and assertion `uhrSourceUrl must be a non-empty string`.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all schema/parity summary counters remain 500).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (23/23), including empty `uhrSourceUrl` rejection fixture.
- `git diff --check -- scripts/content-production.test.js` → PASS.
Blocked? no — focused low-thread schema/parity checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-UHR-SOURCE-URL-EMPTY-FIXTURE-1 as a verified schema atom; next DATA-INTEGRITY atom can dedupe repeated non-ID row-order mismatch lines if another compact cycle is needed.

Lane: DATA-INTEGRITY
Host/branch: local/pane5-data-integrity-csv-dedupe
Task/checklist item: DATA-INTEGRITY-CSV-ROW-ORDER-NON-ID-DEDUPE-1 — validator quality atom suppressing secondary `optionsJson` row-order mismatch diagnostics when the primary CSV row ID order mismatch already identifies the drift.
Artifacts changed:
- `scripts/validate-content.js` — skips option-parity row checks for row indexes already flagged by the CSV ID-order parity guard, matching the existing non-ID parity no-cascade behavior.
- `scripts/content-production.test.js` — strengthened row-order drift coverage to assert `optionsJson` mismatch cascades are absent, and replaced the swapped-row options diagnostic fixture with a stable-row optionsJson parity-drift fixture.
- `docs/parallel-sessions/journals/data-integrity.md` — appended this handoff.
Verification:
- `NODE_OPTIONS='--v8-pool-size=1' node scripts/validate-content.js` → PASS (all schema/parity summary counters remain 500; header contract 21).
- `NODE_OPTIONS='--v8-pool-size=1' node --test scripts/content-production.test.js` → PASS (23/23), including row-order non-ID no-cascade and stable-row optionsJson parity fixtures.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:content` → PASS (23/23).
- `git diff --check -- scripts/validate-content.js scripts/content-production.test.js docs/parallel-sessions/journals/data-integrity.md` → PASS.
- `NODE_OPTIONS='--v8-pool-size=1' npm run test:ownership` → PASS (1/1).
Blocked? no — focused low-thread validator/test checks only; no browser/export-heavy E2E or broad TypeScript jobs started.
Next suggested validator action: Review/accept DATA-INTEGRITY-CSV-ROW-ORDER-NON-ID-DEDUPE-1 as a verified validator-quality atom; next DATA-INTEGRITY atom can dedupe UHR source schema/parity double-reporting when a single source metadata cell is malformed.
