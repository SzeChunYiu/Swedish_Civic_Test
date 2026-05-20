# Arabic Glossary

Status: phase-1 glossary. Use with `docs/localization/sample-corpus/ar/style-guide.md`.

## Source notes

Informationsverige Arabic pages provide strong Swedish-official Arabic register for this app. Useful patterns include:

- `معلومات حول السويد` for About Sweden.
- `مادة للتوجيه المجتمعي` for civic-orientation material.
- `حقوق وواجبات الفرد` for individual rights and obligations.
- `تصريح الإقامة` for residence permit.
- `التمييز` and `قانون التمييز` for discrimination and the Discrimination Act.
- `السلطات` / `هيئة حكومية` for authorities/government agency depending on sentence.

Use Modern Standard Arabic. Keep Swedish facts anchored to Swedish official sources, and do not map Swedish institutions onto institutions from any Arabic-speaking country.

## Civic terms

| Swedish/English concept | Arabic rendering | Notes |
|---|---|---|
| Sweden | السويد | Source-backed. |
| About Sweden | معلومات حول السويد | Source-backed heading. |
| civic orientation | التوجيه المجتمعي | Source-backed. |
| rights | حقوق | Use `الحقوق` in labels. |
| obligations/duties | واجبات / التزامات | `حقوق وواجبات الفرد` is source-backed; `التزامات` may fit housing/legal duties. |
| individual rights and obligations | حقوق وواجبات الفرد | Source-backed. |
| human rights | حقوق الإنسان | Source-backed. |
| child rights | حقوق الطفل | Source-backed. |
| Convention on the Rights of the Child | اتفاقية حقوق الطفل | Source-backed. |
| discrimination | التمييز | Source-backed. |
| Discrimination Act | قانون التمييز | Use for Swedish Discrimination Act with context. |
| Equality Ombudsman / DO | أمين/مفوّض مكافحة التمييز (DO) | Needs native/legal review; source pages explain DO role. |
| government agency / authority | سلطة / هيئة حكومية | Use `السلطات` for authorities in general. |
| democracy | الديمقراطية | Source-backed; explain Swedish democracy with source facts. |
| Riksdag | البرلمان السويدي (Riksdag) | Keep Swedish term on first mention when teaching the institution. |
| municipality / kommun | البلدية / kommun | Use `البلدية` when context is local responsibility; add Swedish term if teaching. |
| region | الإقليم / region | Needs context; explain Swedish regional elected level. |
| citizenship | الجنسية / المواطنة | For Swedish citizenship, use a native/legal review; `الجنسية السويدية` is often natural for status. |
| residence permit | تصريح الإقامة | Source-backed. |
| freedom of expression | حرية التعبير | Standard civic term. |
| freedom of religion | الحرية الدينية | Source-backed section label. |
| gender equality | المساواة بين الجنسين | Source-backed. |
| source criticism | تقييم المصادر | Learner-friendly; native review before release. |

## UI term decisions

| English app term | Arabic candidate | Notes |
|---|---|---|
| practice | تدريب | Use for study mode. |
| start practice | ابدأ التدريب | Short CTA. |
| continue practice | تابع التدريب | Natural continuation. |
| question | سؤال | |
| answer | إجابة | |
| answer option | خيار الإجابة | |
| explanation | الشرح | `تفسير` sounds less natural in study UI. |
| correct | صحيح. | Short feedback. |
| incorrect | ليست الإجابة الصحيحة تمامًا. | Gentle correction. |
| source material | مادة مرجعية | Avoid literal `مواد مصدرية`. |
| coming soon | هذا الإصدار قيد الإعداد | Public-information tone for unavailable language. |
| local device | هذا الجهاز | Privacy/local-storage copy. |

## False friends and style warnings

- Do not use colloquial dialect in core UI or civic content.
- Do not translate Swedish bodies into Arab-country institutional equivalents.
- Avoid English noun-stack calques such as `جلسة ممارسة` when `تدريب` is enough.
- Keep tone respectful; no jokes about migration, religion, family, accent, or legal status.
- RTL runtime and accessibility review is mandatory before enabling Arabic.
