# Ukrainian Word-Level Audit

Updated: 2026-05-20

Status: phase-1 terminology and phrasebook audit. Ukrainian is corpus-only and not enabled in the app.

## Evidence used

- `docs/localization/sample-corpus/uk/style-guide.md`.
- Informationsverige Ukrainian democracy page for `демократія`, `представницька демократія`, rights, free/fair elections, freedom of expression, and source-critical register.
- Informationsverige Ukrainian governance page for Swedish-government framing and institutional wording.
- Informationsverige Ukrainian discrimination and rights pages for sensitive rights-based tone.
- Swedish/English official sources remain required for time-sensitive citizenship and migration-rule facts.

## Checked decisions

| Area | Decision | Status |
|---|---|---|
| Register | Use standard Ukrainian public-service language; avoid Russian calques and mixed wording. | checked_phase1 |
| Sweden framing | Use `у Швеції` when a rule is Sweden-specific. | checked |
| Citizenship | Use `громадянство Швеції` / `шведське громадянство`; native/legal review required. | checked_phase1 |
| Residence permit | Use `дозвіл на проживання` where it matches source/register; verify legal nuance. | checked_phase1 |
| Applications | Use `заява` / `подати заяву`, not `аплікація`. | checked_phase1 |
| Democracy | Use `демократія` and `представницька демократія` with rights/elections explanation. | checked |
| Rights/obligations | Use `права та обов'язки`; reserve `зобов'язання` for formal/legal contexts. | checked_phase1 |
| Riksdag | Use `Парламент Швеції (Риксдаг)`; do not substitute Ukrainian parliament terminology as an analogy. | checked_phase1 |
| Feedback tone | Use gentle correction; avoid `ви провалили` and shaming phrases. | checked |
| Sensitive topics | No jokes around war, migration, citizenship, religion, gender, family, or minority rights. | checked |
| Inflection/placeholders | Ukrainian cases/gender/placeholders need runtime and native review. | blocked_until_runtime_review |

## Release blockers

1. Ukrainian is not in the runtime picker and has no app-available readiness entry.
2. App strings are not translated or wired for `uk`.
3. Question bank and explanations are not translated.
4. Accessibility labels and screen-reader text are not translated.
5. `locales/uk/glossary.md` is phase-1 only and needs native/legal review.
6. Native Ukrainian review has not signed off UI, content, inflection, placeholders, or humor lines.
7. Time-sensitive citizenship/migration facts must be rechecked against Migrationsverket/UHR before translation.

## Next audit slice

If Ukrainian is added to the picker later, first add it to `docs/localization/readiness.json` as blocked, then translate a bounded UI surface such as settings + language picker using this phrasebook.
