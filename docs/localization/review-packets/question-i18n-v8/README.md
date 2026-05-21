# Question i18n v8 native-review packets

These are machine-assisted q001-q177 question localization review packets for the UHR-published question bank.

Do not use these packets to enable a locale. They exist so native reviewers can check semantic accuracy, answer/distractor logic, civic terminology, tone, script/layout issues, and any culture-specific ambiguity before release gates move.

## Scope

- Source: generated `site/questions.js` from `data/questions.ts`, `data/additionalQuestions.ts`, and `data/questionLocalizations.ts`.
- Questions: 177 UHR-published rows, q001-q177.
- Review locales: `ar`, `ckb`, `fa`, `pl`, `so`, `ti`, `tr`, `uk`, `zh-Hans`, `zh-Hant`.
- Source/bridge columns: Swedish and English.

## Reviewer instructions

For each row, check that:

1. the target question asks the same thing as the Swedish source,
2. the correct answer remains correct and no distractor becomes accidentally correct,
3. explanations do not overclaim official authority,
4. civic/legal terms match local-language public-service usage,
5. wording is natural for the target locale and avoids literal translation,
6. script direction, punctuation, numbers, and names render correctly, and
7. reviewer notes are added before any readiness ledger is moved from blocked to allowed.

Keep `native_review_status` as `pending_native_review` until a native reviewer changes it in a reviewed copy.
