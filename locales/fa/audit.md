# Persian/Farsi Word-Level Audit

Updated: 2026-05-20

Status: phase-1 terminology and phrasebook audit. Persian is not enabled in the app.

## Evidence used

- `docs/localization/sample-corpus/fa/style-guide.md`.
- Informationsverige Persian rights/obligations page for public-information register.
- Informationsverige Persian freedom-of-religion page for rights/freedom wording.
- Informationsverige Persian democracy page for civic terminology.
- Informationsverige Persian housing rights/obligations page for duties/housing register.
- English/Swedish official sources remain required for citizenship and governance facts when Persian facts are incomplete.

## Checked decisions

| Area | Decision | Status |
|---|---|---|
| Register | Use clear public-information Persian; final target variant still needs decision. | checked_phase1 |
| About Sweden | Use `درباره سوئد`. | checked |
| Civic orientation | Use `آشنائی با جامعه سوئد` / `جهت یابی در جامعه` by context. | checked |
| Rights/obligations | Use `حق و حقوق و وظایف`. | checked |
| Residence permit | Use `اجازه اقامت`. | checked |
| Discrimination | Use `تبعیض`. | checked |
| Freedom of religion | Use `آزادی دین و مذهب`. | checked |
| Feedback tone | Use gentle correction; avoid standalone shaming `غلط!`. | checked_phase1 |
| Swedish institutions | Keep Swedish-specific names and explain; no Iran/Afghanistan/Tajikistan substitutions. | checked_phase1 |
| Humor | Only gentle study encouragement; no jokes about migration, religion, family, or legal status. | checked_phase1 |
| RTL | Persian must pass RTL layout/accessibility review before release. | blocked |

## Release blockers

1. App strings are not translated or wired for `fa`.
2. Question bank and explanations are not translated.
3. Accessibility labels and screen-reader text are not translated.
4. `locales/fa/glossary.md` is phase-1 only and needs native/legal review.
5. Target variant decision is unresolved: Iran Persian, Dari, or neutral Persian.
6. Native Persian/Dari review has not signed off UI, content, or humor lines.
7. RTL runtime review has not checked layout, alignment, numbers, and line wrapping.
8. `docs/localization/readiness.json` correctly keeps `fa.releaseGate` blocked.

## Next audit slice

Decide the target Persian variant, then translate a bounded UI surface such as
settings + language picker using the phrasebook. Do not enable `fa` before native
review and RTL runtime checks.
