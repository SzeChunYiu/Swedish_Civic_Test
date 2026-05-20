# zh-Hans Civic Localization Style Guide

Purpose: turn Simplified Chinese copy from mechanical translation into native,
Mainland-facing civic-study prose. Use this file before translating any UI,
question, explanation, badge, or humor line into `zh-Hans`.

## Voice

Write like a helpful public-information study guide:

- clear enough for adult learners outside the legal system;
- formal enough for citizenship, rights, law, and welfare topics;
- warm in practice feedback, but never childish or sarcastic;
- Sweden-specific, without replacing Swedish institutions with Chinese ones.

Default sentence shape:

1. put the learner's action or civic fact first;
2. add the condition or source after it;
3. keep one idea per sentence when explaining rights or legal rules.

## Mechanical-translation repairs

| Avoid | Use | Why |
|---|---|---|
| `做一个决定关于……` | `决定……` / `就……作出决定` | Chinese prefers a direct verb or formal verb-object structure. |
| `这是关于民主的一个问题` | `这道题考查民主制度。` | UI study copy should name what the question tests. |
| `开始一个练习会话` | `开始练习` / `开始本章练习` | Avoid English noun-stack structure. |
| `你是正确的` | `答对了` | Natural feedback, shorter and warmer. |
| `你是不正确的` | `答错了` / `这次选错了` | Natural and less accusatory. |
| `解释面板` | `解析` / `答案解析` | Native study-app term. |
| `源材料` | `参考材料` / `资料来源` | Natural source wording. |
| `政府办公室` for Regeringskansliet | `瑞典政府办公厅` | Sweden-specific term; avoid literal office wording. |
| `全国人大` for Riksdag | `瑞典议会（Riksdag）` | Do not map Sweden onto PRC institutions. |
| `省政府` for region/kommun | `大区` / `市镇` with a note | Swedish self-government levels are not PRC provincial governments. |

## Civic-term rules

- First mention: use Chinese gloss plus Swedish/official term when the Swedish
  word is teachable, e.g. `瑞典议会（Riksdag）`, `市镇（kommun）`.
- Later mentions: use the shortest clear form, e.g. `瑞典议会`, `市镇`.
- Use `公民身份` for citizenship in this app. Use `国籍` only when the source is
  specifically discussing nationality as a legal status.
- Use `瑞典高等教育委员会（UHR）` on first mention; use `UHR` after that.
- Use `信息来源辨析` for learner-facing source criticism. Use `来源批判` only in
  glossary or specialist contexts.

## UI patterns

| English/SV function | zh-Hans pattern |
|---|---|
| Start/resume practice | `开始练习`, `继续练习`, `继续学习第 {n} 章` |
| Mock exam | `模拟考试`, `计时模拟考试`; avoid implying official exam booking. |
| Progress | `已完成 {done}/{total}`, `今天已答 {count} 题` |
| Correct feedback | `答对了。` + one short reason. |
| Wrong feedback | `这次选错了。正确答案是……` + explanation. |
| Source citation | `依据 UHR 参考材料整理。` |
| Coming soon language | `此语言版本正在准备中。` |
| Privacy/local storage | `学习进度仅保存在本设备上。` |

## Humor and encouragement

Chinese encouragement should reduce pressure. Avoid direct boasts about passing
or passport outcomes.

Good patterns:

- `错一次没关系，把这个知识点记牢就好。`
- `今天又前进了一小步。`
- `先喝口水，再看下一题。`
- `Riksdag 这个词会反复出现，记住它很划算。`

Avoid:

- sarcasm after mistakes;
- idioms that sound like exam cramming or guaranteed success;
- word-for-word fika/midsommar jokes unless the Swedish culture word is being
  taught explicitly.

## Punctuation and script

- Use Simplified Chinese and Mainland punctuation: `。！？；：、`.
- Keep Latin abbreviations readable: `UHR`, `JO`, `DO`.
- Prefer Arabic numerals in UI counts: `13 章`, `{count} 题`.
- Do not mix Traditional forms such as `資訊`, `網路`, `軟體`, `勞動市場`.

## Word-by-word audit checklist

For every translated string, check:

1. Does it sound like a Chinese sentence, not an English/SV sentence in Chinese
   words?
2. Is every Swedish institution translated descriptively without PRC analogy?
3. Does the copy avoid promising exam success, citizenship, or passport
   outcomes?
4. Is the tone appropriate for the context: formal for law/rights, warm for
   feedback, neutral for source notes?
5. Are glossary terms from `locales/zh-Hans/glossary.md` used consistently?
6. Would a Mainland Chinese reader understand the sentence without knowing the
   Swedish original?

## Sources used for this style guide

See `sources.tsv` rows marked `official-register` and `style-anchor`, especially
Sweden Abroad China pages, Sweden Abroad Shanghai, Government.se governance
pages, Migrationsverket citizenship pages, and OHCHR Chinese treaty texts.
