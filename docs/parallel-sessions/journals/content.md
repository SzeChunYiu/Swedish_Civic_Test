# CONTENT Lane Journal — Sweden Citizenship Test Prep

Append-only. Keep under 120 lines.

## Iteration 1 — 2026-05-15
Task completed: Task 1 — defined exported content TypeScript types in `types/content.ts`.
Artifacts changed: `types/content.ts`, `docs/parallel-sessions/journals/content.md`
Question count (if applicable): N/A
Verification: `npx --package typescript tsc --noEmit --strict types/content.ts` → TypeScript file OK. Prescribed `npx tsc --noEmit` currently fails because no project `package.json`/TypeScript dependency exists yet (SETUP scope); `data/questions.ts` is not present yet so node question-count check returned "compile check only".
Blocked? no — Task 1 artifact is complete; project-wide verification awaits SETUP scaffold.
Next suggested validator action: check `types/content.ts` for A4 shape against `docs/content-strategy.md`.

## Iteration 2 — 2026-05-15
Task completed: Task 3 — added 20 reviewed sample questions in `data/questions.ts` (10 `ch01`, 10 `ch02`).
Artifacts changed: `data/questions.ts`, `docs/parallel-sessions/journals/content.md`
Question count (if applicable): 20 total; `ch01`: 10; `ch02`: 10
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK; prescribed node require check returned `compile check only` because `data/questions.ts` is TypeScript source. Additional TypeScript-transpile validation loaded the exported array and confirmed length 20, ch01/ch02 counts 10 each, required option counts, `correctOptionId`, UHR references, explanations, and `reviewStatus: "reviewed"` with no failures.
Blocked? no — Task 3 artifact is complete.
Next suggested validator action: check `data/questions.ts` for A6 content quality and source traceability against UHR `Sverige i fokus`.

## Iteration 3 — 2026-05-15
Task completed: Task 2 — added 13 UHR chapter records in `data/chapters.ts`.
Artifacts changed: `data/chapters.ts`, `docs/parallel-sessions/journals/content.md`
Question count (if applicable): N/A
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK; prescribed node question-count check returned `compile check only` for TypeScript source. Additional TypeScript-transpile validation loaded `chapters` and confirmed 13 records, sequential `ch01`–`ch13` ids, filled Swedish/English names/descriptions, and `questionCount: 0` for every record with no failures.
Blocked? no — Task 2 artifact is complete.
Next suggested validator action: check `data/chapters.ts` for A5 against the UHR `Sverige i fokus` table of contents.

## Iteration 4 — 2026-05-15
Task completed: Completion audit — re-read lane docs, confirmed no remaining CONTENT queue tasks, and re-verified A4/A5/A6 artifacts.
Artifacts changed: `docs/parallel-sessions/journals/content.md`
Question count (if applicable): 20 total; `ch01`: 10; `ch02`: 10
Verification: `npx tsc --noEmit && echo "TypeScript OK"` → TypeScript OK; prescribed node require check returned `compile check only` for TypeScript source; custom TypeScript-transpile validation confirmed 13 chapters, sequential `ch01`–`ch13` ids, 20 questions, 10/10 ch01/ch02 split, valid option counts, `correctOptionId` membership, filled UHR references, nonempty tags, and all `reviewStatus: "reviewed"`. UHR PDF spot-check matched table of contents and sampled facts for geography, population, democracy, riksdag, prime minister, voting age, and referendums.
Blocked? no — CONTENT lane Batch 0 deliverables are complete; `codex-tasks/content.txt` is empty.
Next suggested validator action: accept A4/A5/A6 if validator quality review agrees.

