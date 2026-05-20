# English Localization Style Guide

Locale: English (`en`) for adult learners preparing for a Swedish civic/citizenship test.

Status: source-locale guidance. English is often the bridge language for other
locales, so it must be plain, accurate, and easy to re-localize without sounding
like bureaucratic Swedish translated word for word.

## Source-backed voice

Use a calm public-information register modeled on official Swedish civic pages:

- Give the topic first: "This page is about...", "This question is about...".
- Prefer concrete verbs: "apply", "vote", "appeal", "meet the requirements".
- Explain Swedish institutions without assuming prior knowledge.
- Keep sentences short enough for adult learners, but do not talk down to them.
- When a Swedish legal or institutional term matters, introduce it once in
  English and optionally include the Swedish name in parentheses.

The main source models are Informationsverige's civic orientation pages and the
Swedish Migration Agency's citizenship pages. They use direct headings,
short topic summaries, and careful distinctions between rights, obligations,
requirements, and things to think about.

## Register rules

Prefer:

- "You have the right to..." for rights.
- "You must..." only for legal duties or app-required actions.
- "In Sweden,..." for system facts.
- "For example,..." when giving civic examples.
- "The Swedish Migration Agency" rather than unexplained agency abbreviations.
- "state governed by the rule of law" or "rule of law" for rättsstat context.

Avoid:

- Legalistic filler: "hereinafter", "pursuant to", "aforementioned".
- Marketing voice: "master citizenship in minutes".
- Overclaiming: "official test question", "guaranteed pass", "approved by the
  state".
- Idioms that are hard to translate: "ace it", "piece of cake", "red tape".
- Swedish word-order calques such as "make an application about citizenship".

## Mechanical-source repairs

| Mechanical / risky English | Use instead | Why |
|---|---|---|
| Make an application about citizenship. | Apply for Swedish citizenship. | Natural official collocation. |
| You shall know democracy. | You should understand how democracy works in Sweden. | Avoids legal "shall" unless quoting a duty. |
| The people are deciding the laws. | The people choose representatives who make laws and govern. | More precise civic explanation. |
| Press next question for continue. | Select **Next question** to continue. | UI verb + object order. |
| Wrong answer! | Not quite. Review the explanation and try again. | Keeps learner tone supportive. |
| Sweden has four ground laws. | Sweden has four fundamental laws. | Standard term in civic sources. |
| You can complain in court. | You can appeal an incorrect decision in court. | More precise rule-of-law wording. |

## Civic terminology

| Concept | Preferred English | Notes |
|---|---|---|
| Sverige | Sweden | Use "Swedish" for nationality/institution adjectives. |
| svenskt medborgarskap | Swedish citizenship | Use "apply for" citizenship. |
| Migrationsverket | Swedish Migration Agency | First mention can include Swedish name if useful. |
| demokrati | democracy | Explain as elections plus rights, participation, and limits on power. |
| rättsstat | state governed by the rule of law | "Rule of law" is acceptable in short UI. |
| grundlag | fundamental law | If teaching the term, add examples from the constitution. |
| yttrandefrihet | freedom of expression | Do not reduce to only "free speech" in legal/civic lessons. |
| tryckfrihet | freedom of the press | Keep separate from freedom of expression when the lesson does. |
| rösträtt | right to vote | Include age or election scope only when the question asks. |
| diskriminering | discrimination | Use official protected-ground framing when needed. |
| skyldigheter | obligations | Use for civic/legal duties; avoid "burdens". |
| rättigheter | rights | Pair with clear limits where source material does. |
| jämställdhet | gender equality | Use for equality between women and men/genders in Swedish context. |

## UI copy patterns

| Context | Preferred copy |
|---|---|
| Start practice | Start practice |
| Continue practice | Continue practice |
| Retry | Try again |
| Correct answer | Correct. |
| Incorrect answer | Not quite. |
| Explanation lead-in | Explanation |
| Source label | Source material |
| Progress | Question {current} of {total} |
| Result summary | You answered {correct} of {total} questions correctly. |
| Review CTA | Review the explanation |
| Disclaimer | This app is for practice and is not an official exam. |

Keep button labels short, verb-led, and reusable. Avoid humor in core controls.

## Question-writing patterns

Good pattern:

> In Sweden, what does freedom of expression mean?

Then provide options that are parallel in grammar and length where possible.

Avoid:

> What is the thing with expression freedom in Sweden?

For civic explanations, prefer one claim per sentence. If a fact is conditional
or changing, say so and link the source rather than simplifying into a false
absolute.

## Humor and cultural adaptation

English can support light warmth, but civic learning should stay respectful.
Use humor only around learning behavior, not protected groups, migration status,
religion, citizenship eligibility, or trauma.

Safe examples:

- "Democracy is not a spectator sport." Use only as an optional explanatory
  flourish, not as a test answer.
- "Take a breath, then try the next question." Gentle encouragement.

Avoid:

- Sarcasm about wrong answers.
- Jokes about bureaucracy, asylum, poverty, or accents.
- Culture-specific idioms that will not localize cleanly.

## Source and change-sensitivity notes

Citizenship rules are time-sensitive. The Swedish Migration Agency page noted
on 2026-05-20 that new rules are scheduled to come into force on 2026-06-06.
Do not hard-code citizenship requirements without checking the live source and
recording the retrieval date.

Informationsverige pages are useful for stable civic register, but individual
facts still need source dates when they become quiz content.

## Word-by-word English audit gate

Before English strings or questions ship:

1. Read the sentence aloud. If it sounds like translated Swedish, rewrite it.
2. Check every civic term against this glossary or a source URL.
3. Replace legalese with plain English unless the legal term is being taught.
4. Remove unsupported official-authority claims.
5. Confirm that UI labels are short, consistent, and accessible.
6. Confirm that examples do not shame learners or stereotype communities.
7. For changing legal requirements, re-check the official source on the same day
   the content is released.

