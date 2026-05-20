# Polish Word-Level Audit

Updated: 2026-05-20

Status: phase-1 terminology and phrasebook audit. Polish is not enabled in the app.

## Evidence used

- `docs/localization/sample-corpus/pl/style-guide.md`.
- Polish gov.pl migration pages for public-service/legal register: `zezwolenie na pobyt`, `wniosek`, `decyzja`, `prawa i obowiązki`.
- English/Swedish official sources for Swedish citizenship, democracy, governance, and rights facts.

## Checked decisions

| Area | Decision | Status |
|---|---|---|
| Register | Use plain official Polish, not English calques. | checked |
| Citizenship | Use `obywatelstwo szwedzkie`; avoid `narodowość` for legal status. | checked_phase1 |
| Applications | Use `złożyć wniosek` / `ubiegać się`, not `aplikować`. | checked |
| Residence permit | Use `zezwolenie na pobyt`. | checked |
| Rights/obligations | Use `prawa i obowiązki`. | checked |
| Riksdag | Use `szwedzki parlament (Riksdag)`, not `Sejm`. | checked |
| Feedback tone | Use gentle correction; avoid standalone shaming `Źle!`. | checked_phase1 |
| Swedish institutions | Keep Swedish-specific names and explain; no Polish institutional substitutions. | checked_phase1 |
| Humor | Only gentle study encouragement; no jokes about migration, bureaucracy, nationality, or accents. | checked_phase1 |
| Inflection/placeholders | Polish cases/gender need runtime and native review. | blocked_until_full_copy |

## Release blockers

1. App strings are not translated or wired for `pl`.
2. Question bank and explanations are not translated.
3. Accessibility labels and screen-reader text are not translated.
4. `locales/pl/glossary.md` is phase-1 only and needs native/legal review.
5. Native Polish review has not signed off UI, content, inflection, placeholders, or humor lines.
6. Runtime review has not checked text expansion and line wrapping.
7. `docs/localization/readiness.json` correctly keeps `pl.releaseGate` blocked.

## Next audit slice

Translate a bounded UI surface such as settings + language picker using the
phrasebook, then ask for native Polish review before any runtime enablement.
