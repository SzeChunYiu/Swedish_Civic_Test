# Somali Civic Localization Style Guide

Purpose: make Somali copy sound like clear civic-orientation Somali for adults
learning about Sweden, not like English or Swedish text translated word by word.
Use this file before translating UI, questions, explanations, badges, or humor
into `so`.

## Voice

Write in plain, respectful Somali close to public information for newcomers:

- direct and explanatory;
- warm in practice feedback, but not childish;
- careful with rights, duties, legal conditions, and authority names;
- Sweden-specific when an institution is part of what the learner must know.

Good Somali civic copy often explains the topic first, then tells the reader
what they can do or what applies to them. Use short sentences when the topic is
law, housing, discrimination, healthcare, school, or public authorities.

## Register observations from source pass

Informationsverige Somali pages use patterns useful for this app:

- learner framing: `Qoraalkan wuxuu ku saabsanyahay ...`;
- rights/duties phrasing: `xaq u leedahay`, `waajibaad`, `mas'uuliyad`;
- plain future/reading guidance: `Waxaad akhrin doontaa ...`;
- Sweden as a civic context: `gudaha Iswiidhan`, `degmada`, `maamulka`;
- anti-discrimination terms: `midabtakoorka`, `lagu takooray`.

Use these as style anchors, not as copied passages.

## Mechanical-translation repairs

| Avoid | Use | Why |
|---|---|---|
| `samee go'aan ku saabsan...` | `go'aan ka gaar ...` | Natural Somali verb-preposition pattern. |
| `su'aasha waa ku saabsan tahay...` | `Su'aashani waxay ka hadlayaa...` / `Su'aashani waxay tijaabinaysaa...` | More natural study-copy framing. |
| `bilow fadhiga tababarka` | `Bilow layliga` / `Bilow tababarka cutubkan` | Avoid English noun-stack structure. |
| `waad saxantahay` everywhere | `Waa sax.` / `Jawaabtaadu waa sax.` | Short and natural feedback. |
| `waad khaldan tahay` | `Markan jawaabtu ma saxna.` | Less shaming after mistakes. |
| `guddiga sharaxaadda` | `Sharaxaad` / `Sharaxaadda jawaabta` | Native app/study wording. |
| `qalabka ilaha` | `tixraacyo` / `qoraalka tixraaca` | More natural for source/reference material. |
| literal `baarlamaanka qaranka` for Riksdag | `Baarlamaanka Iswiidhan (Riksdag)` | Teach the Swedish institution. |
| treating `kommun` as only `magaalo` | `degmo` / `degmada` | Swedish municipal level is not always a city. |

## Civic-term rules

- First mention can combine Somali and Swedish/official term when the Swedish
  word is teachable: `Baarlamaanka Iswiidhan (Riksdag)`, `degmo (kommun)`.
- Later mentions should use the shortest clear form: `Riksdag`, `degmada`,
  `dawladda`, `maxkamadda`.
- Use `muwaadinimo` for citizenship as civic status; use `muwaadin Iswiidhish`
  for Swedish citizen.
- Use `xuquuq` for rights and `waajibaad` for duties/obligations.
- Use `sinaan` for equality and `takoor`/`midabtakoorka` for discrimination,
  following the reader-facing context.
- Avoid replacing Swedish bodies with Somali political institutions. Explain the
  Swedish body instead.

## UI patterns

| Function | Somali pattern |
|---|---|
| Start practice | `Bilow layliga`, `Bilow tababarka cutubkan` |
| Continue practice | `Sii wad layliga`, `Sii wad cutubka {n}` |
| Mock exam | `Imtixaan tijaabo ah`, `Imtixaan tijaabo ah oo waqti leh` |
| Correct feedback | `Waa sax.` + one short reason. |
| Wrong feedback | `Markan jawaabtu ma saxna. Jawaabta saxda ahi waa ...` |
| Explanation | `Sharaxaadda jawaabta` |
| Source note | `Waxaa lagu saleeyay tixraaca UHR; app-kani ma aha hay'ad imtixaan rasmi ah.` |
| Coming soon language | `Noocan luqadeed weli waa la diyaarinayaa.` |
| Local storage | `Horumarkaaga wuxuu ku kaydsan yahay qalabkan oo keliya.` |

## Humor and encouragement

Somali learner feedback should be calm and respectful. Prefer encouragement
that says the learner can try again or has learned one point.

Good patterns:

- `Hal qalad wax ma yeelo; hadda qodobkan waad xasuusan doontaa.`
- `Tallaabo yar ayaad maanta horay u qaadday.`
- `Akhri sharaxaadda, ka dibna isku day su'aasha xigta.`
- `Ereyga Riksdag marar badan ayuu soo noqonayaa; waa muhiim in la barto.`

Avoid:

- teasing that could sound like blame;
- jokes based on English idioms;
- promises that practice guarantees passing, citizenship, or a passport;
- culture jokes that require Swedish insider knowledge unless the joke teaches
  the Swedish word or custom.

## Punctuation and orthography

- Use Latin Somali script and normal apostrophes in words such as `mas'uuliyad`.
- Keep Swedish names, `UHR`, `JO`, and `DO` readable.
- Prefer numerals in UI counts: `{count} su'aalood`, `13 cutub`.
- Keep diacritics from Swedish names where they are part of the name.

## Word-by-word audit checklist

For every Somali string, check:

1. Does it sound like Somali public information, not English/SV word order?
2. Are rights and duties translated with `xuquuq` / `waajibaad` where relevant?
3. Are Swedish institutions taught without replacing them with non-Swedish
   institutions?
4. Is the tone respectful after wrong answers?
5. Does the copy avoid promising test success, citizenship, or passport
   outcomes?
6. Would a Somali-speaking newcomer understand the sentence without seeing the
   Swedish original?

## Sources used for this style guide

See `sources.tsv` rows for Informationsverige Somali pages on housing rights,
women's rights/equality, family/children activities, welfare/human rights, and
children's rights. These are style/register anchors for civic-orientation Somali.
