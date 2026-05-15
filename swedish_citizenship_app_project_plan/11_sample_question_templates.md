# 11 — Sample Question Templates

Use these templates to create consistent questions.

## Template 1 — Direct fact

```json
{
  "type": "single_choice",
  "examScope": "uhr_based",
  "questionSv": "Var ligger Sverige?",
  "questionEn": "Where is Sweden located?",
  "optionsSv": [
    "I Norden i norra Europa",
    "I södra Europa",
    "I västra Asien",
    "I Nordamerika"
  ],
  "optionsEn": [
    "In the Nordic region in northern Europe",
    "In southern Europe",
    "In western Asia",
    "In North America"
  ],
  "correctOptionIndexes": [0],
  "explanationSv": "Sverige ligger i Norden, som är en del av norra Europa.",
  "explanationEn": "Sweden is located in the Nordic region, which is part of northern Europe."
}
```

## Template 2 — Definition

```json
{
  "type": "single_choice",
  "examScope": "uhr_based",
  "questionSv": "Vad betyder demokrati?",
  "questionEn": "What does democracy mean?",
  "optionsSv": [
    "Folkstyre",
    "Militärstyre",
    "Kungastyre",
    "Företagsstyre"
  ],
  "optionsEn": [
    "Rule by the people",
    "Military rule",
    "Rule by a king",
    "Rule by companies"
  ],
  "correctOptionIndexes": [0],
  "explanationSv": "Demokrati betyder att folket styr, bland annat genom fria och rättvisa val.",
  "explanationEn": "Democracy means that the people govern, including through free and fair elections."
}
```

## Template 3 — True or false

```json
{
  "type": "true_false",
  "examScope": "uhr_based",
  "questionSv": "Sant eller falskt: Sverige är indelat i kommuner.",
  "questionEn": "True or false: Sweden is divided into municipalities.",
  "optionsSv": ["Sant", "Falskt"],
  "optionsEn": ["True", "False"],
  "correctOptionIndexes": [0],
  "explanationSv": "Sverige är indelat i kommuner. Kommunerna ansvarar för flera lokala samhällsfunktioner.",
  "explanationEn": "Sweden is divided into municipalities. Municipalities are responsible for several local public services."
}
```

## Template 4 — Scenario

```json
{
  "type": "single_choice",
  "examScope": "uhr_based",
  "questionSv": "En person vill påverka ett beslut i sin kommun. Vilket alternativ passar bäst?",
  "questionEn": "A person wants to influence a decision in their municipality. Which option fits best?",
  "optionsSv": [
    "Lämna synpunkter och förslag till kommunen",
    "Bestämma själv över kommunens budget",
    "Utse statsminister",
    "Ändra grundlagen ensam"
  ],
  "optionsEn": [
    "Submit comments and proposals to the municipality",
    "Personally decide the municipal budget",
    "Appoint the prime minister",
    "Change the constitution alone"
  ],
  "correctOptionIndexes": [0],
  "explanationSv": "Invånare kan påverka samhället på flera sätt, till exempel genom att lämna synpunkter och förslag till sin kommun.",
  "explanationEn": "Residents can influence society in several ways, for example by submitting comments and proposals to their municipality."
}
```

## Template 5 — Vocabulary support

```json
{
  "type": "single_choice",
  "examScope": "vocabulary_support",
  "questionSv": "Vad betyder ordet 'riksdag'?",
  "questionEn": "What does the word 'riksdag' mean?",
  "optionsSv": [
    "Sveriges parlament",
    "Sveriges domstol",
    "Sveriges polis",
    "Sveriges centralbank"
  ],
  "optionsEn": [
    "Sweden's parliament",
    "Sweden's court",
    "Sweden's police",
    "Sweden's central bank"
  ],
  "correctOptionIndexes": [0],
  "explanationSv": "Riksdagen är Sveriges parlament.",
  "explanationEn": "The Riksdag is Sweden's parliament."
}
```

## Template 6 — Why wrong explanations

Each question should optionally include why each wrong option is wrong.

```json
{
  "whyWrongSv": [
    "Detta är fel eftersom...",
    "Detta är fel eftersom...",
    "Detta är fel eftersom..."
  ],
  "whyWrongEn": [
    "This is incorrect because...",
    "This is incorrect because...",
    "This is incorrect because..."
  ]
}
```

## Template 7 — UHR reference block

```json
{
  "uhrReference": {
    "publisher": "Universitets- och högskolerådet",
    "documentTitle": "Sverige i fokus",
    "edition": "1:a upplagan, 2026",
    "chapterSv": "Landet Sverige",
    "chapterEn": "The country of Sweden",
    "sectionSv": "Geografi, klimat och natur",
    "sectionEn": "Geography, climate and nature",
    "page": 5,
    "quoteSv": "Short Swedish quote only.",
    "quoteEn": "English translation of the short quote.",
    "sourceUrl": "https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf"
  }
}
```

## Writing rules

- Swedish question first.
- English translation second.
- Keep options similar length.
- Avoid trick wording.
- Avoid political bias.
- Use short explanations.
- Add source reference.
- Mark as `needs_review` until checked.
