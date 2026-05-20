# Central Kurdish / Sorani Word-Level Audit

Updated: 2026-05-20

Status: phase-1 terminology and phrasebook audit. Sorani is corpus-only and not enabled in the app.

## Evidence used

- `docs/localization/sample-corpus/ckb/style-guide.md`.
- Skolverket SFI Sorani curriculum for learner/education vocabulary, course/register tone, and source-evaluation wording.
- Swedish municipal/organization Sorani material listed in `docs/localization/sample-corpus/ckb/sources.tsv` for service/support register where accessible.
- Government.se and Informationsverige English/Swedish pages for Swedish governance, democracy, rights, and citizenship facts because no full Sorani Swedish civic-orientation corpus has been found.

## Checked decisions

| Area | Decision | Status |
|---|---|---|
| Source boundary | Use Sorani public-service sources for tone; Swedish/English official sources for Swedish facts. | checked_phase1 |
| Dialect | Use Sorani/Central Kurdish; do not mix in Kurmanji. | checked_phase1 |
| Script/runtime | Arabic-based Kurdish script and RTL layout require runtime review. | blocked_until_runtime_review |
| Citizenship | Use `هاووڵاتیبوونی سویدی` only as phase-1 candidate; native/legal review required. | blocked_until_native_legal_review |
| Residence permit | Use `مۆڵەتی نیشتەجێبوون` as candidate; native/legal review required. | blocked_until_native_legal_review |
| Democracy | Use `دیموکراسی`; explain representative democracy simply. | checked_phase1 |
| Rights/obligations | Use `مافەکان`, `ئەرکەکان`, and `بەرپرسیارێتی` consistently by context. | checked_phase1 |
| Riksdag | Use `پارلەمانی سوید (Riksdag)`; do not substitute Kurdish/Iraqi/Iranian institutions. | checked_phase1 |
| Kommun/region | Explain Swedish `kommun`/`region`; avoid Iraqi Kurdistan analogy. | checked_phase1 |
| Feedback tone | Feedback should describe the answer, not shame the learner. | checked |
| Humor | Only gentle encouragement; no jokes about asylum, migration, citizenship, religion, gender, family, or exams. | checked |

## Release blockers

1. Sorani is not in the runtime picker and has no app-available readiness entry.
2. App strings are not translated or wired for `ckb`.
3. Question bank and explanations are not translated.
4. Accessibility labels and screen-reader text are not translated or checked for RTL Sorani.
5. `locales/ckb/glossary.md` is phase-1 only and needs native/legal review.
6. Native Sorani review has not signed off UI, content, dialect, legal terms, RTL punctuation, or humor lines.
7. A full official Swedish civic-orientation corpus in Sorani is still missing.
8. Time-sensitive citizenship/migration facts must be rechecked against Migrationsverket/UHR before translation.

## Next audit slice

If Sorani is added to the picker later, first add it to `docs/localization/readiness.json` as blocked, then translate a bounded UI surface such as language picker + settings and run an RTL rendering pass before native-review signoff.
