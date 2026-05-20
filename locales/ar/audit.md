# Arabic Word-Level Audit

Updated: 2026-05-20

Status: phase-1 terminology and phrasebook audit. Arabic is not enabled in the app.

## Evidence used

- `docs/localization/sample-corpus/ar/style-guide.md`.
- Informationsverige Arabic child-rights page for rights/public-information register.
- Informationsverige Arabic housing rights/obligations page for duties and housing terms.
- Informationsverige Arabic democracy page for civic terminology.
- English/Swedish official sources remain required for citizenship and governance facts when no Arabic page exists.

## Checked decisions

| Area | Decision | Status |
|---|---|---|
| Register | Use Modern Standard Arabic public-information style. | checked |
| About Sweden | Use `معلومات حول السويد`. | checked |
| Civic orientation | Use `التوجيه المجتمعي`. | checked |
| Rights/obligations | Use `حقوق وواجبات الفرد`. | checked |
| Residence permit | Use `تصريح الإقامة`. | checked |
| Discrimination | Use `التمييز`; Discrimination Act as `قانون التمييز`. | checked |
| Feedback tone | Use gentle correction; avoid standalone shaming `خطأ!`. | checked_phase1 |
| Swedish institutions | Keep Swedish-specific names and explain; no Arab-country substitutions. | checked_phase1 |
| Humor | Only gentle study encouragement; no jokes about migration, religion, family, or legal status. | checked_phase1 |
| RTL | Arabic must pass RTL layout/accessibility review before release. | blocked |

## Release blockers

1. App strings are not translated or wired for `ar`.
2. Question bank and explanations are not translated.
3. Accessibility labels and screen-reader text are not translated.
4. `locales/ar/glossary.md` is phase-1 only and needs native/legal review.
5. Arabic native review has not signed off UI, content, or humor lines.
6. RTL runtime review has not checked layout, alignment, numbers, and line wrapping.
7. `docs/localization/readiness.json` correctly keeps `ar.releaseGate` blocked.

## Next audit slice

Translate a bounded UI surface such as settings + language picker using the
phrasebook, then run native Arabic and RTL runtime review before any enablement.
