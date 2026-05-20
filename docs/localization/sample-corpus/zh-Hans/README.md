# zh-Hans Sample Corpus Notes

Locale: Simplified Chinese for Mainland Chinese readers. Status: seeded from
existing `locales/zh-Hans/glossary.md` plus 2026-05-20 source pass.

## Register target

Use educated Mainland public-information prose: formal but not stiff, concise,
and explanatory. The civic-test app should sound like a helpful study guide or
a government-service information page, not like a word-for-word translation of
English UI copy.

Good pattern:

- Start with the user's action or right, then the condition.
- Keep Swedish institution names when they are part of the learning target.
- Add a short Chinese gloss on first mention instead of replacing Swedish
  institutions with PRC analogies.
- Prefer plain verbs: 申请, 选择, 了解, 参加, 遵守, 享有, 受到保护.

Avoid:

- Taiwan/HK vocabulary in `zh-Hans`: 資訊, 網路, 軟體, 列印, 立法院.
- PRC institution substitutions: 全国人大 for Riksdag, 国务院 for Swedish
  Government, 省政府 for a Swedish region/municipality.
- Translationese such as `做一个决定关于...`, `这是关于...的文本`, or long noun
  chains copied from English.

## Source-backed style observations

| Source | What to learn |
|---|---|
| Sweden Abroad China pages | Mainland public-service labels: 瑞典驻华大使馆, 签证, 居留许可, 在瑞典工作. |
| Migrationsverket citizenship pages | Citizenship facts and requirement sequence; keep facts current in English/Swedish if no Chinese page exists. |
| Government.se | Government/Riksdag/agency structure; translate descriptively, not by PRC analogy. |
| Informationsverige English/Swedish | Plain learner-facing civic explanations; use as meaning anchor, not Chinese style model. |
| UN/OHCHR Chinese treaty texts | Established treaty names such as 《儿童权利公约》. |

## Approved micro-samples for app tone

These are newly authored examples for the app; they are not copied from a
source.

| UI/copy situation | Native zh-Hans direction |
|---|---|
| Start a practice session | `开始练习` or `开始本章练习`; avoid `启动实践会话`. |
| Explain an answer | `为什么是这个答案` / `解析`; avoid `解释面板`. |
| Encourage after mistake | `错一次没关系，把这个知识点记牢就好。` |
| Celebrate progress | `今天又离考试更近一步。` |
| Source note | `依据 UHR 参考材料整理；本应用不是官方考试机构。` |
| Riksdag first mention | `瑞典议会（Riksdag）`; later `Riksdag` or `瑞典议会` depending on teaching need. |
| Municipality | `市镇`; if needed: `瑞典地方自治层级 kommun`. |
| Region | `大区`; if needed: `地区一级自治机构`. |

## Humor/localization notes

- Mascot/badge jokes should be gentle and study-related. Do not use sarcasm
  that could sound like blame after a wrong answer.
- Swedish cultural jokes should be localized by function, not image. A fika joke
  can become a short study-break line, but should still teach the Swedish word
  if the word matters.
- Use Chinese full-width punctuation in prose: `。！？；：`, with natural spacing
  around Latin acronyms like `UHR` only when readability requires it.

## Next zh-Hans tasks

1. Add a source card TSV row for every source already listed in
   `locales/zh-Hans/glossary.md`.
2. Audit current site/app Chinese strings when they exist; flag any
   translationese against the rules above.
3. Translate only after a second native-read pass is assigned.
