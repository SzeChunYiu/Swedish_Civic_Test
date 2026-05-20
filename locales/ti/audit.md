# Tigrinya Word-Level Audit

Updated: 2026-05-20

Status: phase-1 terminology and phrasebook audit. Tigrinya is not enabled in the app.

## Evidence used

- `docs/localization/sample-corpus/ti/style-guide.md`.
- Informationsverige Tigrinya democracy page for `ደሞክራሲ`, rights, free/fair elections, freedom of expression, and source-criticism register.
- Informationsverige Tigrinya Sweden-governance page for constitution, fundamental laws, national parliament/government wording, and Swedish-specific governance framing.
- Informationsverige Tigrinya discrimination page for `ኣድልዎ`, anti-discrimination law, DO wording, and sensitive rights-based tone.
- Swedish/English official sources remain required for time-sensitive citizenship and migration-rule facts.

## Checked decisions

| Area | Decision | Status |
|---|---|---|
| Register | Use formal but clear public-information Tigrinya, not Swedish/English word order. | checked_phase1 |
| Sweden framing | Use `ኣብ ሽወደን` when a rule is Sweden-specific. | checked |
| Citizenship | Use `ዜግነት ሽወደን` only as phase-1 candidate; legal/native review required. | blocked_until_native_legal_review |
| Residence permit | Use `መንበሪ ፍቓድ` from source navigation/register. | checked_phase1 |
| Democracy | Use `ደሞክራሲ`, with explanation through participation, free/fair elections, and rights. | checked |
| Rights/obligations | Use `መሰላት`, `ግቡኣት`, and `ግዴታታት` consistently by context. | checked_phase1 |
| Riksdag | Keep Swedish term visible: `ሃገራዊ ባይቶ ሽወደን (Riksdag)`. | checked_phase1 |
| Kommun/region | Explain Swedish local/regional levels; do not map to another country's institutions. | checked_phase1 |
| Feedback tone | Feedback should describe the answer, not shame the person. | checked |
| Sensitive topics | No humor around migration, religion, gender, family, citizenship, or nationality. | checked |
| Ge'ez script UI | Text expansion, punctuation, and wrapping need runtime review. | blocked_until_runtime_review |

## Release blockers

1. App strings are not translated or wired for `ti`.
2. Question bank and explanations are not translated.
3. Accessibility labels and screen-reader text are not translated or checked in Ge'ez script.
4. `locales/ti/glossary.md` is phase-1 only and needs native/legal review.
5. Native Tigrinya review has not signed off UI, content, word order, legal terms, or humor lines.
6. Runtime review has not checked Ge'ez script rendering, line wrapping, punctuation, and truncation.
7. Time-sensitive citizenship/migration facts must be rechecked against Migrationsverket/UHR before translation.
8. `docs/localization/readiness.json` correctly keeps `ti.releaseGate` blocked.

## Next audit slice

Translate a bounded UI surface such as language picker + settings using the phrasebook, then run a mobile/web runtime pass for Ge'ez script rendering before any native-review signoff.
