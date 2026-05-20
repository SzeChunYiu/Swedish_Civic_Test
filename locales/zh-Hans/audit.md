# Simplified Chinese Word-Level Audit

Updated: 2026-05-20

Status: phase-1 terminology and phrasebook audit. No Simplified Chinese app UI or
question content is enabled yet. This file records what has been checked and
what remains blocked before release.

## Evidence used

- `locales/zh-Hans/glossary.md` for Sweden-specific civic terminology.
- `locales/zh-Hans/phrasebook.md` for high-frequency UI candidates.
- `docs/localization/sample-corpus/zh-Hans/style-guide.md` for tone, mechanical
  translation repairs, and humor rules.
- Sweden Abroad China pages for Mainland public-service Chinese register.
- Government.se, JO, DO, Informationsverige, and Migrationsverket English pages
  for Swedish civic facts when Chinese official translations are unavailable.

## Checked decisions

| Area | Decision | Status |
|---|---|---|
| Script | Simplified Chinese only; no Traditional forms such as 資訊/網路/軟體. | checked |
| Region | Mainland vocabulary and punctuation. | checked |
| Citizenship | Use `瑞典公民身份`; avoid using `国籍` as a blanket translation. | checked |
| Riksdag | Use `瑞典议会（Riksdag）`, not PRC analogies. | checked |
| kommun | Use `市镇`; explain Swedish local self-government when needed. | checked |
| region | Use `大区` or explanatory wording; do not map to a Chinese province. | checked |
| Feedback tone | Use `答对了` / `这次选错了`; avoid accusatory literal wording. | checked |
| Source labels | Use `参考材料` / `资料来源`; avoid literal `源材料`. | checked |
| Humor | Only gentle encouragement; no literal translation of English/Swedish jokes. | checked_phase1 |

## Release blockers

1. App strings are not translated or wired for `zh-Hans`.
2. Question bank and answer explanations are not translated.
3. Accessibility labels and screen-reader text are not translated.
4. Legal/privacy/store metadata are not translated.
5. Native Simplified Chinese review has not signed off the full UI/content.
6. CJK layout and text-length runtime review has not been performed.
7. `docs/localization/readiness.json` correctly keeps `zh-Hans.releaseGate` blocked.

## Next audit slice

Translate and review one bounded UI surface, such as settings + language picker,
using the phrasebook. Keep it behind `available: false` until all release
blockers above are cleared.
