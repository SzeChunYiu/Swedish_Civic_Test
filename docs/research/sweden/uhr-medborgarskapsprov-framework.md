# UHR medborgarskapsprov official framework research note

Date researched: 2026-05-21
Lane: RESEARCH
Atom: `sweden:UHR medborgarskapsprov official framework + any updates (authoritative)`

## Executive summary

UHR's current public framework is narrower and more time-bound than a generic
"citizenship test" label suggests. As of access on 2026-05-21, UHR says the
first sitting in August 2026 tests grundläggande kunskaper om det svenska
samhället, while the Swedish-language test part will be introduced later
(https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/, lines
302-308; https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/, lines
315-318).

For this app, the strongest product rule is source currentness discipline:
official logistics copy and source metadata need separate review dates from
the question bank itself. The bank can remain grounded in the first edition of
`Sverige i fokus`, but application logistics such as registration timing,
place, language, and Migrationsverket letter gating are live UHR/Migrationsverket
facts and should not be inferred from older app copy.

## Official structure and current updates

| Dimension | UHR finding | Source |
|---|---|---|
| Responsible authority | UHR states that it is responsible for medborgarskapsprovet. | https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/, lines 302 and 308, accessed 2026-05-21 |
| Legal/application authority boundary | UHR says Migrationsverket handles citizenship applications and decides who is directed to register for the test. | https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/, lines 308 and 315-319, accessed 2026-05-21 |
| Rollout | UHR describes a stepwise rollout: the first part comes in August 2026 and concerns basic knowledge of Swedish society; Swedish-language testing comes later. | https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/, lines 304-308; https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/, lines 315-318, accessed 2026-05-21 |
| First sitting | UHR states that the first citizenship-test sitting will be on 15 August 2026 in Stockholm. | https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/, lines 320-324; https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/, lines 325-326, accessed 2026-05-21 |
| Registration gate | UHR says registration opens in early June, and only people who have received a Migrationsverket letter can register; places are limited. | https://www.uhr.se/medborgarskapsprovet/anmalan/, lines 301-307; https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/, lines 339-349, accessed 2026-05-21 |
| Test language | UHR's FAQ says the citizenship test can only be taken in Swedish. | https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/, lines 328-330, accessed 2026-05-21 |
| Preparation material | UHR says applicants can prepare for the society-knowledge test with UHR's education material, and the page links the first edition of `Sverige i fokus`. | https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/, lines 300-305, accessed 2026-05-21 |
| Source ownership | UHR says the education material was produced by UHR with Skolverket on behalf of the government. | https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/, line 309; PDF https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf, lines 62-69, accessed 2026-05-21 |
| Unofficial practice boundary | UHR explicitly says it does not stand behind internet practice tests made by others and has not quality-checked them. | https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/, lines 309-310; https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/, lines 331-337, accessed 2026-05-21 |
| Update status | The education-material page was updated 19 May 2026; the FAQ and registration pages were updated 6 May 2026. | https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/, line 315; https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/, line 374; https://www.uhr.se/medborgarskapsprovet/anmalan/, line 312, accessed 2026-05-21 |

## Topic framework from Sverige i fokus

`Sverige i fokus` is the current official society-knowledge study material. Its
table of contents covers geography, democracy, state/municipal governance,
elections, law and justice, media and source criticism, human rights, labour
market and private finance, welfare, modern history, Sweden and the world,
religion, and traditions/holidays
(https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf,
lines 7-59, accessed 2026-05-21).

The repo's `content/uhr-section-map.json` already mirrors these 13 chapters and
their sections, but its source metadata currently records `retrievedDate:
2026-05-15`, while the UHR education-material page now shows `Senast
uppdaterad: 19 maj 2026` (https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/,
line 315, accessed 2026-05-21). That is not a question-fact error, but it is a
source-currentness gap for exported CSV/static metadata.

## Implications for our content

- Keep the question bank UHR-first and trace questions to `Sverige i fokus`;
  do not invent real-exam questions or imply UHR quality control of this app.
- Keep society-knowledge logistics separate from later Swedish-language test
  details. Copy should say the first August 2026 sitting is the society-knowledge
  part, and that Swedish-language testing is later unless UHR/Migrationsverket
  publish a newer update.
- Sync source metadata and guards so `content/uhr-section-map.json`, exported
  CSV/source columns, static bank metadata, and source-route copy all agree on
  one canonical retrieval date for the current UHR education-material URL. This
  iteration verified the page on 2026-05-21.
- Keep registration guidance humble: users need a Migrationsverket letter and
  limited seats may fill. The app should route to UHR/Migrationsverket instead
  of promising eligibility or registration access.

## Sources

- UHR, "Om medborgarskapsprovet":
  https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/
- UHR, "Anmälan":
  https://www.uhr.se/medborgarskapsprovet/anmalan/
- UHR, "Frågor och svar":
  https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/
- UHR, "Utbildningsmaterial om det svenska samhället":
  https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/
- UHR/Skolverket, `Sverige i fokus` PDF:
  https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf

## Citation anchors checked

- UHR about page: framework, rollout, Migrationsverket boundary, first sitting,
  and education-material links at lines 302-337.
- UHR FAQ: UHR responsibility, first sitting, Swedish-only test language,
  registration gate, adaptation pending, and preparation material at lines
  313-364.
- UHR registration page: early-June registration and Migrationsverket-letter
  gate at lines 301-307.
- UHR education-material page: material purpose, PDF link, source ownership,
  unofficial-practice boundary, and update date at lines 300-315.
- `Sverige i fokus` PDF: table of contents and publication metadata at lines
  7-69.
