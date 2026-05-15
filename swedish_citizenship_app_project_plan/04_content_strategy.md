# 04 — Content Strategy

## Core principle

The app can research broadly, but **exam-prep questions must be anchored to UHR's material**.

Use wider official sources only for:

- explanation support,
- updated context,
- learning examples,
- links for deeper reading.

## Source hierarchy

### Tier 1 — Primary exam source

- UHR: `Sverige i fokus`
- UHR Medborgarskapsprovet pages

### Tier 2 — Official Swedish public sources

Use for background and explanation:

- Riksdagen
- Regeringen
- Valmyndigheten
- Domstolsverket / Sveriges Domstolar
- Polisen
- Skatteverket
- Försäkringskassan
- Arbetsförmedlingen
- Socialstyrelsen
- Informationsverige
- DO
- Barnombudsmannen
- SCB
- Naturvårdsverket
- EU official sources
- NATO official sources, where relevant

### Tier 3 — Educational support

Use carefully and only for explanation support:

- museums,
- educational sites,
- public broadcasters,
- encyclopedias.

Do not use Tier 3 as the main basis for exam questions.

## Content labels

Every question should have an `exam_scope` value.

| Value | Meaning |
|---|---|
| `uhr_based` | Directly based on UHR material |
| `official_context` | Extra official-source context |
| `vocabulary_support` | Language aid for understanding Swedish words |
| `background_learning` | Useful but not core exam prep |

Only `uhr_based` questions should appear in mock exam mode by default.

## 500–800 question target

This is realistic if we create multiple question styles per concept.

Recommended distribution:

| Chapter | Target questions |
|---|---:|
| Landet Sverige | 60–80 |
| Sveriges demokratiska system | 60–80 |
| Så här styrs Sverige | 50–70 |
| Politiska val och partier | 50–70 |
| Lag och rätt | 70–90 |
| Mediernas roll | 35–50 |
| Mänskliga rättigheter | 70–90 |
| Arbetsmarknad och privatekonomi | 60–80 |
| Välfärdssamhället | 60–80 |
| Sveriges moderna historia | 70–100 |
| Sverige och omvärlden | 50–70 |
| En sekulär stat och ett mångreligiöst land | 40–60 |
| Traditioner och högtider | 40–60 |

Total target: 675–940 candidate questions.

After review, publish 500–800.

## Question generation method

For each UHR concept:

1. Extract the key fact or concept.
2. Create a Swedish question.
3. Create an English translation.
4. Create 3–4 answer options.
5. Write a simple explanation.
6. Add "why wrong" notes.
7. Add a short UHR quote or paraphrase.
8. Add chapter, section, and page reference.
9. Review for accuracy.
10. Mark as published only after review.

## Question types

### MVP types

1. Single choice
2. True/false

### Later types

3. Multiple choice
4. Match terms
5. Fill blank
6. Sort order
7. Scenario question
8. Speed round
9. Flashcard recall

## Example: turning one fact into many questions

Source concept:

> Sverige ligger i Norden i norra Europa.

Possible questions:

1. Var ligger Sverige?
2. Vilken region tillhör Sverige?
3. Sant eller falskt: Sverige ligger i Norden.
4. Vilket av följande länder ligger i Norden?
5. Vad betyder "Norden" i detta sammanhang?
6. Vilket alternativ beskriver Sveriges geografiska läge bäst?

## Review checklist

Before publishing a question, check:

- Swedish grammar is correct.
- English translation is accurate.
- Correct option is unambiguous.
- Wrong options are plausible but not misleading.
- Explanation does not overclaim.
- UHR reference is correct.
- Quote is short.
- App does not copy too much source text.
- Political content is neutral.
- Question does not imply it is a real exam question.

## Content workflow

Recommended status values:

1. `draft`
2. `needs_source`
3. `needs_translation`
4. `needs_review`
5. `approved`
6. `published`
7. `archived`

## Human review roles

At minimum:

- Swedish reviewer
- English reviewer
- source/reference checker

For MVP, one careful bilingual reviewer can cover all three, but separate roles are better if budget allows.

## Content quality goals

| Goal | Standard |
|---|---|
| Accuracy | Every answer traceable |
| Clarity | B1/B2-friendly explanation |
| Fairness | Avoid trick questions |
| Neutrality | No political persuasion |
| Usefulness | Explains why, not just what |
| Trust | Shows source reference |
