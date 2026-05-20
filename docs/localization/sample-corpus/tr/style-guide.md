# Turkish Civic Localization Style Guide

Purpose: make Turkish copy sound like clear public-information Turkish for adult learners, not like English or Swedish sentence structure converted word by word.

Status: guidance only. The app does not yet have complete Turkish UI or question translations, and `tr` must stay disabled until a native review and coverage audit pass.

## Source-backed voice

Use the formal public-service register seen in Swedish official Turkish pages:

- Address the reader respectfully with `siz` when direct address is needed.
- Prefer clear process verbs: `başvuru yapmak`, `kontrol etmek`, `öğrenmek`, `devam etmek`.
- Explain requirements with `gerekmektedir`, `gerekebilir`, or plainer `gerekir` depending on space.
- Use neutral passive/impersonal forms for authority decisions: `değerlendirilir`, `karar verilir`, `bildirilir`.
- Keep paragraphs short; Turkish can carry long embedded clauses, but learner UI should not.

Sweden Abroad Turkish pages are good register anchors for Swedish-authority Turkish, especially migration/application language. For democracy, rights, and citizenship facts, use Swedish/English official fact sources and translate carefully into Turkish.

## Register rules

Prefer:

- `İsveç'te ...` for Swedish system facts.
- `... hakkınız vardır` or `... hakkına sahipsiniz` for rights.
- `... yapmanız gerekir` for app actions or legal requirements.
- `Örneğin` for examples.
- `Bu soru ... hakkındadır` for question introductions.
- `Açıklamayı okuyup tekrar deneyin` for supportive correction.

Avoid:

- Literal English word order: `bir karar yapmak`, `soru hakkında demokrasi`.
- Overly casual `sen`, `hadi`, or slang in core learning copy.
- Machine-like noun piles copied from Swedish compounds.
- Turkey-specific institution substitutions for Swedish bodies.
- Unsupported official claims such as `resmî sınav sorusu` or `devlet onaylı`.

## Mechanical translation repairs

| Mechanical / risky Turkish | Use instead | Why |
|---|---|---|
| `karar yapmak` | `karar vermek` / `karar alınır` | Natural Turkish collocation. |
| `vatandaşlık için uygulamak` | `İsveç vatandaşlığına başvurmak` | `apply for` is `başvurmak`, not `uygulamak`. |
| `bu soru demokrasi hakkında` | `Bu soru demokrasi hakkındadır.` | Complete public-information sentence. |
| `sonraki soruya bas` | `Sonraki soruya geçin.` | More natural and respectful UI instruction. |
| `yanlış cevap!` | `Tam doğru değil. Açıklamayı okuyup tekrar deneyin.` | Supportive learner tone. |
| `İsveç'in temel yasaları` | `İsveç'in temel kanunları` / `anayasal düzeni` | Choose based on context; avoid literal inconsistency. |
| `hükümet ajansları` | `kamu kurumları` / `devlet kurumları` | Natural Turkish for public agencies. |
| `oy hakkı taşır` | `oy kullanma hakkı vardır` | Natural rights phrase. |

## Civic terminology

| Concept | Preferred Turkish | Notes |
|---|---|---|
| Sweden | `İsveç` | Preserve dotted capital İ. |
| Swedish citizenship | `İsveç vatandaşlığı` | Use `başvurmak` for applications. |
| Swedish Migration Agency | `İsveç Göçmen Dairesi` | Sweden Abroad Turkish uses this form; first mention can include `Migrationsverket`. |
| residence permit | `oturum izni` | Use `ikamet izni` only if matching a source/context. |
| democracy | `demokrasi` | Explain with elections, participation, rights, and limits on power. |
| rule of law | `hukukun üstünlüğü` / `hukuk devleti` | Choose with native/legal review; avoid mixing randomly. |
| Riksdag | `İsveç Parlamentosu (Riksdag)` | Keep Swedish term when teaching the institution. |
| government agency | `kamu kurumu` / `devlet kurumu` | `Kurum` is often more natural than `ajans`. |
| right to vote | `oy kullanma hakkı` | Use for rösträtt. |
| freedom of expression | `ifade özgürlüğü` | Standard civic term. |
| freedom of the press | `basın özgürlüğü` | Keep distinct when the lesson distinguishes it. |
| discrimination | `ayrımcılık` | Pair with protected-ground explanation from source. |
| rights | `haklar` | `hakkınız vardır` in direct learner copy. |
| obligations/duties | `yükümlülükler` / `sorumluluklar` | `Yükümlülük` for legal duties; `sorumluluk` for everyday responsibility. |
| gender equality | `toplumsal cinsiyet eşitliği` / `kadın erkek eşitliği` | Pick by context and native review. |
| source criticism | `kaynak eleştirisi` / `kaynak değerlendirmesi` | Use the learner-friendlier phrase in UI. |

## UI copy patterns

| Context | Preferred Turkish |
|---|---|
| Start practice | `Alıştırmaya başlayın` |
| Continue practice | `Alıştırmaya devam edin` |
| Retry | `Tekrar deneyin` |
| Correct answer | `Doğru.` |
| Incorrect answer | `Tam doğru değil.` |
| Explanation lead-in | `Açıklama` |
| Source label | `Kaynak materyal` |
| Progress | `Soru {current}/{total}` |
| Result summary | `{total} sorudan {correct} tanesini doğru yanıtladınız.` |
| Review CTA | `Açıklamayı okuyun` |
| Disclaimer | `Bu uygulama alıştırma amaçlıdır; resmî bir sınav değildir.` |

Keep buttons short. Use sentence case rather than shouting in all caps.

## Question-writing patterns

Good:

> İsveç'te ifade özgürlüğü ne anlama gelir?

Good explanation lead:

> İsveç'te herkes kendi görüşünü oluşturma ve ifade etme hakkına sahiptir. Bu hak, başkalarına karşı nefret veya tehdit yayma hakkı vermez.

Avoid:

> İsveç'te ifade özgürlüğü şeyi nedir?

Options should be grammatically parallel. Do not mix full sentences with noun fragments unless the design intentionally supports it.

## Humor and culture guidance

Turkish learner feedback can be warm, but civic/legal content should remain respectful and clear. Do not translate English idioms or Swedish jokes literally.

Safe warmth:

- `Sorun değil, açıklama yardımcı olacaktır.`
- `Kısa bir tekrar, bir sonraki soruyu kolaylaştırabilir.`

Avoid:

- Sarcasm after wrong answers.
- Jokes about bureaucracy, migration, accents, religion, or nationality.
- Informal internet slang in core learning paths.

Mascot or celebration copy may be more playful, but must still pass native review.

## Word-by-word Turkish audit gate

Before Turkish strings or questions ship:

1. Confirm every Turkish sentence has natural Turkish word order, not English/SV order.
2. Check Turkish characters: `İ/ı`, `ş`, `ğ`, `ç`, `ö`, `ü`.
3. Check formal address: no accidental `sen` in learner instructions.
4. Check every civic term against this glossary and a source URL.
5. Confirm Swedish institutions remain Swedish institutions, not Turkey-specific substitutions.
6. Re-check time-sensitive citizenship facts on the same day as release.
7. Ask a native Turkish reviewer to read UI, questions, answer options, and humor/warmth lines aloud.
8. Keep `tr` disabled until the coverage audit proves complete UI, content, glossary, RTL/LTR, accessibility labels, and tests are ready.

