# Germany Einbuergerungstest topic taxonomy research note

Date researched: 2026-05-21
Lane: RESEARCH
Atom: `compare:germany Einbürgerungstest topic taxonomy vs our coverage`

## Executive summary

Germany's Einbuergerungstest is a useful benchmark because BAMF publishes a
clear test format and a public question catalogue. The official test has 33
multiple-choice questions, 60 minutes, four answer choices per question, and a
pass mark of 17 correct answers
(https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Einbuergerung/einbuergerung-node.html?id=AK89225,
lines 114-117, accessed 2026-05-21).

The strongest product lesson for Swedish Civic Test is not to copy Germany's
questions. It is to expose coverage. BAMF tells learners that 30 questions come
from three general domains and three questions come from the applicant's
Bundesland
(https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Einbuergerung/einbuergerung-node.html?id=AK89225,
lines 118-119, accessed 2026-05-21). Our Swedish bank already has chapter and
section metadata from UHR's `Sverige i fokus`; mock exams and result screens
should make that coverage visible so learners can see whether they practised
democracy, law, welfare, history, or other domains rather than only seeing a
single score.

## Official German structure

| Dimension | Germany finding | Source |
|---|---|---|
| Knowledge requirement | BAMF says successful participation proves knowledge of Germany's legal and social order and living conditions needed for naturalisation. | https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Einbuergerung/einbuergerung-node.html?id=AK89225, lines 109-112 and 120-122, accessed 2026-05-21 |
| Test format | Candidates receive 33 questions, have 60 minutes, choose one correct answer from four options, and pass with at least 17 correct answers. | https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Einbuergerung/einbuergerung-node.html?id=AK89225, lines 114-117, accessed 2026-05-21 |
| General domain mix | 30 questions belong to the domains `Leben in der Demokratie`, `Geschichte und Verantwortung`, and `Mensch und Gesellschaft`. | https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Einbuergerung/einbuergerung-node.html?id=AK89225, lines 118-119, accessed 2026-05-21 |
| State-specific slice | Three questions concern the Bundesland where the person has their primary residence. | https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Einbuergerung/einbuergerung-node.html?id=AK89225, line 119, accessed 2026-05-21 |
| Public catalogue size | BAMF's online catalogue page says the combined catalogue has 300 federal and 160 state-specific questions. | https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/gesamtfragenkatalog-lebenindeutschland.html?nn=917926, lines 55-59, accessed 2026-05-21 |
| Candidate preparation | BAMF recommends preparing through its online test centre and says the practice catalogue has 310 questions in the interactive route: 300 general plus 10 for the person's Bundesland. | https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Einbuergerung/einbuergerung-node.html?id=AK89225, lines 131-134, accessed 2026-05-21 |
| Integration-course bridge | BAMF says the integration-course certificate can prove civic knowledge if the `Leben in Deutschland` test score is at least 17 of 33. | https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Einbuergerung/einbuergerung-node.html?id=AK89225, lines 135-140, accessed 2026-05-21 |
| Exam-day controls | BAMF's information sheet confirms 33 questions, one correct answer per item, 60 minutes, official ID, no phones or unauthorised aids, and exclusion for cheating or disruption. | https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/informationsblatt-einbuerungstest.pdf?__blob=publicationFile&v=4, lines 0-45, accessed 2026-05-21 |

## Comparison with current Swedish coverage

Sweden's official UHR material is chapter-structured rather than published as a
fixed public question pool. `Sverige i fokus` lists 13 content chapters spanning
geography, democracy, governance, elections, law, media/source criticism, human
rights, work/private finance, welfare, modern history, international relations,
religion, and traditions
(https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf,
lines 7-59, accessed 2026-05-21).

The repo mirrors those chapters in `content/uhr-section-map.json` and question
metadata, and `scripts/exam.test.js` already has a basic chapter-balancing
assertion for generated mock exams. The remaining gap is learner-facing:
Germany's official pages give learners a simple domain model before the test;
our app can give a Sweden-specific domain/section breakdown after a mock exam
without claiming to know UHR's real exam distribution.

## Implications for our content

- Do not copy the BAMF question bank or reuse German question wording. Use it
  only as a structure benchmark.
- Add a mock-exam result breakdown that groups answered Swedish questions by
  UHR chapter or a small derived domain set, showing correct/total per group.
  Label it as practice coverage, not as the official UHR exam blueprint.
- Keep the Swedish mock exam UHR-only by default, but explain coverage gaps
  when a session did not include enough questions from law, rights, welfare,
  democracy, history, or society/everyday-life chapters.
- If a future adaptive planner recommends topics, bind the recommendation to
  this app's observed UHR chapter performance, not to Germany's domain names.

## Sources

- BAMF, "Einbürgerung in Deutschland":
  https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Einbuergerung/einbuergerung-node.html?id=AK89225
- BAMF, "Gesamtfragenkatalog zum Test Leben in Deutschland und zum Einbürgerungstest":
  https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/gesamtfragenkatalog-lebenindeutschland.html?nn=917926
- BAMF, catalogue PDF, `Stand: 07.05.2025`:
  https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/gesamtfragenkatalog-lebenindeutschland.pdf?__blob=publicationFile&v=23
- BAMF, information sheet:
  https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/informationsblatt-einbuerungstest.pdf?__blob=publicationFile&v=4
- UHR/Skolverket, `Sverige i fokus` PDF:
  https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf

## Citation anchors checked

- BAMF naturalisation page: requirements, format, pass mark, domains,
  Bundesland slice, preparation catalogue, and integration-course bridge at
  lines 109-140.
- BAMF catalogue page: catalogue date and 300 federal/160 state-specific
  catalogue statement at lines 55-59.
- BAMF information sheet: answer format, ID/rules, 60 minutes, and cheating
  exclusion at lines 0-45.
- `Sverige i fokus` PDF: UHR chapter/topic table of contents at lines 7-59.
