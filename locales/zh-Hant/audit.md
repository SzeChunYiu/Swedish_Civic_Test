# Traditional Chinese Word-Level Audit

Updated: 2026-05-20

Status: phase-1 terminology and phrasebook audit. Traditional Chinese is not enabled in the app.

## Evidence used

- `docs/localization/sample-corpus/zh-Hant/style-guide.md`.
- Government.se and Migrationsverket English/Swedish sources for Swedish facts and time-sensitive citizenship/migration terms.
- Taiwan Presidential Office constitution introduction for formal Traditional Chinese civic register such as `主權在民`, `人民自由權利`, and `地方自治`.
- Taiwan government immigration/service pages for public-service UI vocabulary such as `申辦服務`, `線上申辦`, `申請進度查詢`, `居留`, and `永久居留`.
- Traditional Chinese register sources are used for language style only; they are not sources for Swedish civic facts.

## Checked decisions

| Area | Decision | Status |
|---|---|---|
| Variant | Default to Taiwan-style Traditional Chinese unless future product decision says otherwise. | checked_phase1 |
| Native copy | Do not script-convert Simplified Chinese; write native `zh-Hant`. | checked |
| Swedish institutions | Preserve Swedish names and explain; no PRC/Taiwan/HK institutional substitutions. | checked |
| Riksdag | Use `瑞典議會（Riksdag）`; never `全國人大` or `立法院`. | checked |
| Kommun/region | Use `市鎮（kommun）` and `大區`/`區域層級` with Swedish-context explanation. | checked_phase1 |
| Citizenship | Use `瑞典公民身分` for learner UI and `瑞典國籍` for legal nationality where needed. | checked_phase1 |
| Residence permit | Use `居留許可` as phase-1 Sweden-context candidate; native/legal review required. | checked_phase1 |
| Rights/obligations | Use `權利` and `義務`; avoid vague moralizing. | checked |
| Feedback tone | Use warm study feedback such as `答對了` / `這次選錯了`; no shaming. | checked |
| Punctuation | Use Traditional Chinese punctuation and check line wrapping. | blocked_until_runtime_review |
| Humor | Only gentle encouragement; no jokes about migration, citizenship, exams, religion, gender, or family. | checked_phase1 |

## Release blockers

1. App strings are not translated or wired for `zh-Hant`.
2. Question bank and explanations are not translated.
3. Accessibility labels and screen-reader text are not translated or checked for Traditional Chinese punctuation.
4. `locales/zh-Hant/glossary.md` is phase-1 only and needs native/legal review.
5. Native Traditional Chinese review has not signed off UI, content, terminology, variant choice, or humor lines.
6. Runtime review has not checked text expansion, line wrapping, punctuation, and truncation.
7. Time-sensitive citizenship/migration facts must be rechecked against Migrationsverket/UHR before translation.
8. `docs/localization/readiness.json` correctly keeps `zh-Hant.releaseGate` blocked.

## Next audit slice

Translate a bounded UI surface such as settings + language picker using this phrasebook, then run a runtime pass for Traditional Chinese punctuation, wrapping, and screen-reader labels before any enablement.
