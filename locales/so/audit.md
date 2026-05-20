# Somali Word-Level Audit

Updated: 2026-05-20

Status: phase-1 terminology and phrasebook audit. Somali is not enabled in the app.

## Evidence used

- `docs/localization/sample-corpus/so/style-guide.md`.
- Informationsverige Somali `Ku saabsan Iswiidhan` page for civic-orientation structure.
- Informationsverige Somali discrimination page for rights/discrimination terms.
- Informationsverige Somali housing rights/obligations page for public-service rights/duties register.
- English/Swedish official sources remain required for citizenship and governance facts when no Somali page exists.

## Checked decisions

| Area | Decision | Status |
|---|---|---|
| Language name | Use `Soomaali` in labels. | checked |
| Sweden | Use `Iswiidhan`. | checked |
| About Sweden | Use `Ku saabsan Iswiidhan`. | checked |
| Rights/obligations | Use `xuquuqda iyo waajibaadka`. | checked |
| Discrimination | Use `takoorid`; Discrimination Act as `sharciga takooridda`. | checked |
| Public authorities | Use `hay’adaha dawlada` / `hay’ad dawladeed` by context. | checked |
| Feedback tone | Use gentle correction; avoid `Khalad!` as a standalone scold. | checked_phase1 |
| Swedish institutions | Keep Swedish-specific names and explain; no Somalia-specific substitutions. | checked_phase1 |
| Humor | Only gentle study encouragement; no jokes about migration, religion, family, or legal status. | checked_phase1 |

## Release blockers

1. App strings are not translated or wired for `so`.
2. Question bank and explanations are not translated.
3. Accessibility labels and screen-reader text are not translated.
4. `locales/so/glossary.md` is phase-1 only and needs native/legal review.
5. Somali native review has not signed off UI, content, or humor lines.
6. Runtime review has not checked text expansion and line wrapping.
7. `docs/localization/readiness.json` correctly keeps `so.releaseGate` blocked.

## Next audit slice

Translate a bounded UI surface such as settings + language picker using the
phrasebook, then ask for native Somali review before any runtime enablement.
