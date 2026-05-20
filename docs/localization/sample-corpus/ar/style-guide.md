# Arabic Civic Localization Style Guide

Locale: Modern Standard Arabic (MSA) for Arabic-speaking learners in Sweden.

## Purpose

Use this guide before translating Arabic UI, explanations, answer feedback, or
question copy. The goal is not literal Swedish/English word order. The goal is
plain civic-information Arabic that sounds like a public-service learning app
for newcomers in Sweden.

## Source-backed voice

Arabic Informationsverige pages use a formal but learner-facing MSA register:

- topic openings: `يتناول هذا النص ...`
- learner previews: `سوف تقرأ عن ...` and `يمكنك أن تقرأ عن ...`
- reflection prompts: `أسئلة للتفكير`
- rights language: `لكل فرد الحق في ...`, `لديك الحق في ...`
- legal/institution language with Swedish anchors in parentheses when useful
- explanatory connectors: `وهذا يعني أن ...`, `فعلى سبيل المثال ...`, `ومع ذلك ...`

App copy should borrow these patterns, but stay shorter than the source pages.
Use clear verbs, active teaching, and respectful direct address.

## Tone rules

1. Use MSA, not regional dialect, for all civic/legal/exam copy.
2. Prefer direct explanation over ornate rhetoric.
3. Keep religious, gender, family, and minority-rights language neutral and
   rights-based.
4. Do not over-soften legal duties. Arabic can be warm while still precise.
5. Keep Swedish institution names visible when the learner must recognize them.
6. Do not promise citizenship, official exam success, or government approval.

## Mechanical translation repairs

| Mechanical | Better Arabic | Why |
|---|---|---|
| `اصنع قرارًا` | `اتخذ قرارًا` | Arabic collocation for making a decision. |
| `السؤال حول عن...` | `يتناول السؤال ...` / `يسأل السؤال عن ...` | Natural question framing. |
| `اضغط استمرار` | `اضغط على متابعة` | UI verb needs `على`; `متابعة` is smoother. |
| `هذا صحيح جدا` | `إجابة صحيحة` / `صحيح` | Avoid exaggerated English-style feedback. |
| `لقد فشلت` | `لم تكن الإجابة صحيحة هذه المرة` | Encouraging, non-shaming learner tone. |
| `القانون يقول أن` | `ينص القانون على أن` | Standard legal register. |
| `الشعب لديه قوة` | `الشعب يملك السلطة` | Civic register for democratic power. |
| `بلدية يفعل` | `تتولى البلدية ...` / `تقدم البلدية ...` | Institution-as-agent pattern. |
| `حسب السويد` | `في السويد` / `وفقًا للقانون السويدي` | Avoid literal calque. |
| `مرر الاختبار` | `اجتز الاختبار` | Correct exam collocation. |

## Civic terminology

Use these forms consistently unless a native reviewer changes the project term.

| Concept | Arabic target | Notes |
|---|---|---|
| Sweden | `السويد` | Use with `في السويد`, not `داخل السويد` unless physical inside is meant. |
| Swedish society orientation | `التوجيه المجتمعي` | Matches newcomer-information register. |
| democracy | `الديمقراطية` | Use `الديمقراطية التمثيلية` for representative democracy. |
| Riksdag | `البرلمان السويدي (الريكسداغ)` | First mention can teach Swedish term; later `البرلمان السويدي`. |
| government | `الحكومة` | Do not confuse with `الدولة` or `السلطات`. |
| municipality | `البلدية` | Civic service level; plural `البلديات`. |
| region | `الإقليم` | For Swedish regional government context. |
| authority/agency | `سلطة` / `سلطة حكومية` | Use `السلطات` for authorities broadly. |
| rights | `حقوق` | Pair with `واجبات` when the source does. |
| duties/obligations | `واجبات` / `التزامات` | `التزامات` for legal/policy obligations. |
| equality | `المساواة` | General equality. |
| gender equality | `المساواة بين الجنسين` | Use for jämställdhet. |
| discrimination | `التمييز` | Use source pattern `معاملة ... بشكل أسوأ`. |
| freedom of expression | `حرية التعبير` | Can pair with `حرية الرأي`. |
| source criticism | `نقد المصادر` | For checking whether information is reliable. |
| citizenship | `المواطنة` / `الجنسية السويدية` | Use `الجنسية السويدية` for legal citizenship application context. |

## UI and learning patterns

| English intent | Arabic pattern |
|---|---|
| Start practice | `ابدأ التدريب` |
| Continue | `متابعة` / `تابع التدريب` |
| Try again | `حاول مرة أخرى` |
| Correct | `إجابة صحيحة` |
| Incorrect but safe | `لم تكن الإجابة صحيحة هذه المرة.` |
| Short explanation intro | `الشرح:` |
| Learn more | `اقرأ المزيد` |
| Source label | `المصدر` / `المصادر` |
| Review mistakes | `راجع الأخطاء` |
| Practice question | `سؤال تدريبي` |
| Mock exam | `اختبار تجريبي` |
| Your progress | `تقدمك` |
| Streak | `أيام متتالية من التدريب` |

## Question and explanation style

- Begin explanations with the rule, then give the example.
- Use one civic concept per sentence where possible.
- For legal nuance, say what applies in Sweden rather than making a universal
  claim.
- Avoid passive-heavy strings when a UI instruction should be actionable.
- Use Arabic punctuation and right-to-left friendly phrasing.

Example pattern:

```text
صحيح. في السويد، يختار الناخبون الأحزاب والسياسيين في انتخابات حرة ونزيهة.
هذا جزء من الديمقراطية التمثيلية.
```

## Humor and encouragement

Arabic civic copy should be calm and lightly encouraging, not jokey in a way
that weakens the legal topic.

Use:

- `خطوة جيدة. لنراجع الفكرة الأساسية.`
- `لا بأس، هذا مفهوم يحتاج إلى تدريب.`
- `اقتربت من الإجابة. انتبه إلى الفرق بين الحق والواجب.`

Avoid:

- dialect jokes
- sarcasm about government, exams, or migrants
- jokes about religion, gender, family roles, ethnicity, or legal status
- playful language that could sound like the app is an official shortcut

## Word-by-word audit checklist

Before accepting Arabic text, ask:

1. Does it use MSA rather than dialect or literal English word order?
2. Are Swedish institutions named precisely and not replaced by another
   country's institutions?
3. Are rights and duties expressed with `حقوق`, `واجبات`, or `التزامات`
   consistently?
4. Is learner feedback encouraging without promising official outcomes?
5. Does any legal claim need `في السويد` or `وفقًا للقانون السويدي`?
6. Does the sentence sound like plain public information, not marketing copy?
