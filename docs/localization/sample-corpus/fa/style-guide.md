# Persian Civic Localization Style Guide

Locale: Persian/Farsi (`fa`) for Sweden civic-test learners. Keep this distinct
from Dari (`prs`) unless a product owner explicitly decides to merge audiences.

## Purpose

Use this guide before translating Persian UI, quiz questions, answer feedback,
or civic explanations. The goal is natural public-information Persian, not a
word-by-word copy of Swedish or English. A learner should feel that the text is
clear, respectful, and written for someone learning how Swedish society works.

## Audience and variant boundary

For `fa`, prefer neutral Persian/Farsi with Swedish civic terms explained. Do
not silently mix in Dari-only forms. In particular:

- use `سوئد`, not `سویدن`;
- use `مدرسه` in app copy unless quoting or documenting a Dari source;
- use `کودک`/`کودکان`, not `اطفال`, for this locale;
- use `اطلاعات`, not `معلومات`, for this locale;
- record any intentional Afghanistan/Dari wording in a separate `prs`/Dari note.

## Source-backed voice

Persian Informationsverige pages use a plain civic-orientation register:

- theme openings: `موضوع این بخش ... است` and `این متن در مورد ... است`
- learner previews: `شما در مورد ... مطالبی خواهید خواند`
- rights phrasing: `حق دارید ...`, `همه حق دارند ...`
- reflection prompts: `سوالات برای بازتاب فکری`
- explanatory connectors: `یعنی ...`, `بطور مثال ...`, `با این وجود ...`
- Swedish institutions translated but often kept as Swedish civic concepts:
  `پارلمان`, `کمون`, `ناحیه`, `ادارات دولتی`

App copy should be shorter and more polished than long source pages, but it
should keep this direct explanatory style.

## Tone rules

1. Use clear Persian, not literary or bureaucratic-heavy prose.
2. Be precise about rights, duties, and Swedish institutions.
3. Keep sensitive topics rights-based and neutral: gender equality, religion,
   family, disability, minorities, and discrimination.
4. Do not replace Swedish institutions with Iranian, Afghan, or other
   country-specific institutions.
5. Use encouragement without shame; mistakes are part of learning.
6. Never imply the app is an official exam authority or shortcut to citizenship.

## Mechanical translation repairs

| Mechanical | Better Persian | Why |
|---|---|---|
| `یک تصمیم بسازید` | `تصمیم بگیرید` | Natural collocation. |
| `سوال درباره است` | `این سوال درباره ... است` / `در این سوال از شما پرسیده می‌شود ...` | Natural question framing. |
| `روی ادامه فشار دهید` | `ادامه دهید` / `روی «ادامه» بزنید` | UI Persian is shorter. |
| `این خیلی درست است` | `درست است` / `پاسخ درست است` | Avoid English-style praise. |
| `شما شکست خوردید` | `این بار پاسخ درست نبود` | Non-shaming feedback. |
| `قانون می‌گوید که` | `طبق قانون ...` / `قانون مقرر می‌کند که ...` | Legal/civic register. |
| `مردم قدرت دارند` | `قدرت از مردم سرچشمه می‌گیرد` | Civic-democracy phrasing. |
| `دولت انجام می‌دهد` | `دولت مسئول ... است` / `اداره دولتی ... را بررسی می‌کند` | More exact institution action. |
| `حقوق و مسئولیت‌ها` | `حق و حقوق و وظایف` / `حقوق و وظایف` | Matches source register; choose one and keep it consistent. |
| `پاس کردن آزمون` | `قبول شدن در آزمون` / `آزمون را با موفقیت گذراندن` | Natural Persian exam phrasing. |

## Civic terminology

