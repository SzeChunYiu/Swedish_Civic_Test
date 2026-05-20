# Turkish Word-Level Audit

Updated: 2026-05-20

Status: phase-1 terminology and phrasebook audit. Turkish is not enabled in the app.

## Evidence used

- `docs/localization/sample-corpus/tr/style-guide.md`.
- Sweden Abroad Turkish residence-permit and family-migration pages for public-service Turkish register.
- Sweden Abroad Turkish education residence pages for requirements, fees, documents, and process wording.
- English/Swedish official sources remain required for citizenship, democracy, and governance facts where no Turkish Swedish-official civic page exists.

## Checked decisions

| Area | Decision | Status |
|---|---|---|
| Register | Use formal public-information Turkish and respectful `siz` where direct address is needed. | checked |
| Sweden | Use `İsveç`; preserve Turkish characters. | checked |
| Residence permit | Use `oturum izni`. | checked |
| Migration Agency | Use `İsveç Göçmen Dairesi` with Migrationsverket if useful. | checked |
| Application wording | Use `başvuru yapmak` / `başvurmak`, not `uygulamak`. | checked |
| Feedback tone | Use gentle correction; avoid standalone shaming `Yanlış!`. | checked_phase1 |
| Swedish institutions | Keep Swedish-specific names and explain; no Turkey-specific substitutions. | checked_phase1 |
| Humor | Only gentle study encouragement; no jokes about migration, religion, nationality, or bureaucracy. | checked_phase1 |
| Character audit | Must preserve `İ/ı`, `ş`, `ğ`, `ç`, `ö`, `ü`. | blocked_until_full_copy |

## Release blockers

1. App strings are not translated or wired for `tr`.
2. Question bank and explanations are not translated.
3. Accessibility labels and screen-reader text are not translated.
4. `locales/tr/glossary.md` is phase-1 only and needs native/legal review.
5. Native Turkish review has not signed off UI, content, or humor lines.
6. Runtime review has not checked text expansion and Turkish-character rendering.
7. `docs/localization/readiness.json` correctly keeps `tr.releaseGate` blocked.

## Next audit slice

Translate a bounded UI surface such as settings + language picker using the
phrasebook, then ask for native Turkish review before any runtime enablement.
