# Central Kurdish / Sorani Civic Localization Style Guide

Locale: Central Kurdish / Sorani (`ckb`) in Arabic-based Kurdish script.

## Purpose

Use this guide before translating Sorani UI, quiz questions, answer feedback, or
civic explanations. The goal is clear Sorani public-service language, not a
word-for-word rendering of Swedish or English.

## Source limitations

We have not yet found a full official Swedish civic-orientation corpus in
Sorani. For now:

- use Sorani public-service samples for tone and learner-friendly wording;
- use Swedish/English official sources for Swedish civic facts;
- mark Swedish facts as fact-anchored from Swedish/English until a Sorani
  official source is found;
- require native review before shipping any broad Sorani UI.

## Source-backed voice

Available Sorani public-service material shows a direct explanatory register:

- direct address with `تۆ` for learner/user-facing copy;
- condition/action patterns such as `ئەگەر ... دەتوانیت ...`;
- examples introduced with `بۆ نموونە`;
- service and support wording around `یارمەتی`, `پشتیوانی`, `خزمەتگوزاری`,
  `پەیوەندی`, `ڕێکخستن`, `پلانی تاکەکەسی`;
- learner/education register around `خوێندکار`, `فێربوون`, `رێنمایی`,
  `زانیاری`, `کۆرس`;
- Swedish terms can be kept in Latin script after a Sorani explanation when the
  learner must recognize the Swedish word.

## Tone rules

1. Use Sorani/Central Kurdish only; do not mix in Kurmanji vocabulary.
2. Use Arabic-based Kurdish script and right-to-left punctuation/layout.
3. Keep legal and civic statements precise, with Swedish terms retained when
   needed.
4. Prefer short explanatory sentences over long translated clauses.
5. Make feedback warm and non-shaming.
6. Do not joke about migration status, citizenship, religion, gender, family, or
   exams.
7. Never imply the app is an official exam authority or guarantees citizenship.

## Mechanical translation repairs

| Mechanical | Better Sorani pattern | Why |
|---|---|---|
| `دروستکردنی بڕیار` | `بڕیار بدە` / `بڕیار دەدرێت` | Use natural decision verbs. |
| `ئەم پرسیارە دەربارەیە لە...` | `ئەم پرسیارە دەربارەی ... ـە` | Avoid English/SV structure. |
| `دەست پێ بکە بە دانیشتنی مەشق` | `دەست بە مەشق بکە` | Shorter UI phrase. |
| `تۆ ڕاستیت` | `وەڵامەکەت ڕاستە` | Natural answer feedback. |
| `تۆ هەڵەیت` | `ئەم جارە وەڵامەکە ڕاست نەبوو` | Non-shaming feedback. |
| `سەرچاوە ماددە` | `سەرچاوە` / `زانیاریی سەرچاوە` | Natural source wording. |
| `حکومەتی هەرێم` for Swedish region | `هەرێمی سوید` / explain `region` | Avoid Iraqi Kurdistan analogy. |
| `پارلەمانی کوردستان` for Riksdag | `پارلەمانی سوید (Riksdag)` | Keep Swedish institution precise. |
| `شارەوانی` for all local bodies | `شارەوانی/kommun` with explanation | Use only when context matches municipality. |
| `پاسپۆرت دەست دەکەوێت` | Never imply this | Practice does not guarantee citizenship/passport. |

## Civic terminology

These are project starting points. Native review should confirm spelling and
preferred Sorani forms before app release.

