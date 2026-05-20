# zh-Hant Civic Localization Style Guide

Locale: Traditional Chinese for Sweden civic-test learners. Default convention:
Taiwan-facing Traditional Chinese unless a future product decision explicitly
chooses Hong Kong or another Traditional Chinese convention.

## Purpose

Use this guide before translating Traditional Chinese UI, quiz questions, answer
feedback, or civic explanations. `zh-Hant` must be a native Traditional Chinese
deliverable, not a mechanical script conversion from `zh-Hans`.

## Variant boundary

Default to Taiwan-style terms and punctuation:

- `資訊`, `網路`, `軟體`, `影片`, `列印`, `申請`, `居留`, `公民身分`
- use `瑞典`, not Mainland-only institutional analogies;
- use `市鎮（kommun）` or `地方自治單位` when explaining Swedish municipalities;
- avoid Hong Kong-only terms such as `網絡`, `軟件`, `身份證明文件` unless a future
  Hong Kong-specific locale is created;
- avoid simplified forms and Mainland-only civic analogies.

## Source-backed voice

Traditional Chinese public/government pages often use:

- concise navigation and service labels: `網站導覽`, `查詢`, `列印`, `申辦服務`,
  `快速申辦`
- formal civic/legal terms: `主權在民`, `人民自由權利`, `地方自治`, `權利義務`,
  `依法行政`, `法治主義`
- explanatory patterns: `這表示...`, `也就是...`, `例如...`, `依規定...`
- official but readable structure: short headings, numbered steps, one issue per
  paragraph.

For the app, keep legal/civic explanations formal enough to be trustworthy, but
shorter and warmer than constitutional or agency pages.

## Tone rules

1. Use native Traditional Chinese, not simplified text converted character by
   character.
2. Keep Swedish institutions visible; do not map them to Taiwanese, Hong Kong,
   PRC, or other institutions.
3. Use clear study-app language for practice and feedback.
4. Use formal, neutral wording for rights, duties, democracy, law, and welfare.
5. Avoid slang, sarcasm, and jokes about identity, migration, passports, exams,
   religion, gender, or family.
6. Never imply the app is an official exam authority or guarantees citizenship.

## Mechanical conversion repairs

| Mechanical or wrong | Better zh-Hant | Why |
|---|---|---|
| `瑞典全国人大` | `瑞典議會（Riksdag）` | Do not map Riksdag to PRC institutions. |
| `政府办公室` | `瑞典政府辦公廳` / `政府機關` | Choose Sweden-specific term by context. |
| `省政府` for region | `大區` / `區域層級` | Swedish regions are not provinces. |
| `做一個決定關於...` | `決定...` / `就...作出決定` | Natural Chinese verb structure. |
| `這是關於民主的一個問題` | `這題考的是民主制度。` | Natural study-app phrasing. |
| `你是正確的` | `答對了` / `回答正確` | Warmer, native feedback. |
| `你是不正確的` | `這次答錯了` / `這次選錯了` | Natural and non-shaming. |
| `開始一個練習會話` | `開始練習` | Avoid English noun-stack structure. |
| `源材料` | `參考資料` / `資料來源` | Natural source wording. |
| `通過公民測試保證入籍` | Never use | The app must not promise official outcomes. |

## Civic terminology

| Concept | zh-Hant target | Notes |
|---|---|---|
| Sweden | `瑞典` | Use consistently. |
| civic orientation | `社會導向課程` / `社會入門資訊` | Pick by context; explain if formal. |
| democracy | `民主` / `民主制度` | Use `代議民主` for representative democracy. |
| rule of law | `法治` / `法治國家` | `依法行政` for administrative legality. |
| Riksdag | `瑞典議會（Riksdag）` | First mention includes Swedish term. |
| government | `政府` | Avoid conflating with `國家`. |
| authority/agency | `機關` / `主管機關` / exact name | Use exact Swedish agency names where known. |
| municipality/kommun | `市鎮（kommun）` | Do not use `縣市政府` as a substitute. |
| region | `大區` / `區域層級` | Explain Swedish context if needed. |
| citizen | `公民` | Use for rights/participation. |
| citizenship | `瑞典公民身分` / `瑞典國籍` | Use `公民身分` for learner UI; `國籍` for legal nationality. |
| rights | `權利` | Pair with `義務` where relevant. |
| duties/obligations | `義務` / `責任` | `義務` for legal/civic duties. |
| discrimination | `歧視` | Define with plain examples when needed. |
| gender equality | `性別平等` | Avoid culture-war framing; keep rights-based. |
| freedom of expression | `言論自由` / `表達自由` | Choose by sentence. |
| source criticism | `來源辨識` / `資料來源判讀` | Learner-friendly; avoid too academic wording. |
| mock exam | `模擬測驗` | Avoid implying official exam booking. |

## UI and learning patterns

| English intent | zh-Hant pattern |
|---|---|
| Start practice | `開始練習` |
| Continue practice | `繼續練習` |
| Try again | `再試一次` |
| Correct | `答對了` / `回答正確` |
| Incorrect | `這次選錯了。` |
| Explanation | `解析：` / `答案解析：` |
| Learn more | `了解更多` |
| Source | `資料來源` |
| Review mistakes | `複習錯題` |
| Practice question | `練習題` |
| Mock exam | `模擬測驗` |
| Your progress | `你的進度` |
| Daily goal | `每日目標` |

## Question and explanation style

- Put the tested civic idea early: `這題考的是...`.
- Keep one legal/civic point per sentence.
- Use `在瑞典` when a rule is Sweden-specific.
- Explain Swedish terms on first mention instead of replacing them.
- Use Traditional punctuation: `。！？；：、「」『』`.

Example:

```text
答對了。在瑞典，選民透過自由選舉選出政黨與政治人物。
這是代議民主的一部分。
```

## Humor and encouragement

Traditional Chinese encouragement should reduce pressure and feel natural. Keep
humor light and never at the learner's expense.

Use:

- `錯一次沒關係，把這個觀念記起來就好。`
- `差一點。請留意「權利」和「義務」的差別。`
- `先把這題弄懂，再往下一題前進。`

Avoid:

- direct translations of Swedish fika or midsummer jokes unless teaching the
  cultural term;
- sarcasm after mistakes;
- idioms that imply cramming or guaranteed success;
- jokes about citizenship, passports, migration status, religion, gender, or
  family roles.

## Word-by-word audit checklist

Before accepting Traditional Chinese text, ask:

1. Is it native `zh-Hant`, not a simplified string converted by script?
2. Are Taiwan/HK convention choices deliberate and documented?
3. Are Swedish institutions preserved without PRC/Taiwan/HK analogy?
4. Is the tone formal for rights/law and warm for practice feedback?
5. Are `權利`, `義務`, `責任`, `公民身分`, and `國籍` used consistently?
6. Does the copy avoid promising exam success, citizenship, or passport
   outcomes?
7. Would a Traditional Chinese reader understand it without seeing the Swedish
   or English original?