## Iteration 5 — 2026-05-17
Task completed: Verified question atom — replaced `q010` with a Swedish-English Chapter 1 natural-resources question traced to UHR `Landet Sverige` / `Naturresurser`.
Artifacts changed: `data/questions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count (if applicable): 500 published questions total; source-question count unchanged at 100.
Verification: `npm run content:export` → exported 500 questions; `npm run validate:content` → 13 chapters, 500 questions, 500 published, 500 UHR references validated; `npm run test:content` → 2/2 passing; `npm run typecheck` → exit 0; `git diff --check` → exit 0.
Blocked? no — atom shipped without changing the 500-question production contract.
Next suggested validator action: review `q010` source wording against UHR `Sverige i fokus`, Chapter 1, section `Naturresurser`, approximate PDF page 7.

## Iteration 6 — 2026-05-17
Task completed: Verified question atom — tightened `q032` into a Swedish-English secret-ballot question traced to UHR `Politiska val och partier` / `Så här går det till att rösta`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count (if applicable): 500 published questions total; source-question count unchanged at 100.
Verification: `npm run content:export` → exported 500 questions; `npm run validate:content` → 13 chapters, 500 questions, 500 published, 500 UHR references validated; `npm run test:content` → 2/2 passing; `npm run typecheck` → exit 0; `git diff --check` → exit 0; `npm run test:ownership` → 1/1 passing.
Blocked? no — atom shipped without changing the 500-question production contract.
Next suggested validator action: review `q032` source wording against UHR `Sverige i fokus`, Chapter 4, section `Så här går det till att rösta`, approximate PDF page 14.

## Iteration 7 — 2026-05-17
Task completed: Verified question atom — tightened `q033` into a Swedish-English political-parties question traced to UHR `Politiska val och partier` / `Politiska partier`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count (if applicable): 500 published questions total; source-question count unchanged at 100.
Verification: `npm run content:export` → exported 500 questions; `npm run validate:content` → 13 chapters, 500 questions, 500 published, 500 UHR references validated; `npm run test:content` → 2/2 passing; `npm run typecheck` → exit 0; `git diff --check` → exit 0; `npm run test:ownership` → 1/1 passing; `npx prettier --check data/additionalQuestions.ts` → passed; custom q033/source-count assertion → `sourceQuestions=100 questions=500`.
Blocked? no — atom shipped without changing the 500-question production contract.
Next suggested validator action: review `q033` source wording against UHR `Sverige i fokus`, Chapter 4, section `Politiska partier`, approximate PDF page 15.

## Iteration 8 — 2026-05-17
Task completed: Verified question atom — tightened `q034` into a Swedish-English proportional-elections example traced to UHR `Politiska val och partier` / `Proportionella val`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count (if applicable): 500 published questions total; source-question count unchanged at 100.
Verification: `npm run content:export` → exported 500 questions; `npm run validate:content` → 13 chapters, 500 questions, 500 published, 500 UHR references validated; `npm run test:content` → 2/2 passing; `npm run typecheck` → exit 0; `git diff --check` → exit 0; `npm run test:ownership` → 1/1 passing; `npx prettier --check data/additionalQuestions.ts` → passed; `node scripts/export-question-bank.js --check` → parity OK; custom q034/source-count assertion → `q034 OK; sourceQuestions=100; questions=500`.
Blocked? no — atom shipped without changing the 500-question production contract.
Next suggested validator action: review `q034` source wording against UHR `Sverige i fokus`, Chapter 4, section `Proportionella val`, approximate PDF page 15.

## Iteration 9 — 2026-05-17
Task completed: Verified question atom — tightened `q035` into a Swedish-English Riksdag four-percent threshold question traced to UHR `Politiska val och partier` / `Proportionella val`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count (if applicable): 500 published questions total; source-question count unchanged at 100.
Verification: `npm run content:export` → exported 500 questions; `npm run validate:content` → 13 chapters, 500 questions, 500 published, 500 UHR references validated; `npm run test:content` → 3/3 passing; `npm run typecheck` → exit 0; `npm run test:ownership` → 1/1 passing; `npx prettier --check data/additionalQuestions.ts` → passed; `node scripts/export-question-bank.js --check` → parity OK; `git diff --check` → exit 0; custom q035/source-count assertion → `q035 OK; sourceQuestions=100; questions=500`.
Blocked? no — atom shipped without changing the 500-question production contract.
Next suggested validator action: review `q035` source wording against UHR `Sverige i fokus`, Chapter 4, section `Proportionella val`, approximate PDF page 15.

## Iteration 10 — 2026-05-17
Task completed: Verified question atom — tightened `q036` into a Swedish-English four-constitutional-laws question traced to UHR `Lag och rätt` / `Grundlagarna`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count (if applicable): 500 published questions total; source-question count unchanged at 100.
Verification: `npm run content:export` → exported 500 questions; `npm run validate:content` → 13 chapters, 500 questions, 500 published, 500 UHR references validated; `npm run test:content` → 4/4 passing; `npm run typecheck` → exit 0; `npm run test:ownership` → 1/1 passing; `npx prettier --check data/additionalQuestions.ts` → passed; `node scripts/export-question-bank.js --check` → parity OK; `git diff --check` → exit 0; custom q036/source-count assertion → `q036 OK; sourceQuestions=100; questions=500`.
Blocked? no — atom shipped without changing the 500-question production contract.
Next suggested validator action: review `q036` source wording against UHR `Sverige i fokus`, Chapter 5, section `Grundlagarna`, approximate PDF page 16.

## Iteration 11 — 2026-05-17
Task completed: Verified question atom — tightened `q037` into a Swedish-English regeringsformen/public-power question traced to UHR `Lag och rätt` / `Regeringsformen`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count (if applicable): 500 published questions total; source-question count unchanged at 100.
Verification: `npm run content:export` → exported 500 questions; `npm run validate:content` → 13 chapters, 500 questions, 500 published, 500 UHR references validated; `npm run test:content` → 4/4 passing; `npm run typecheck` → exit 0; `npm run test:ownership` → 1/1 passing; `npx prettier --check data/additionalQuestions.ts` → passed; `node scripts/export-question-bank.js --check` → parity OK; `git diff --check` → exit 0; custom q037/export assertion → `q037 OK; exportedQuestions=500`.
Blocked? no — atom shipped without changing the 500-question production contract.
Next suggested validator action: review `q037` source wording against UHR `Sverige i fokus`, Chapter 5, section `Regeringsformen`, approximate PDF page 16.

## Iteration 12 — 2026-05-17
Task completed: Verified question atom — tightened `q038` into a Swedish-English successionsordningen question traced to UHR `Lag och rätt` / `Successionsordningen`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count (if applicable): 500 published questions total; source-question count unchanged at 100.
Verification: `npm run content:export` → exported 500 questions; `npm run validate:content` → 13 chapters, 500 questions, 500 published, 500 UHR references validated; `npm run test:content` → 4/4 passing; `npm run typecheck` → exit 0; `npm run test:ownership` → 1/1 passing; `node scripts/export-question-bank.js --check` → parity OK; `npx prettier --check data/additionalQuestions.ts` → passed; `git diff --check` → exit 0; custom q038/export assertion → `q038 OK; sourceQuestions=100; exportedQuestions=500`.
Blocked? no — atom shipped without changing the 500-question production contract.
Next suggested validator action: review `q038` source wording against UHR `Sverige i fokus`, Chapter 5, section `Successionsordningen`, approximate PDF page 16.

## Iteration 13 — 2026-05-17
Task completed: Verified question atom — tightened `q039` into a Swedish-English allemansrätten question traced to UHR `Lag och rätt` / `Allemansrätten`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count (if applicable): 500 published questions total; source-question count unchanged at 100.
Verification: `npm run content:export` → exported 500 questions; `npm run validate:content` → 13 chapters, 500 questions, 500 published, 500 UHR references validated; `npm run test:content` → 4/4 passing; `npm run typecheck` → exit 0; `npm run test:ownership` → 1/1 passing; `node scripts/export-question-bank.js --check` → parity OK; `npx prettier --check data/additionalQuestions.ts` → passed; `git diff --check` → exit 0; direct `q039` export check found the updated source and CSV rows.
Blocked? no — atom shipped without changing the 500-question production contract.
Next suggested validator action: review `q039` source wording against UHR `Sverige i fokus`, Chapter 5, section `Allemansrätten`, approximate PDF page 17.

## Iteration 14 — 2026-05-17
Task completed: Verified question atom — tightened `q040` into a Swedish-English rättsväsendet-authorities question traced to UHR `Lag och rätt` / `Rättsväsendet`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count (if applicable): 500 published questions total; source-question count unchanged at 100.
Verification: `npm run content:export` → exported 500 questions; `npm run validate:content` → 13 chapters, 500 questions, 500 published, 500 UHR references validated; `npm run test:content` → 4/4 passing; `npm run typecheck` → exit 0; `npm run test:ownership` → 1/1 passing; `node scripts/export-question-bank.js --check` → parity OK; `npx prettier --check data/additionalQuestions.ts` → passed; `git diff --check` → exit 0; direct `q040` source/export assertion → `q040 OK; sourceQuestions=100; exportedQuestions=500`.
Blocked? no — atom shipped without changing the 500-question production contract.
Next suggested validator action: review `q040` source wording against UHR `Sverige i fokus`, Chapter 5, section `Rättsväsendet`, approximate PDF page 17.
## Iteration 15 — 2026-05-17
Task completed: Verified question atom — tightened `q041` into a Swedish-English rättssäkerhet question traced to UHR `Lag och rätt` / `Rättssäkerhet`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count / verification: 500 published questions total; source-question count unchanged at 100. `npm run content:export`, `npm run validate:content`, `npm run test:content`, `npm run typecheck`, `npm run test:ownership`, `node scripts/export-question-bank.js --check`, `npx prettier --check data/additionalQuestions.ts`, `git diff --check`, and direct `q041` source/export assertion all passed.
Blocked / next validator action: no — review `q041` against UHR `Sverige i fokus`, Chapter 5, section `Rättssäkerhet`, approximate PDF page 17.
## Iteration 16 — 2026-05-17
Task completed: Verified question atom — tightened `q042` into a Swedish-English domstolar/presumption-of-innocence question traced to UHR `Lag och rätt` / `Domstolar`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count / verification: 500 published questions total; source-question count unchanged at 100. `npm run content:export`, `npm run validate:content`, `npm run test:content`, `npm run typecheck`, `npm run test:ownership`, `node scripts/export-question-bank.js --check`, `npx prettier --check data/additionalQuestions.ts`, `git diff --check`, and direct `q042` source/export assertion all passed.
Blocked / next validator action: no — review `q042` against UHR `Sverige i fokus`, Chapter 5, section `Domstolar`, approximate PDF page 18.
## Iteration 17 — 2026-05-17
Task completed: Verified question atom — tightened `q043` into a Swedish-English police-role question traced to UHR `Lag och rätt` / `Polisen`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count / verification: 500 published questions total; source-question count unchanged at 100. UHR source checked in `Sverige i fokus`, Chapter 5, section `Polisen`, approximate PDF page 18: police maintain law and order, prevent and investigate crimes, cooperate for safety, and help people exposed to crime or needing protection. `npm run content:export`, `npm run validate:content`, `npm run test:content`, `npm run typecheck`, `npm run test:ownership`, `node scripts/export-question-bank.js --check`, `npx prettier --check data/additionalQuestions.ts`, `git diff --check`, and direct `q043` source/export assertion all passed.
Blocked / next validator action: no — review `q043` against UHR `Sverige i fokus`, Chapter 5, section `Polisen`, approximate PDF page 18.
## Iteration 18 — 2026-05-17
Task completed: Verified question atom — tightened `q044` into a Swedish-English criminal-responsibility-age question traced to UHR `Lag och rätt` / `Straffmyndighet och belastningsregister`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count / verification: 500 published questions total; source-question count unchanged at 100. UHR source checked in `Sverige i fokus`, Chapter 5, section `Straffmyndighet och belastningsregister`, approximate PDF page 19: a person in Sweden is criminally responsible and can be prosecuted from age 15, with a separate 2026 proposal mentioned for serious crimes. `npm run content:export`, `npm run validate:content`, `npm run test:content`, `npm run typecheck`, `npm run test:ownership`, `node scripts/export-question-bank.js --check`, `npx prettier --check data/additionalQuestions.ts`, `git diff --check`, and direct `q044` source/export assertion all passed.
Blocked / next validator action: no — review `q044` against UHR `Sverige i fokus`, Chapter 5, section `Straffmyndighet och belastningsregister`, approximate PDF page 19.
## Iteration 19 — 2026-05-17
Task completed: Verified question atom — tightened `q045` into a Swedish-English free-media role question traced to UHR `Mediernas roll` / `Fria medier`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count / verification: 500 published questions total; source-question count unchanged at 100. UHR source checked in `Sverige i fokus`, Chapter 6, section `Fria medier`, approximate PDF page 20: media in a democracy are free, the state cannot decide what is said in them, media inform about news and provide space for public discussion, and journalists should be able to scrutinize politicians and other people with power. `npm run content:export`, `npm run validate:content`, `npm run test:content`, `npm run typecheck`, `npm run test:ownership`, `node scripts/export-question-bank.js --check`, `npx prettier --check data/additionalQuestions.ts`, `git diff --check`, and direct `q045` source/export assertion all passed.
Blocked / next validator action: no — review `q045` against UHR `Sverige i fokus`, Chapter 6, section `Fria medier`, approximate PDF page 20.
## Iteration 20 — 2026-05-17
Task completed: Verified question atom — tightened `q046` into a Swedish-English offentlighetsprincipen question traced to UHR `Mediernas roll` / `Fria medier`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count / verification: 500 published questions total; source-question count unchanged at 100. UHR source checked in `Sverige i fokus`, Chapter 6, section `Fria medier`, approximate PDF page 20: offentlighetsprincipen supports scrutiny because public authority documents are public and may be requested unless covered by secrecy rules. `npm run content:export`, `npm run validate:content`, `npm run test:content`, `npm run typecheck`, `npm run test:ownership`, `node scripts/export-question-bank.js --check`, `npx prettier --check data/additionalQuestions.ts`, `git diff --check`, and direct `q046` source/export assertion all passed.
Blocked / next validator action: no — review `q046` against UHR `Sverige i fokus`, Chapter 6, section `Fria medier`, approximate PDF page 20.
## Iteration 21 — 2026-05-17
Task completed: Verified question atom — tightened `q047` into a Swedish-English media-source anonymity question traced to UHR `Mediernas roll` / `Fria medier`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count / verification: 500 published questions total; source-question count unchanged at 100. UHR source checked in `Sverige i fokus`, Chapter 6, section `Fria medier`, approximate PDF page 20: people may provide information to newspapers, radio, and TV without punishment, and the person giving information has the right to anonymity. `npm run content:export`, `npm run validate:content`, `npm run test:content`, `npm run typecheck`, `npm run test:ownership`, `node scripts/export-question-bank.js --check`, `npx prettier --check data/additionalQuestions.ts`, `git diff --check`, and direct `q047` source/export assertion all passed.
Blocked / next validator action: no — review `q047` against UHR `Sverige i fokus`, Chapter 6, section `Fria medier`, approximate PDF page 20.
## Iteration 22 — 2026-05-17
Task completed: Verified question atom — tightened `q048` into a Swedish-English public-service companies question traced to UHR `Mediernas roll` / `Public service`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count / verification: 500 published questions total; source-question count unchanged at 100. UHR source checked in `Sverige i fokus`, Chapter 6, section `Public service`, approximate PDF page 21: the section identifies Sveriges Radio, Sveriges Television, and Utbildningsradion as the three public-service media companies and describes their special mission, program breadth, and tax-fee financing. `npm run content:export`, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run typecheck`, `npm run test:ownership`, `npx prettier --check data/additionalQuestions.ts`, `git diff --check`, and direct `q048` source/export assertion all passed.
Blocked / next validator action: no — review `q048` against UHR `Sverige i fokus`, Chapter 6, section `Public service`, approximate PDF page 21.
## Iteration 23 — 2026-05-17
Task completed: Verified question atom — tightened `q049` into a Swedish-English public-service independence question traced to UHR `Mediernas roll` / `Public service`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count / verification: 500 published questions total; source-question count unchanged at 100. UHR source checked in `Sverige i fokus`, Chapter 6, section `Public service`, approximate PDF page 21: public service companies should be independent of political and other interests, report on society, and let different views be heard without choosing sides. `npm run content:export`, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run typecheck`, `npm run test:ownership`, `npx prettier --check data/additionalQuestions.ts`, `git diff --check`, and direct `q049` source/export assertion all passed.
Blocked / next validator action: no — review `q049` against UHR `Sverige i fokus`, Chapter 6, section `Public service`, approximate PDF page 21.
## Iteration 24 — 2026-05-17
Task completed: Verified question atom — tightened `q050` into a Swedish-English source-criticism question traced to UHR `Mediernas roll` / `Källkritik`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Question count / verification: 500 published questions total; source-question count unchanged at 100. UHR source checked in `Sverige i fokus`, Chapter 6, section `Källkritik`, approximate PDF page 21, source lines 597-602: information can come from many sources, not everything published is always correct, and being source-critical means questioning and checking whether what one reads, sees, or hears is correct. `npm run content:export`, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run typecheck`, `npm run test:ownership`, `npx prettier --check data/additionalQuestions.ts`, scoped `git diff --check`, and direct `q050` source/export assertion all passed.
Blocked / next validator action: no — review `q050` against UHR `Sverige i fokus`, Chapter 6, section `Källkritik`, approximate PDF page 21.
## Iteration 25 — 2026-05-17
Task completed: Verified question atom — tightened `q051` into a Swedish-English UN/human-rights question traced to UHR `Mänskliga rättigheter` / `Mänskliga rättigheter gäller alla`.
Artifacts changed: `data/additionalQuestions.ts`, `content/question-bank.csv`, `docs/parallel-sessions/journals/content.md`
Commit: `4ccba49` (`content: tighten media and rights questions`).
Question count / verification: 500 published questions total; source-question count unchanged at 100. UHR source checked in `Sverige i fokus`, Chapter 7, section `Mänskliga rättigheter gäller alla`, approximate PDF page 22, source lines 620-627: human rights are equal for all, and after the Second World War in 1945, 51 countries created the UN to prevent future wars and protect every person's rights. `npm run content:export`, `npm run validate:content`, `npm run test:content`, `node scripts/export-question-bank.js --check`, `npm run typecheck`, `npm run test:ownership`, `npx prettier --check data/additionalQuestions.ts`, scoped `git diff --check`, and direct `q051` source/export assertion all passed.
Blocked / next validator action: no — review `q051` against UHR `Sverige i fokus`, Chapter 7, section `Mänskliga rättigheter gäller alla`, approximate PDF page 22.

