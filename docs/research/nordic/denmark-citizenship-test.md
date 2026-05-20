# Denmark citizenship and residence test research note

Date researched: 2026-05-20
Lane: RESEARCH
Atom: `nordic:denmark indfoedsretsproeven - structure, topics, recent reforms, sources`

## Executive summary

Denmark runs two separate civic-knowledge tests with different immigration
functions:

- `Indfoedsretsproeven` supports applications for Danish citizenship.
- `Medborgerskabsproeven` can satisfy one condition for permanent residence.

The citizenship test is a concise, high-stakes written multiple-choice test:
45 questions in 45 minutes, two or three answer options per question, and a
36/45 pass threshold with an extra requirement to answer at least 4 of the 5
Danish-values questions correctly. The residence test is shorter: 25 questions
in 30 minutes with a 20/25 pass threshold.

The strongest lesson for Swedish Civic Test is Denmark's explicit content mix:
fixed study-material questions, unprepared current-affairs questions, and
unprepared values questions. That model makes source coverage and currentness a
first-class part of the product, but it also creates a maintenance burden that
would need strict source and date tracking in a Swedish app.

## Official structure

| Dimension | Denmark finding | Source |
|---|---|---|
| Citizenship test role | Passing `Indfoedsretsproeven` is one condition for Danish citizenship. | Dansk og Proever, "Om Indfoedsretsproeven", lines 68-71 |
| Citizenship test topics | The test covers Danish society and values, Danish culture, and Danish history. | Dansk og Proever, "Om Indfoedsretsproeven", lines 70-75 |
| Citizenship format | 45 written questions; each has two or three answer options. | Dansk og Proever, "Om Indfoedsretsproeven", lines 71-76 |
| Citizenship scoring | Candidates need 36 of 45 correct, including 4 of 5 Danish-values questions. | Dansk og Proever, "Om Indfoedsretsproeven", lines 71-75 |
| Time and aids | The citizenship test lasts 45 minutes and no aids are allowed. | Dansk og Proever, "Om Indfoedsretsproeven", line 76 |
| Question source mix | 35 questions come from study material, 5 from recent current affairs, and 5 from Danish values. | Dansk og Proever, "Forberedelse til Indfoedsretsproeven", lines 70-72 |
| Official preparation | SIRI points candidates to free official written/audio study material, previous tests, news-following, and basic Danish values. | Dansk og Proever, "Forberedelse til Indfoedsretsproeven", lines 70-76 |
| Study-material scope | The official written material has six chapters and 235 pages; it covers 35 of the 45 questions. | Dansk og Proever, "Forberedelse til Indfoedsretsproeven", lines 84-87 |
| Current material cycle | The listed material applies to winter 2025 and summer 2026; an updated version is planned for late August 2026. | Dansk og Proever, "Forberedelse til Indfoedsretsproeven", lines 77-81 |
| Values-question reform | The official archive notes that from 2021 the citizenship test includes 5 values questions in addition to the other questions. | Dansk og Proever, "Forberedelse til Indfoedsretsproeven", lines 155-158 |
| Residence test role | Passing `Medborgerskabsproeven` can satisfy one condition for permanent residence. | Dansk og Proever, "Om Medborgerskabsproeven", lines 68-73 |
| Residence format | The residence test has 25 written questions, lasts 30 minutes, and uses two or three answer options. | Dansk og Proever, "Om Medborgerskabsproeven", lines 70-72 |
| Residence scoring | The residence pass threshold is at least 20 of 25 correct answers. | Dansk og Proever, "Om Medborgerskabsproeven", lines 72-73 |

## Curriculum and topic pattern

Denmark's citizenship preparation page says the study material covers six
chapters:

- Danish history.
- Danish democracy.
- The Danish economy.
- Denmark and the wider world.
- Danish cultural life.
- Thematic entries.

The current-affairs component is deliberately not limited to the study
material. SIRI describes those questions as covering politics, society, and
culture, with topics of substantial interest in Danish news media during the
half-year before the test. This makes the Danish test more time-sensitive than
a purely static study-material exam.

## Transferable design implications for Swedish Civic Test

1. Maintain a visible coverage matrix. Denmark separates study-material,
   current-affairs, and values content; a Swedish app should similarly know
   whether each question is stable UHR study content, current civic knowledge,
   or a values/rights scenario.
2. Treat currentness as metadata, not prose. If Swedish content later expands
   beyond UHR, every time-sensitive question should carry a review date and a
   source URL so outdated facts can be retired before they become misleading.
3. Use values as applied civic scenarios. Denmark's values component points to
   themes such as freedom of expression, equality, and the relation between
   religion and law. Sweden-specific questions can test the same kind of civic
   reasoning without copying Danish prompts.
4. Keep beginner ergonomics in mind. Two or three answer options, one selected
   answer, and short timed sections are mobile-friendly patterns for learners
   studying in a second language.
5. Keep official-source boundaries explicit. SIRI warns that third-party
   training sites are not official and may be imprecise or misleading. Swedish
   Civic Test should keep source labels and the non-official disclaimer visible.

## Sweden content-enrichment opportunities

These are research proposals only; no CONTENT atom is queued from this note
because the current factory policy keeps content work on UHR-only Phase A.

- Add future coverage-report fields for `stable_study_material`,
  `time_sensitive_currentness`, and `values_rights_scenario` so non-UHR work
  can be reviewed separately if the operator reopens external-source content.
- Use Denmark's 35+5+5 split as a comparison point when evaluating whether the
  Swedish app has enough practical law, rights, democratic participation, and
  everyday civic-values questions.
- If a timed mock mode is added, consider Denmark's one-minute-per-question
  pacing as a clear benchmark while preserving Swedish content requirements.

## Sources

- Dansk og Proever, "Om Indfoedsretsproeven":
  https://danskogproever.dk/borger/indfoedsretsproeve-statsborgerskab/om-indfoedsretsproeven/
- Dansk og Proever, "Forberedelse til Indfoedsretsproeven":
  https://danskogproever.dk/borger/indfoedsretsproeve-statsborgerskab/forberedelse-til-indfoedsretsproeven/
- Dansk og Proever, "Om Medborgerskabsproeven":
  https://danskogproever.dk/borger/medborgerskabsproeve-permanent-ophold/om-medborgerskabsproeven/
- SIRI, "Indfoedsretsproeven, vinter 2025" PDF:
  https://siri.dk/media/szvlnl5x/indfoedsretsproeven-2025-11.pdf

## Citation anchors checked

- `Om Indfoedsretsproeven`: role, topic scope, format, scoring, time, and aids
  at lines 68-76; preparation and proof responsibilities at lines 105-119.
- `Forberedelse til Indfoedsretsproeven`: preparation model, official-material
  warning, material cycle, chapter list, and archive/reform note at lines
  70-87 and 155-158.
- `Om Medborgerskabsproeven`: residence role, format, scoring, eligibility,
  and preparation at lines 68-82 and 106-118.
- SIRI winter 2025 PDF: confirms operational test instructions and 45-minute,
  45-question, two/three-option multiple-choice format on pages 1-2.
