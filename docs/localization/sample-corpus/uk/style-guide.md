# Ukrainian Civic Localization Style Guide

Locale: Ukrainian for Ukrainian-speaking learners in Sweden.

## Purpose

Use this guide before translating Ukrainian UI, quiz questions, answer feedback,
or civic explanations. The goal is natural Ukrainian public-service language,
not a mechanical rendering of Swedish or English.

## Source-backed voice

Ukrainian Informationsverige pages use a formal, direct, learner-friendly
register:

- orientation framing: `Про Швецію — матеріал для соціальної орієнтації`
- topic openings: `Ця тема присвячена ...`, `Цей текст присвячений ...`
- learner previews: `Ви прочитаєте ...`, `Ви дізнаєтеся ...`
- reflection prompts: `Питання для роздумів`
- rights/duties language: `права та обов'язки`, `кожен має право ...`
- explanatory phrasing: `Це означає, що ...`, `Наприклад ...`, `Однак ...`
- institutional precision: `парламент`, `муніципалітет`, `регіон`,
  `державна служба`, `Управління омбудсмена ...`

App copy should be shorter than source pages, but keep this clear public-service
voice.

## Tone rules

1. Use standard Ukrainian; avoid Russian calques and mixed Russian-Ukrainian.
2. Prefer plain official prose over marketing language.
3. Be exact about rights, obligations, eligibility, and institutions.
4. Keep sensitive topics neutral and rights-based: discrimination, gender,
   family, religion, disability, minority rights, and violence.
5. Encourage learners without shaming them.
6. Never imply the app is an official exam authority or a shortcut to
   citizenship.

## Mechanical translation repairs

| Mechanical or calque-like | Better Ukrainian | Why |
|---|---|---|
| `приймати участь` | `брати участь` | Standard Ukrainian collocation. |
| `являється` | `є` | Avoid Russian calque in definitions. |
| `на протязі` | `протягом` | Correct for time periods. |
| `слідуюче питання` | `наступне питання` | Avoid calque. |
| `зробити рішення` | `ухвалити рішення` / `прийняти рішення` | Natural decision phrasing. |
| `питання є про...` | `це питання стосується ...` / `у цьому питанні йдеться про ...` | Natural question framing. |
| `натисніть продовжити` | `натисніть «Продовжити»` / `продовжити` | Better UI pattern. |
| `ви провалили` | `цього разу відповідь неправильна` | Non-shaming feedback. |
| `закон каже` | `закон передбачає` / `відповідно до закону` | Legal register. |
| `джерело матеріал` | `джерельний матеріал` / `джерело` | Correct source wording. |

## Civic terminology

| Concept | Ukrainian target | Notes |
|---|---|---|
| Sweden | `Швеція` | Use `у Швеції`. |
| civic orientation | `соціальна орієнтація` | Matches Informationsverige framing. |
| democracy | `демократія` | Use `представницька демократія` when relevant. |
| rule of law | `верховенство права` / `правова держава` | Choose according to sentence; keep precise. |
| Riksdag | `Парламент Швеції (Риксдаг)` | First mention can teach Swedish term. |
| parliament | `парламент` | Capitalize only in proper-name contexts. |
| government | `уряд` | Do not confuse with `держава`. |
| authority/agency | `державна служба` / `державний орган` | Use exact agency names where available. |
| municipality | `муніципалітет` | Source also uses municipal council language. |
| region | `регіон` | Swedish regional government level. |
| citizen | `громадянин` / `громадянка` | Use inclusive plural when possible. |
| citizenship | `громадянство Швеції` / `шведське громадянство` | Prefer legal clarity. |
| rights | `права` | Pair with `обов'язки` where source does. |
| duties/obligations | `обов'язки` / `зобов'язання` | `зобов'язання` is more formal/legal. |
| discrimination | `дискримінація` | Define as less favorable treatment when needed. |
| gender equality | `гендерна рівність` | Use for jämställdhet. |
| freedom of expression | `свобода вираження поглядів` / `свобода слова` | Choose by source context. |
| source criticism | `критичне ставлення до джерел інформації` | For checking reliability. |
| hate crime | `злочин на ґрунті ненависті` | Sensitive legal/civic term. |

## UI and learning patterns

| English intent | Ukrainian pattern |
|---|---|
| Start practice | `Почати тренування` |
| Continue practice | `Продовжити тренування` |
| Try again | `Спробувати ще раз` |
| Correct | `Правильно` / `Відповідь правильна` |
| Incorrect | `Цього разу відповідь неправильна.` |
| Explanation | `Пояснення:` |
| Learn more | `Дізнатися більше` |
| Source | `Джерело` / `Джерела` |
| Review mistakes | `Переглянути помилки` |
| Practice question | `Тренувальне питання` |
| Mock exam | `Пробний іспит` |
| Your progress | `Ваш прогрес` |
| Daily goal | `Щоденна ціль` |

## Question and explanation style

- Use `у Швеції` when a rule is Sweden-specific.
- Explain Swedish institutions on first mention; do not substitute Ukrainian
  institutions.
- Use one civic idea per sentence in feedback.
- Use Ukrainian quotation marks `«...»` for UI labels and cited terms.
- Prefer gender-neutral plurals where possible: `люди`, `особи`, `учасники`.

Example:

```text
Правильно. У Швеції виборці обирають партії та політиків на вільних виборах.
Це один із принципів представницької демократії.
```

## Humor and encouragement

Ukrainian civic copy should be warm but restrained. Do not joke about war,
migration status, bureaucracy, citizenship, passports, religion, gender, or
minority rights.

Use:

- `Нічого страшного — це поняття потребує трохи практики.`
- `Ви були близько. Зверніть увагу на різницю між правом і обов'язком.`
- `Добрий крок. Тепер коротко повторимо головну ідею.`

Avoid:

- sarcasm about authorities or waiting times
- English jokes translated literally
- Russian or mixed-language slang
- promises that practice guarantees citizenship or passing an official test

## Word-by-word audit checklist

Before accepting Ukrainian text, ask:

1. Is it standard Ukrainian, free of Russian calques and mixed-language wording?
2. Does it sound like public-service information, not advertising copy?
3. Are Swedish institutions preserved and explained correctly?
4. Are `права`, `обов'язки`, `зобов'язання`, and `відповідальність` used
   consistently?
5. Is learner feedback respectful and non-shaming?
6. Does any legal/civic statement need `у Швеції` or `відповідно до закону`?
7. Does the copy avoid promising official exam or citizenship outcomes?