| Concept | Persian target | Notes |
|---|---|---|
| Sweden | `سوئد` | Use `در سوئد`. |
| About Sweden/civic orientation | `درباره سوئد` / `آشنایی با جامعه سوئد` | Use for orientation-style material. |
| democracy | `دموکراسی` | Use `دموکراسی پارلمانی` if the source says representative/parliamentary democracy. |
| rule of law | `حاکمیت قانون` | For state governed by law. |
| Riksdag | `پارلمان سوئد (ریسکداگ)` | First mention can teach Swedish term; later `پارلمان سوئد`. |
| government | `دولت` / `حکومت` | Use `دولت` for national government; avoid conflating with `کشور`. |
| authority/agency | `اداره دولتی` / `مرجع دولتی` | Use exact agency names where known. |
| municipality | `کمون` / `شهرداری` | Existing source uses `کمون`; app may explain as `کمون/شهرداری`. |
| region | `ناحیه` | Use in Swedish governance context. |
| citizen | `شهروند` | For civic participation and citizenship. |
| citizenship | `شهروندی سوئد` / `تابعیت سوئد` | Use `شهروندی سوئد` in plain app copy. |
| rights | `حق و حقوق` / `حقوق` | Keep consistent in a screen. |
| duties/obligations | `وظایف` / `تعهدات` | `تعهدات` for formal legal obligations. |
| discrimination | `تبعیض` | Define as worse treatment when needed. |
| gender equality | `برابری جنسیتی` | For jämställdhet. |
| equality | `برابری` / `تساوی` | Use carefully; source distinguishes them. |
| freedom of expression | `آزادی بیان` | Can pair with `آزادی عقیده`. |
| freedom of religion | `آزادی دین و مذهب` | Matches source heading. |
| source criticism | `نقد و بررسی منبع` | For checking reliability of information. |

## UI and learning patterns

| English intent | Persian pattern |
|---|---|
| Start practice | `شروع تمرین` |
| Continue practice | `ادامه تمرین` |
| Try again | `دوباره تلاش کنید` |
| Correct | `درست است` / `پاسخ درست است` |
| Incorrect | `این بار پاسخ درست نبود.` |
| Explanation | `توضیح:` |
| Learn more | `بیشتر بخوانید` |
| Source | `منبع` / `منابع` |
| Review mistakes | `مرور اشتباهات` |
| Practice question | `سوال تمرینی` |
| Mock exam | `آزمون آزمایشی` |
| Your progress | `پیشرفت شما` |
| Daily goal | `هدف روزانه` |

## Question and explanation style

- Put the civic concept before the detail.
- Prefer short sentences in answer feedback.
- Use `در سوئد` when a rule is country-specific.
- Explain Swedish terms on first mention instead of replacing them.
- Avoid mixing colloquial Iranian speech with official civic content.

Example:

```text
درست است. در سوئد، مردم در انتخابات به احزاب و سیاستمداران رأی می‌دهند.
این یکی از پایه‌های دموکراسی پارلمانی است.
```

## Humor and encouragement

Persian civic copy can be warm, but jokes should be subtle and never target
identity, migration status, religion, gender, family, or legal knowledge.

Use:

- `اشکالی ندارد؛ این مفهوم کمی تمرین می‌خواهد.`
- `نزدیک بود. به تفاوت بین حق و وظیفه توجه کنید.`
- `یک قدم دیگر جلو رفتید؛ حالا نکته اصلی را مرور کنیم.`

Avoid:

- sarcasm about government offices or waiting times
- jokes about citizenship, passports, or exams
- English idioms translated literally
- dialect slang that excludes part of the audience

## Word-by-word audit checklist

Before accepting Persian text, ask:

1. Is this `fa` Persian, not accidental Dari or a mixed variant?
2. Does the sentence sound like natural Persian, not English/Swedish word order?
3. Are Swedish institutions preserved and explained accurately?
4. Are `حق و حقوق`, `وظایف`, `تعهدات`, and `مسئولیت` used consistently?
5. Is learner feedback respectful and non-shaming?
6. Does any legal/civic claim need `در سوئد` or `طبق قانون سوئد`?
7. Does the text avoid promising official exam or citizenship outcomes?