| Concept | Sorani target | Notes |
|---|---|---|
| Sweden | `سوید` | Use consistently. |
| Swedish society | `کۆمەڵگای سوید` | For civic-learning context. |
| democracy | `دیموکراسی` | Use with explanation when needed. |
| representative democracy | `دیموکراسیی نوێنەرایەتی` | Explain in simple sentence. |
| rule of law | `سەروەریی یاسا` / `دەوڵەتی یاسا` | Needs native/legal review. |
| Riksdag | `پارلەمانی سوید (Riksdag)` | First mention includes Swedish term. |
| government | `حکومەت` | Avoid confusing with state/country. |
| authority/agency | `دامودەزگا` / `دەسەڵاتدار` | Use exact agency names where known. |
| municipality/kommun | `شارەوانی (kommun)` | Explain Swedish local-government role. |
| region | `هەرێم (region)` | Clarify Swedish context. |
| citizen | `هاووڵاتی` | For participation/rights. |
| citizenship | `هاووڵاتیبوونی سویدی` | Use for Swedish citizenship context. |
| rights | `مافەکان` | Pair with duties where relevant. |
| duties/obligations | `ئەرکەکان` / `بەرپرسیارێتی` | Keep consistent by context. |
| discrimination | `جیاکاری` | Use with plain explanation. |
| gender equality | `یەکسانیی ڕەگەزی` | Sensitive; native review needed. |
| freedom of expression | `ئازادیی دەربڕین` | Civic/legal term. |
| source criticism | `هەڵسەنگاندنی سەرچاوە` | For reliability checking. |
| mock exam | `تاقیکردنەوەی ئەزموونی` | Avoid official-test implication. |

## UI and learning patterns

| English intent | Sorani pattern |
|---|---|
| Start practice | `دەست بە مەشق بکە` |
| Continue practice | `درێژە بە مەشق بدە` |
| Try again | `جارێکی تر هەوڵ بدە` |
| Correct | `وەڵامەکەت ڕاستە` |
| Incorrect | `ئەم جارە وەڵامەکە ڕاست نەبوو.` |
| Explanation | `ڕوونکردنەوە:` |
| Learn more | `زیاتر بخوێنەوە` |
| Source | `سەرچاوە` / `سەرچاوەکان` |
| Review mistakes | `هەڵەکانت پێداچوونەوە بکە` |
| Practice question | `پرسیاری مەشق` |
| Mock exam | `تاقیکردنەوەی ئەزموونی` |
| Your progress | `پێشکەوتنت` |
| Daily goal | `ئامانجی ڕۆژانە` |

## Question and explanation style

- Put the tested idea first: `ئەم پرسیارە ... تاقی دەکاتەوە` if natural after
  native review; otherwise use `ئەم پرسیارە دەربارەی ... ـە`.
- Use `لە سوید` for Sweden-specific rules.
- Explain Swedish terms once, then reuse the short form.
- Keep each feedback explanation to one or two short sentences.
- For uncertain legal/civic terms, prefer a clear phrase plus Swedish/English in
  parentheses until native legal review confirms the term.

Example draft requiring native review:

```text
وەڵامەکەت ڕاستە. لە سوید، دەنگدەران لە هەڵبژاردنی ئازاددا پارت و سیاسەتمەداران هەڵدەبژێرن.
ئەمە بەشێکە لە دیموکراسیی نوێنەرایەتی.
```

## Humor and encouragement

Keep encouragement simple and respectful. A small warm line is better than a
joke that may not translate across Kurdish dialects or migration backgrounds.

Use draft patterns for native review:

- `کێشە نییە؛ ئەم بابەتە پێویستی بە مەشق هەیە.`
- `نزیک بوویت. جیاوازیی نێوان ماف و ئەرک بیر بکەوە.`
- `هەنگاوێکی باشە. با بیرۆکەی سەرەکی دووبارە بکەینەوە.`

Avoid:

- dialect jokes or Kurmanji/Sorani mixing;
- jokes about asylum, passports, citizenship, religion, gender, or family;
- sarcasm after wrong answers;
- promises that practice guarantees an official result.

## Word-by-word audit checklist

Before accepting Sorani text, ask:

1. Is it Sorani/Central Kurdish, not Kurmanji or mixed Kurdish?
2. Is the script and punctuation right-to-left friendly?
3. Does the sentence sound like Sorani, not English/Swedish word order?
4. Are Swedish institutions preserved and explained, not replaced by local
   Kurdish/Iraqi/Iranian institutions?
5. Are `ماف`, `ئەرک`, `بەرپرسیارێتی`, `هاووڵاتیبوون`, and `شارەوانی` used
   consistently?
6. Is learner feedback respectful and non-shaming?
7. Does the copy avoid promising official exam or citizenship outcomes?
8. Has a native Sorani reviewer checked any legal/civic term before release?