## Iteration 26 — 2026-05-17
Task completed: CONTENT-EXTERNAL Phase-B atom — added same-topic Riksdag-sourced questions `q101`-`q104` under UHR Chapter 3 / `Staten`, with `provenance: "external"`, public source metadata, CSV export columns, and visible SV+EN external-source label/citation UI.
Artifacts changed: `types/content.ts`, `data/additionalQuestions.ts`, `data/questions.ts`, `content/question-bank.csv`, `lib/content/derivedQuestions.ts`, `lib/quiz/questionText.ts`, `components/quiz/QuestionCard.tsx`, `components/quiz/UHRReferenceCard.tsx`, `lib/quiz/examGenerator.ts`, `scripts/validate-content.js`, `scripts/export-question-bank.js`, content parity tests, `docs/parallel-sessions/journals/content.md`
Question count / verification: 520 published questions total; 104 authored source questions; 20 external-provenance published rows (4 source questions plus 16 generated variants). Public sources checked on 2026-05-17: Sveriges riksdag `Riksdagens uppgifter` verifies laws, state budget, and scrutiny; Sveriges riksdag `Kontrollerar regeringen` verifies kontrollmakt and interpellation details.
Verification: `npm run validate:content` -> OK with `questionProvenanceValidated: 520`, `sourceReferencesValidated: 520`, `externalProvenanceQuestions: 20`, `externalProvenanceUiLabelParityValidated: true`; `npm run test:content` -> 202/202 passing; `npm run typecheck` -> exit 0; `node scripts/export-question-bank.js --check` -> 520-question export parity OK; `npm run test:ownership` -> 1/1 passing; targeted `npx prettier --check ...` -> passed; `git diff --check` -> exit 0.
Blocked / next validator action: no — review external authority source wording for `q101`-`q104` against the Riksdag pages and accept the CONTENT-PROVENANCE-LABEL/SOURCE-EXPANSION atom if the UI label/citation evidence is sufficient.
