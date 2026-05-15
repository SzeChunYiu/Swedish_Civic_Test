# Content Strategy — Sweden Citizenship Test Prep

Source: `swedish_citizenship_app_project_plan/04_content_strategy.md`
         `swedish_citizenship_app_project_plan/11_sample_question_templates.md`

## Primary source

UHR, *Sverige i fokus: Utbildningsmaterial till medborgarskapsprov*
- UHR page: https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/
- PDF: https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf

All questions must trace to a specific chapter and section of this PDF.

## Question types

| Type | ID | Notes |
|---|---|---|
| Single-choice (4 options) | `single_choice` | One correct answer |
| True/False | `true_false` | Simple factual |
| Flashcard | `flashcard` | Term → definition |

## Question fields (TypeScript type)

```ts
interface PracticeQuestion {
  id: string;               // "q001"
  chapterId: string;        // "ch01"
  type: "single_choice" | "true_false" | "flashcard";
  questionSv: string;       // Swedish question text
  questionEn: string;       // English translation
  options: {
    id: string;             // "a" | "b" | "c" | "d"
    textSv: string;
    textEn: string;
  }[];
  correctOptionId: string;
  explanationSv: string;    // Why this is correct (Swedish)
  explanationEn: string;    // Why this is correct (English)
  uhrReference: {
    chapter: string;        // "Landet Sverige"
    section: string;        // "Geografi och natur"
    pageApprox: number;     // Approximate page in PDF
  };
  difficulty: "easy" | "medium" | "hard";
  reviewStatus: "draft" | "reviewed" | "published";
  tags: string[];
}
```

## 13 chapters (from UHR)

1. Landet Sverige
2. Sveriges demokratiska system
3. Så här styrs Sverige
4. Politiska val och partier
5. Lag och rätt
6. Mänskliga rättigheter
7. Arbetslivet
8. Sociala förmåner och trygghet
9. Utbildningssystemet
10. Vård och omsorg
11. Boendet i Sverige
12. Kulturen och fritiden
13. Sverige i världen

## MVP content targets

| Stage | Questions | Quality bar |
|---|---:|---|
| Beta | 100 reviewed | Chapters 1, 2, 5, 6, 11, 13 |
| Launch | 500 reviewed | All 13 chapters |

## Quality checklist per question

- [ ] Source traced to specific UHR chapter/section
- [ ] Swedish wording accurate and grammatically correct
- [ ] English translation faithful (not literal, but clear)
- [ ] Correct answer unambiguous
- [ ] Wrong options plausible but clearly wrong with explanation
- [ ] Explanation does not claim official authority
- [ ] No overclaiming ("will appear on exam", "guaranteed correct")
- [ ] reviewStatus = "reviewed" before publishing

## Disclaimer (required on every question screen)

> This app is an independent study tool for the Swedish citizenship civic test.
> It is not official and is not affiliated with UHR, Skolverket, Migrationsverket,
> or the Swedish government. Practice questions are created for learning purposes
> and are not real exam questions.
