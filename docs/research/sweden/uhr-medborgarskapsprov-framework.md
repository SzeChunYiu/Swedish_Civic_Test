# Sweden UHR medborgarskapsprov framework research note

Date researched: 2026-05-20
Lane: RESEARCH
Atom: `sweden:UHR medborgarskapsprov official framework + any updates (authoritative)`

## Executive Summary

As of 2026-05-20, UHR says it is responsible for medborgarskapsprovet and that
the test is a knowledge test for the citizenship requirements in Swedish and
Swedish society (https://www.uhr.se/medborgarskapsprovet/, accessed
2026-05-20). UHR says rollout is staged: in August 2026 the test covers basic
knowledge of Swedish society, while Swedish-language tests come later
(https://www.uhr.se/medborgarskapsprovet/, accessed 2026-05-20).

UHR's FAQ says the first Swedish-society test will be held on 2026-08-15, that
registration opens in early June 2026, that candidates can register only after
receiving a Migrationsverket letter, and that places are limited
(https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/, accessed
2026-05-20). Migrationsverket says the knowledge requirement applies from
2026-06-06 to applicants aged 16-66, can be shown through school, Komvux, folk
high school, or SFI course D evidence, and that applicants without such evidence
may be offered a citizenship test
(https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html,
accessed 2026-05-20).

The content framework is now concrete. UHR/Skolverket's `Sverige i fokus` PDF
says it is education material for people taking the citizenship test to show
basic knowledge of Swedish society, that it was produced by UHR together with
Skolverket by government assignment, and that the test will be based on this
material (https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf,
accessed 2026-05-20).

## Official Operating Facts

| Dimension | Current official fact | Source |
|---|---|---|
| Responsible authority | UHR is responsible for medborgarskapsprovet. | https://www.uhr.se/medborgarskapsprovet/ accessed 2026-05-20 |
| Rollout | Swedish-society knowledge is tested first in August 2026; Swedish-language tests come later. | https://www.uhr.se/medborgarskapsprovet/ accessed 2026-05-20 |
| First sitting | The first Swedish-society test is on 2026-08-15. | https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/ accessed 2026-05-20 |
| Registration gate | Registration requires a Migrationsverket letter. | https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/ accessed 2026-05-20 |
| Registration timing and capacity | Registration opens in early June 2026; places are limited. | https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/ accessed 2026-05-20 |
| Preparation material | UHR points candidates to the official education material for the Swedish-society test. | https://www.uhr.se/medborgarskapsprovet/ accessed 2026-05-20 |
| Eligibility context | The knowledge requirement applies from 2026-06-06 to applicants aged 16-66. | https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html accessed 2026-05-20 |
| Alternative proof | Migrationsverket lists Swedish compulsory/upper-secondary grades, Komvux/folk-high-school studies, and SFI course D as examples. | https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html accessed 2026-05-20 |
| Exemptions | Migrationsverket says disability or other reasons can make a person exempt. | https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html accessed 2026-05-20 |

## Official Content Scope

UHR's official PDF table of contents defines the Swedish-society scope. These
are the 13 official chapters and the visible section headings in the TOC
(https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf,
accessed 2026-05-20):

| Official chapter | Visible sections |
|---|---|
| Landet Sverige | Geografi, klimat och natur; Sveriges indelning; Befolkning; Naturresurser; Klimatförändringar |
| Sveriges demokratiska system | Demokrati betyder folkstyre; Hot mot demokratin |
| Så här styrs Sverige | Landet styrs på olika nivåer; Sveriges statsskick |
| Politiska val och partier | Val och röstning; Politiska partier |
| Lag och rätt | Grundlagarna; Rättsväsendet |
| Mediernas roll | Fria medier; Olika slags medier; Källkritik |
| Mänskliga rättigheter | Mänskliga rättigheter gäller alla; Jämställdhet mellan könen; Barns rättigheter; Minoriteters rättigheter; Arbetet mot diskriminering |
| Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden; Arbetsmarknadens parter; Lagar och regler på arbetsmarknaden; Privatekonomi i Sverige |
| Välfärdssamhället | Skatter för Sveriges välfärd; Stat, regioner och kommuner har olika ansvar |
| Sveriges moderna historia | Från jordbrukssamhälle till industrisamhälle; Sveriges väg till demokrati; Modernisering och folkhem; Rekordåren; Informationssamhället och globalisering |
| Sverige och omvärlden | Nordiskt och europeiskt samarbete; Globalt samarbete; Försvars- och säkerhetspolitik |
| En sekulär stat och ett mångreligiöst land | Religionsfrihet; Religionens roll |
| Traditioner och högtider | Några traditionella högtider under året |

Inference: the app's existing `uhrReference.chapter` and `uhrReference.section`
fields should be treated as a machine-checkable contract against this official
scope, not only as display text. This inference follows from UHR saying the
test will be based on `Sverige i fokus` and from the app's current UHR-reference
model.

## Implications For Our Content

1. Build a canonical UHR framework manifest in product code. The app currently
   stores UHR chapter and section names as free text in question data; validation
   should fail when a question cites an unknown official chapter/section.
2. Keep operational test logistics separate from study-scope facts. The
   2026-06-06 rules date, 2026-08-15 first sitting, registration letter,
   limited places, and future adaptation details are time-sensitive.
3. Prefer source-bound coverage reporting over raw question counts. A strong
   product should be able to prove coverage by official UHR chapter and section.
4. Keep the "not real exam questions" boundary visible. The app can align to
   official study material but must not imply it republishes real UHR exam items.

## Verify-Prior Check

Earlier research in `docs/research/nordic/norway-citizenship-test.md`
recommended a curriculum-first coverage map. I checked current product paths on
2026-05-20 and found chapter progress/coverage features and UHR question
references, but no canonical manifest that validates every question's UHR
chapter/section against the official `Sverige i fokus` scope. I re-filed this
unimplemented implication as `UHR-FRAMEWORK-MANIFEST-1`.

## Sources

- UHR, "Medborgarskapsprovet":
  https://www.uhr.se/medborgarskapsprovet/ (accessed 2026-05-20)
- UHR, "Frågor och svar":
  https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/ (accessed 2026-05-20)
- UHR/Skolverket, `Sverige i fokus - Utbildningsmaterial till
  medborgarskapsprov` PDF:
  https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf
  (accessed 2026-05-20)
- Migrationsverket, "Nya regler för svenskt medborgarskap från 6 juni 2026":
  https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html
  (accessed 2026-05-20)

## Citation Anchors Checked

- UHR medborgarskapsprovet page: responsibility, staged rollout, registration
  opening, Migration Agency letter, and education-material preparation at lines
  305-308 in the web extraction checked 2026-05-20.
- UHR FAQ: definition, first test date, registration gate, capacity, adaptation
  placeholder, preparation material, and last-updated date at lines 315-360 and
  374 in the web extraction checked 2026-05-20.
- `Sverige i fokus` PDF: purpose, UHR/Skolverket production, test basis, first
  edition 2026, and TOC chapter/section scope at PDF extraction lines 5-69 in
  the web extraction checked 2026-05-20.
- Migrationsverket May 2026 update: knowledge-requirement age range, example
  proof routes, staged test rollout, UHR responsibility, letter requirement,
  Stockholm first test, exemptions, and child-application nuance at lines 56-87
  in the web extraction checked 2026-05-20.
