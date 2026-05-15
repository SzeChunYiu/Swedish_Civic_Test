# CONTENT Lane — Sweden Citizenship Test Prep

## Role

You are the **CONTENT worker** for Batch 0. You own TypeScript content types and the sample question bank.

## Required reading at every iteration start

1. `docs/parallel-sessions/TEAM_PLAN.md` — acceptance checklist rows A4, A5, A6
2. `docs/content-strategy.md` — question type definition, fields, quality checklist
3. `swedish_citizenship_app_project_plan/11_sample_question_templates.md` — question templates
4. `swedish_citizenship_app_project_plan/05_database_schema.md` — schema reference
5. `docs/parallel-sessions/journals/content.md` — your prior handoffs

## Writable scope

- `types/`
- `data/`
- `docs/parallel-sessions/journals/content.md`

## Forbidden paths (read-only for this lane)

- `app/` — owned by SETUP lane
- `components/` — owned by SETUP lane
- `lib/` — owned by SETUP lane
- `docs/parallel-sessions/TEAM_PLAN.md` — owned by GM + VALIDATOR

## One-iteration cycle

Pick the **lowest-numbered incomplete task** from `codex-tasks/content.txt`:

### Task 1: types/content.ts

Define and export:
- `UHRReference` interface
- `QuestionOption` interface
- `PracticeQuestion` interface (all fields from docs/content-strategy.md)
- `Chapter` interface
- `ReviewStatus` type: `"draft" | "reviewed" | "published"`
- `QuestionType` type: `"single_choice" | "true_false" | "flashcard"`
- `Difficulty` type: `"easy" | "medium" | "hard"`

All must compile with `npx tsc --noEmit`.

### Task 2: data/chapters.ts

Create and export `chapters: Chapter[]` with all 13 UHR chapters.
Fields: `id` (ch01–ch13), `nameSv`, `nameEn`, `descriptionSv`, `descriptionEn`, `questionCount: 0` (placeholder).

Source chapter names from `swedish_citizenship_app_project_plan/01_project_plan.md`.

### Task 3: data/questions.ts (20 sample questions)

Create and export `questions: PracticeQuestion[]` with exactly 20 questions:
- 10 for `chapterId: "ch01"` (Landet Sverige — geography, capital, flag, population, language)
- 10 for `chapterId: "ch02"` (Sveriges demokratiska system — riksdag, government, voting age)

Requirements per question:
- Both `questionSv` and `questionEn` filled
- 4 options (for single_choice) or 2 options (for true_false)
- `correctOptionId` set
- `explanationSv` and `explanationEn` filled (2-3 sentences each)
- `uhrReference` filled (chapter, section, pageApprox)
- `reviewStatus: "reviewed"`

Content accuracy: base all facts on UHR's *Sverige i fokus* PDF. Verifiable public facts only. No invented statistics.

## Verification after each task

```bash
npx tsc --noEmit && echo "TypeScript OK"
node -e "const q = require('./data/questions'); console.log(q.questions.length, 'questions')" 2>/dev/null || echo "compile check only"
```

## Compact-safe stop rule

Complete one task, verify it, write handoff to journal, stop.

## Quality check before stopping

For questions, confirm every item passes the quality checklist in `docs/content-strategy.md`. Do not mark `reviewStatus: "reviewed"` if any checklist item fails.

## Handoff format (append to docs/parallel-sessions/journals/content.md)

```
## Iteration <N> — <YYYY-MM-DD>
Task completed: <task number + one-line description>
Artifacts changed: <file list>
Question count (if applicable): <N>
Verification: <command + result summary>
Blocked? no / yes — <reason>
Next suggested validator action: check <artifact>
```
