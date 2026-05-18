# VERIFY Ledger

Bootstrap date: 2026-05-18
Bootstrap commit: 1161847

This ledger is the rolling CONTENT-VERIFY inventory. A `restate` status means the row is inventoried but not independently re-verified; do not treat it as accepted evidence. A future VERIFY pass must open the cited source and check fact, citation, correct answer, distractors, language naturalness, and regression before changing a row to `ok` or filing a `defect`.

Allowed statuses: `ok`, `defect`, `restate`.

## Coverage Summary

- Exported question rows inventoried: 705
- Authored source questions: 141
- Base source questions in data/questions.ts: 20
- Additional authored source questions: 121
- Generated published variants: 564
- Initial verification state: all rows are `restate` pending independent citation checks.

## Rolling Queue

| ID | Kind | Source ID | Source path | Chapter ID | UHR chapter | UHR section | Page | Last verified commit | Status | Next recheck |
|---|---|---|---|---|---|---|---:|---|---|---|
| q001 | authored-source | q001 | data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q002 | authored-source | q002 | data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q003 | authored-source | q003 | data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q004 | authored-source | q004 | data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q005 | authored-source | q005 | data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q006 | authored-source | q006 | data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q007 | authored-source | q007 | data/questions.ts | ch01 | Landet Sverige | Fjäll | 6 | - | restate | oldest-unverified |
| q008 | authored-source | q008 | data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | - | restate | oldest-unverified |
| q009 | authored-source | q009 | data/questions.ts | ch01 | Landet Sverige | Befolkning | 7 | - | restate | oldest-unverified |
| q010 | authored-source | q010 | data/questions.ts | ch01 | Landet Sverige | Naturresurser | 7 | - | restate | oldest-unverified |
| q011 | authored-source | q011 | data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q012 | authored-source | q012 | data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q013 | authored-source | q013 | data/questions.ts | ch02 | Sveriges demokratiska system | En stark demokrati | 10 | - | restate | oldest-unverified |
| q014 | authored-source | q014 | data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q015 | authored-source | q015 | data/questions.ts | ch02 | Sveriges demokratiska system | Hot mot demokratin | 11 | - | restate | oldest-unverified |
| q016 | authored-source | q016 | data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q017 | authored-source | q017 | data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q018 | authored-source | q018 | data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q019 | authored-source | q019 | data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q020 | authored-source | q020 | data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | - | restate | oldest-unverified |
| q021 | authored-source | q021 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Landet styrs på olika nivåer | 12 | - | restate | oldest-unverified |
| q022 | authored-source | q022 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q023 | authored-source | q023 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q024 | authored-source | q024 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Myndigheter | 13 | - | restate | oldest-unverified |
| q025 | authored-source | q025 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Regioner och kommuner | 13 | - | restate | oldest-unverified |
| q026 | authored-source | q026 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Kommunernas ansvar | 13 | - | restate | oldest-unverified |
| q027 | authored-source | q027 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Sveriges statsskick | 13 | - | restate | oldest-unverified |
| q028 | authored-source | q028 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q029 | authored-source | q029 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q030 | authored-source | q030 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q031 | authored-source | q031 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | - | restate | oldest-unverified |
| q032 | authored-source | q032 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Så här går det till att rösta | 14 | - | restate | oldest-unverified |
| q033 | authored-source | q033 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Politiska partier | 15 | - | restate | oldest-unverified |
| q034 | authored-source | q034 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | - | restate | oldest-unverified |
| q035 | authored-source | q035 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | - | restate | oldest-unverified |
| q036 | authored-source | q036 | data/additionalQuestions.ts | ch05 | Lag och rätt | Grundlagarna | 16 | - | restate | oldest-unverified |
| q037 | authored-source | q037 | data/additionalQuestions.ts | ch05 | Lag och rätt | Regeringsformen | 16 | - | restate | oldest-unverified |
| q038 | authored-source | q038 | data/additionalQuestions.ts | ch05 | Lag och rätt | Successionsordningen | 16 | - | restate | oldest-unverified |
| q039 | authored-source | q039 | data/additionalQuestions.ts | ch05 | Lag och rätt | Allemansrätten | 17 | - | restate | oldest-unverified |
| q040 | authored-source | q040 | data/additionalQuestions.ts | ch05 | Lag och rätt | Rättsväsendet | 17 | - | restate | oldest-unverified |
| q041 | authored-source | q041 | data/additionalQuestions.ts | ch05 | Lag och rätt | Rättssäkerhet | 17 | - | restate | oldest-unverified |
| q042 | authored-source | q042 | data/additionalQuestions.ts | ch05 | Lag och rätt | Domstolar | 18 | - | restate | oldest-unverified |
| q043 | authored-source | q043 | data/additionalQuestions.ts | ch05 | Lag och rätt | Polisen | 18 | - | restate | oldest-unverified |
| q044 | authored-source | q044 | data/additionalQuestions.ts | ch05 | Lag och rätt | Straffmyndighet och belastningsregister | 19 | - | restate | oldest-unverified |
| q045 | authored-source | q045 | data/additionalQuestions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q046 | authored-source | q046 | data/additionalQuestions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q047 | authored-source | q047 | data/additionalQuestions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q048 | authored-source | q048 | data/additionalQuestions.ts | ch06 | Mediernas roll | Public service | 21 | - | restate | oldest-unverified |
| q049 | authored-source | q049 | data/additionalQuestions.ts | ch06 | Mediernas roll | Public service | 21 | - | restate | oldest-unverified |
| q050 | authored-source | q050 | data/additionalQuestions.ts | ch06 | Mediernas roll | Källkritik | 21 | - | restate | oldest-unverified |
| q051 | authored-source | q051 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Mänskliga rättigheter gäller alla | 22 | - | restate | oldest-unverified |
| q052 | authored-source | q052 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | FN:s förklaring om de mänskliga rättigheterna | 22 | - | restate | oldest-unverified |
| q053 | authored-source | q053 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Jämställdhet mellan könen | 23 | - | restate | oldest-unverified |
| q054 | authored-source | q054 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Könsrelaterat våld och förtryck | 23 | - | restate | oldest-unverified |
| q055 | authored-source | q055 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Sexköpslagen | 24 | - | restate | oldest-unverified |
| q056 | authored-source | q056 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 24 | - | restate | oldest-unverified |
| q057 | authored-source | q057 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 25 | - | restate | oldest-unverified |
| q058 | authored-source | q058 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | - | restate | oldest-unverified |
| q059 | authored-source | q059 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | - | restate | oldest-unverified |
| q060 | authored-source | q060 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Hbtqi-personer | 26 | - | restate | oldest-unverified |
| q061 | authored-source | q061 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Arbetet mot diskriminering | 26 | - | restate | oldest-unverified |
| q062 | authored-source | q062 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | - | restate | oldest-unverified |
| q063 | authored-source | q063 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | - | restate | oldest-unverified |
| q064 | authored-source | q064 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | - | restate | oldest-unverified |
| q065 | authored-source | q065 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | - | restate | oldest-unverified |
| q066 | authored-source | q066 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | Lagar och regler på arbetsmarknaden | 29 | - | restate | oldest-unverified |
| q067 | authored-source | q067 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | A-kassan | 29 | - | restate | oldest-unverified |
| q068 | authored-source | q068 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | Privatekonomi i Sverige | 29 | - | restate | oldest-unverified |
| q069 | authored-source | q069 | data/additionalQuestions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | - | restate | oldest-unverified |
| q070 | authored-source | q070 | data/additionalQuestions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | - | restate | oldest-unverified |
| q071 | authored-source | q071 | data/additionalQuestions.ts | ch09 | Välfärdssamhället | Statligt finansierad välfärd | 30 | - | restate | oldest-unverified |
| q072 | authored-source | q072 | data/additionalQuestions.ts | ch09 | Välfärdssamhället | Regionerna ansvarar för sjukvården | 30 | - | restate | oldest-unverified |
| q073 | authored-source | q073 | data/additionalQuestions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | - | restate | oldest-unverified |
| q074 | authored-source | q074 | data/additionalQuestions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | - | restate | oldest-unverified |
| q075 | authored-source | q075 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Från jordbrukssamhälle till industrisamhälle | 32 | - | restate | oldest-unverified |
| q076 | authored-source | q076 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | - | restate | oldest-unverified |
| q077 | authored-source | q077 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | - | restate | oldest-unverified |
| q078 | authored-source | q078 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Sveriges väg till demokrati | 33 | - | restate | oldest-unverified |
| q079 | authored-source | q079 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Folkrörelserna | 33 | - | restate | oldest-unverified |
| q080 | authored-source | q080 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Demokratins genombrott | 34 | - | restate | oldest-unverified |
| q081 | authored-source | q081 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Den svenska modellen | 35 | - | restate | oldest-unverified |
| q082 | authored-source | q082 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Rekordåren | 36 | - | restate | oldest-unverified |
| q083 | authored-source | q083 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Sverige blir ett invandrarland | 36 | - | restate | oldest-unverified |
| q084 | authored-source | q084 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Digital revolution och globalisering | 38 | - | restate | oldest-unverified |
| q085 | authored-source | q085 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | Nordiskt samarbete | 39 | - | restate | oldest-unverified |
| q086 | authored-source | q086 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q087 | authored-source | q087 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q088 | authored-source | q088 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q089 | authored-source | q089 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | Globalt samarbete | 39 | - | restate | oldest-unverified |
| q090 | authored-source | q090 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | Efter kalla krigets slut | 40 | - | restate | oldest-unverified |
| q091 | authored-source | q091 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | Sveriges försvar | 40 | - | restate | oldest-unverified |
| q092 | authored-source | q092 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q093 | authored-source | q093 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q094 | authored-source | q094 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q095 | authored-source | q095 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q096 | authored-source | q096 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q097 | authored-source | q097 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Nyår | 45 | - | restate | oldest-unverified |
| q098 | authored-source | q098 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q099 | authored-source | q099 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | - | restate | oldest-unverified |
| q100 | authored-source | q100 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q101 | authored-source | q101 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Påsk | 45 | - | restate | oldest-unverified |
| q102 | authored-source | q102 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Valborgsmässoafton | 46 | - | restate | oldest-unverified |
| q103 | authored-source | q103 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Första maj | 46 | - | restate | oldest-unverified |
| q104 | authored-source | q104 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q105 | authored-source | q105 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q106 | authored-source | q106 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q107 | authored-source | q107 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q108 | authored-source | q108 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q109 | authored-source | q109 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q110 | authored-source | q110 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | - | restate | oldest-unverified |
| q111 | authored-source | q111 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q112 | authored-source | q112 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q113 | authored-source | q113 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q114 | authored-source | q114 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q115 | authored-source | q115 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q116 | authored-source | q116 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q117 | authored-source | q117 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q118 | authored-source | q118 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q119 | authored-source | q119 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q120 | authored-source | q120 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | - | restate | oldest-unverified |
| q121 | authored-source | q121 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q122 | authored-source | q122 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q123 | authored-source | q123 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q124 | authored-source | q124 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q125 | authored-source | q125 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | - | restate | oldest-unverified |
| q126 | authored-source | q126 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Några traditionella högtider under året | 45 | - | restate | oldest-unverified |
| q127 | authored-source | q127 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q128 | authored-source | q128 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q129 | authored-source | q129 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q130 | authored-source | q130 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q131 | authored-source | q131 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Påsk | 45 | - | restate | oldest-unverified |
| q132 | authored-source | q132 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q133 | authored-source | q133 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q134 | authored-source | q134 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q135 | authored-source | q135 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q136 | authored-source | q136 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q137 | authored-source | q137 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q138 | authored-source | q138 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q139 | authored-source | q139 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q140 | authored-source | q140 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q141 | authored-source | q141 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q142 | section-practice | q001 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q143 | true-false | q001 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q144 | false-statement | q001 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q145 | judgement | q001 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q146 | section-practice | q002 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q147 | true-false | q002 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q148 | true-false | q002 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q149 | true-false | q002 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q150 | section-practice | q003 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q151 | true-false | q003 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q152 | false-statement | q003 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q153 | judgement | q003 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q154 | section-practice | q004 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q155 | true-false | q004 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q156 | false-statement | q004 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q157 | judgement | q004 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q158 | section-practice | q005 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q159 | true-false | q005 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q160 | false-statement | q005 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q161 | judgement | q005 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q162 | section-practice | q006 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q163 | true-false | q006 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q164 | true-false | q006 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q165 | true-false | q006 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | - | restate | oldest-unverified |
| q166 | section-practice | q007 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Fjäll | 6 | - | restate | oldest-unverified |
| q167 | true-false | q007 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Fjäll | 6 | - | restate | oldest-unverified |
| q168 | false-statement | q007 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Fjäll | 6 | - | restate | oldest-unverified |
| q169 | judgement | q007 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Fjäll | 6 | - | restate | oldest-unverified |
| q170 | section-practice | q008 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | - | restate | oldest-unverified |
| q171 | true-false | q008 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | - | restate | oldest-unverified |
| q172 | false-statement | q008 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | - | restate | oldest-unverified |
| q173 | judgement | q008 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | - | restate | oldest-unverified |
| q174 | section-practice | q009 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Befolkning | 7 | - | restate | oldest-unverified |
| q175 | true-false | q009 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Befolkning | 7 | - | restate | oldest-unverified |
| q176 | false-statement | q009 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Befolkning | 7 | - | restate | oldest-unverified |
| q177 | judgement | q009 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Befolkning | 7 | - | restate | oldest-unverified |
| q178 | section-practice | q010 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Naturresurser | 7 | - | restate | oldest-unverified |
| q179 | true-false | q010 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Naturresurser | 7 | - | restate | oldest-unverified |
| q180 | false-statement | q010 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Naturresurser | 7 | - | restate | oldest-unverified |
| q181 | judgement | q010 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Naturresurser | 7 | - | restate | oldest-unverified |
| q182 | section-practice | q011 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q183 | true-false | q011 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q184 | false-statement | q011 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q185 | judgement | q011 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q186 | section-practice | q012 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q187 | true-false | q012 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q188 | false-statement | q012 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q189 | judgement | q012 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q190 | section-practice | q013 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | En stark demokrati | 10 | - | restate | oldest-unverified |
| q191 | true-false | q013 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | En stark demokrati | 10 | - | restate | oldest-unverified |
| q192 | false-statement | q013 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | En stark demokrati | 10 | - | restate | oldest-unverified |
| q193 | judgement | q013 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | En stark demokrati | 10 | - | restate | oldest-unverified |
| q194 | section-practice | q014 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q195 | true-false | q014 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q196 | false-statement | q014 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q197 | judgement | q014 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | - | restate | oldest-unverified |
| q198 | section-practice | q015 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Hot mot demokratin | 11 | - | restate | oldest-unverified |
| q199 | true-false | q015 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Hot mot demokratin | 11 | - | restate | oldest-unverified |
| q200 | false-statement | q015 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Hot mot demokratin | 11 | - | restate | oldest-unverified |
| q201 | judgement | q015 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Hot mot demokratin | 11 | - | restate | oldest-unverified |
| q202 | section-practice | q016 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q203 | true-false | q016 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q204 | false-statement | q016 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q205 | judgement | q016 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q206 | section-practice | q017 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q207 | true-false | q017 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q208 | false-statement | q017 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q209 | judgement | q017 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q210 | section-practice | q018 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q211 | true-false | q018 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q212 | false-statement | q018 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q213 | judgement | q018 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q214 | section-practice | q019 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q215 | true-false | q019 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q216 | false-statement | q019 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q217 | judgement | q019 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q218 | section-practice | q020 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | - | restate | oldest-unverified |
| q219 | true-false | q020 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | - | restate | oldest-unverified |
| q220 | false-statement | q020 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | - | restate | oldest-unverified |
| q221 | judgement | q020 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | - | restate | oldest-unverified |
| q222 | section-practice | q021 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Landet styrs på olika nivåer | 12 | - | restate | oldest-unverified |
| q223 | true-false | q021 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Landet styrs på olika nivåer | 12 | - | restate | oldest-unverified |
| q224 | false-statement | q021 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Landet styrs på olika nivåer | 12 | - | restate | oldest-unverified |
| q225 | judgement | q021 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Landet styrs på olika nivåer | 12 | - | restate | oldest-unverified |
| q226 | section-practice | q022 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q227 | true-false | q022 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q228 | false-statement | q022 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q229 | judgement | q022 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q230 | section-practice | q023 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q231 | true-false | q023 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q232 | false-statement | q023 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q233 | judgement | q023 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q234 | section-practice | q024 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Myndigheter | 13 | - | restate | oldest-unverified |
| q235 | true-false | q024 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Myndigheter | 13 | - | restate | oldest-unverified |
| q236 | false-statement | q024 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Myndigheter | 13 | - | restate | oldest-unverified |
| q237 | judgement | q024 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Myndigheter | 13 | - | restate | oldest-unverified |
| q238 | section-practice | q025 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Regioner och kommuner | 13 | - | restate | oldest-unverified |
| q239 | true-false | q025 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Regioner och kommuner | 13 | - | restate | oldest-unverified |
| q240 | false-statement | q025 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Regioner och kommuner | 13 | - | restate | oldest-unverified |
| q241 | judgement | q025 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Regioner och kommuner | 13 | - | restate | oldest-unverified |
| q242 | section-practice | q026 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Kommunernas ansvar | 13 | - | restate | oldest-unverified |
| q243 | true-false | q026 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Kommunernas ansvar | 13 | - | restate | oldest-unverified |
| q244 | false-statement | q026 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Kommunernas ansvar | 13 | - | restate | oldest-unverified |
| q245 | judgement | q026 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Kommunernas ansvar | 13 | - | restate | oldest-unverified |
| q246 | section-practice | q027 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Sveriges statsskick | 13 | - | restate | oldest-unverified |
| q247 | true-false | q027 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Sveriges statsskick | 13 | - | restate | oldest-unverified |
| q248 | false-statement | q027 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Sveriges statsskick | 13 | - | restate | oldest-unverified |
| q249 | judgement | q027 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Sveriges statsskick | 13 | - | restate | oldest-unverified |
| q250 | section-practice | q028 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q251 | true-false | q028 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q252 | false-statement | q028 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q253 | judgement | q028 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | - | restate | oldest-unverified |
| q254 | section-practice | q029 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q255 | true-false | q029 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q256 | false-statement | q029 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q257 | judgement | q029 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q258 | section-practice | q030 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q259 | true-false | q030 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q260 | false-statement | q030 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q261 | judgement | q030 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | - | restate | oldest-unverified |
| q262 | section-practice | q031 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | - | restate | oldest-unverified |
| q263 | true-false | q031 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | - | restate | oldest-unverified |
| q264 | false-statement | q031 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | - | restate | oldest-unverified |
| q265 | judgement | q031 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | - | restate | oldest-unverified |
| q266 | section-practice | q032 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Så här går det till att rösta | 14 | - | restate | oldest-unverified |
| q267 | true-false | q032 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Så här går det till att rösta | 14 | - | restate | oldest-unverified |
| q268 | false-statement | q032 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Så här går det till att rösta | 14 | - | restate | oldest-unverified |
| q269 | judgement | q032 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Så här går det till att rösta | 14 | - | restate | oldest-unverified |
| q270 | section-practice | q033 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Politiska partier | 15 | - | restate | oldest-unverified |
| q271 | true-false | q033 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Politiska partier | 15 | - | restate | oldest-unverified |
| q272 | false-statement | q033 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Politiska partier | 15 | - | restate | oldest-unverified |
| q273 | judgement | q033 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Politiska partier | 15 | - | restate | oldest-unverified |
| q274 | section-practice | q034 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | - | restate | oldest-unverified |
| q275 | true-false | q034 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | - | restate | oldest-unverified |
| q276 | false-statement | q034 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | - | restate | oldest-unverified |
| q277 | judgement | q034 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | - | restate | oldest-unverified |
| q278 | section-practice | q035 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | - | restate | oldest-unverified |
| q279 | true-false | q035 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | - | restate | oldest-unverified |
| q280 | false-statement | q035 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | - | restate | oldest-unverified |
| q281 | judgement | q035 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | - | restate | oldest-unverified |
| q282 | section-practice | q036 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Grundlagarna | 16 | - | restate | oldest-unverified |
| q283 | true-false | q036 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Grundlagarna | 16 | - | restate | oldest-unverified |
| q284 | false-statement | q036 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Grundlagarna | 16 | - | restate | oldest-unverified |
| q285 | judgement | q036 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Grundlagarna | 16 | - | restate | oldest-unverified |
| q286 | section-practice | q037 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Regeringsformen | 16 | - | restate | oldest-unverified |
| q287 | true-false | q037 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Regeringsformen | 16 | - | restate | oldest-unverified |
| q288 | false-statement | q037 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Regeringsformen | 16 | - | restate | oldest-unverified |
| q289 | judgement | q037 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Regeringsformen | 16 | - | restate | oldest-unverified |
| q290 | section-practice | q038 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Successionsordningen | 16 | - | restate | oldest-unverified |
| q291 | true-false | q038 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Successionsordningen | 16 | - | restate | oldest-unverified |
| q292 | false-statement | q038 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Successionsordningen | 16 | - | restate | oldest-unverified |
| q293 | judgement | q038 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Successionsordningen | 16 | - | restate | oldest-unverified |
| q294 | section-practice | q039 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Allemansrätten | 17 | - | restate | oldest-unverified |
| q295 | true-false | q039 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Allemansrätten | 17 | - | restate | oldest-unverified |
| q296 | false-statement | q039 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Allemansrätten | 17 | - | restate | oldest-unverified |
| q297 | judgement | q039 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Allemansrätten | 17 | - | restate | oldest-unverified |
| q298 | section-practice | q040 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättsväsendet | 17 | - | restate | oldest-unverified |
| q299 | true-false | q040 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättsväsendet | 17 | - | restate | oldest-unverified |
| q300 | false-statement | q040 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättsväsendet | 17 | - | restate | oldest-unverified |
| q301 | judgement | q040 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättsväsendet | 17 | - | restate | oldest-unverified |
| q302 | section-practice | q041 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättssäkerhet | 17 | - | restate | oldest-unverified |
| q303 | true-false | q041 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättssäkerhet | 17 | - | restate | oldest-unverified |
| q304 | false-statement | q041 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättssäkerhet | 17 | - | restate | oldest-unverified |
| q305 | judgement | q041 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättssäkerhet | 17 | - | restate | oldest-unverified |
| q306 | section-practice | q042 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Domstolar | 18 | - | restate | oldest-unverified |
| q307 | true-false | q042 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Domstolar | 18 | - | restate | oldest-unverified |
| q308 | false-statement | q042 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Domstolar | 18 | - | restate | oldest-unverified |
| q309 | judgement | q042 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Domstolar | 18 | - | restate | oldest-unverified |
| q310 | section-practice | q043 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Polisen | 18 | - | restate | oldest-unverified |
| q311 | true-false | q043 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Polisen | 18 | - | restate | oldest-unverified |
| q312 | false-statement | q043 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Polisen | 18 | - | restate | oldest-unverified |
| q313 | judgement | q043 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Polisen | 18 | - | restate | oldest-unverified |
| q314 | section-practice | q044 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Straffmyndighet och belastningsregister | 19 | - | restate | oldest-unverified |
| q315 | true-false | q044 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Straffmyndighet och belastningsregister | 19 | - | restate | oldest-unverified |
| q316 | false-statement | q044 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Straffmyndighet och belastningsregister | 19 | - | restate | oldest-unverified |
| q317 | judgement | q044 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Straffmyndighet och belastningsregister | 19 | - | restate | oldest-unverified |
| q318 | section-practice | q045 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q319 | true-false | q045 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q320 | false-statement | q045 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q321 | judgement | q045 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q322 | section-practice | q046 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q323 | true-false | q046 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q324 | false-statement | q046 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q325 | judgement | q046 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q326 | section-practice | q047 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q327 | true-false | q047 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q328 | false-statement | q047 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q329 | judgement | q047 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | - | restate | oldest-unverified |
| q330 | section-practice | q048 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | - | restate | oldest-unverified |
| q331 | true-false | q048 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | - | restate | oldest-unverified |
| q332 | false-statement | q048 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | - | restate | oldest-unverified |
| q333 | judgement | q048 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | - | restate | oldest-unverified |
| q334 | section-practice | q049 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | - | restate | oldest-unverified |
| q335 | true-false | q049 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | - | restate | oldest-unverified |
| q336 | false-statement | q049 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | - | restate | oldest-unverified |
| q337 | judgement | q049 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | - | restate | oldest-unverified |
| q338 | section-practice | q050 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Källkritik | 21 | - | restate | oldest-unverified |
| q339 | true-false | q050 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Källkritik | 21 | - | restate | oldest-unverified |
| q340 | false-statement | q050 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Källkritik | 21 | - | restate | oldest-unverified |
| q341 | judgement | q050 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Källkritik | 21 | - | restate | oldest-unverified |
| q342 | section-practice | q051 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Mänskliga rättigheter gäller alla | 22 | - | restate | oldest-unverified |
| q343 | true-false | q051 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Mänskliga rättigheter gäller alla | 22 | - | restate | oldest-unverified |
| q344 | false-statement | q051 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Mänskliga rättigheter gäller alla | 22 | - | restate | oldest-unverified |
| q345 | judgement | q051 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Mänskliga rättigheter gäller alla | 22 | - | restate | oldest-unverified |
| q346 | section-practice | q052 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | FN:s förklaring om de mänskliga rättigheterna | 22 | - | restate | oldest-unverified |
| q347 | true-false | q052 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | FN:s förklaring om de mänskliga rättigheterna | 22 | - | restate | oldest-unverified |
| q348 | false-statement | q052 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | FN:s förklaring om de mänskliga rättigheterna | 22 | - | restate | oldest-unverified |
| q349 | judgement | q052 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | FN:s förklaring om de mänskliga rättigheterna | 22 | - | restate | oldest-unverified |
| q350 | section-practice | q053 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Jämställdhet mellan könen | 23 | - | restate | oldest-unverified |
| q351 | true-false | q053 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Jämställdhet mellan könen | 23 | - | restate | oldest-unverified |
| q352 | false-statement | q053 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Jämställdhet mellan könen | 23 | - | restate | oldest-unverified |
| q353 | judgement | q053 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Jämställdhet mellan könen | 23 | - | restate | oldest-unverified |
| q354 | section-practice | q054 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Könsrelaterat våld och förtryck | 23 | - | restate | oldest-unverified |
| q355 | true-false | q054 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Könsrelaterat våld och förtryck | 23 | - | restate | oldest-unverified |
| q356 | false-statement | q054 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Könsrelaterat våld och förtryck | 23 | - | restate | oldest-unverified |
| q357 | judgement | q054 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Könsrelaterat våld och förtryck | 23 | - | restate | oldest-unverified |
| q358 | section-practice | q055 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Sexköpslagen | 24 | - | restate | oldest-unverified |
| q359 | true-false | q055 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Sexköpslagen | 24 | - | restate | oldest-unverified |
| q360 | false-statement | q055 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Sexköpslagen | 24 | - | restate | oldest-unverified |
| q361 | judgement | q055 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Sexköpslagen | 24 | - | restate | oldest-unverified |
| q362 | section-practice | q056 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 24 | - | restate | oldest-unverified |
| q363 | true-false | q056 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 24 | - | restate | oldest-unverified |
| q364 | false-statement | q056 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 24 | - | restate | oldest-unverified |
| q365 | judgement | q056 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 24 | - | restate | oldest-unverified |
| q366 | section-practice | q057 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 25 | - | restate | oldest-unverified |
| q367 | true-false | q057 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 25 | - | restate | oldest-unverified |
| q368 | false-statement | q057 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 25 | - | restate | oldest-unverified |
| q369 | judgement | q057 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 25 | - | restate | oldest-unverified |
| q370 | section-practice | q058 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | - | restate | oldest-unverified |
| q371 | true-false | q058 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | - | restate | oldest-unverified |
| q372 | false-statement | q058 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | - | restate | oldest-unverified |
| q373 | judgement | q058 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | - | restate | oldest-unverified |
| q374 | section-practice | q059 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | - | restate | oldest-unverified |
| q375 | true-false | q059 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | - | restate | oldest-unverified |
| q376 | false-statement | q059 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | - | restate | oldest-unverified |
| q377 | judgement | q059 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | - | restate | oldest-unverified |
| q378 | section-practice | q060 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Hbtqi-personer | 26 | - | restate | oldest-unverified |
| q379 | true-false | q060 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Hbtqi-personer | 26 | - | restate | oldest-unverified |
| q380 | false-statement | q060 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Hbtqi-personer | 26 | - | restate | oldest-unverified |
| q381 | judgement | q060 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Hbtqi-personer | 26 | - | restate | oldest-unverified |
| q382 | section-practice | q061 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Arbetet mot diskriminering | 26 | - | restate | oldest-unverified |
| q383 | true-false | q061 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Arbetet mot diskriminering | 26 | - | restate | oldest-unverified |
| q384 | false-statement | q061 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Arbetet mot diskriminering | 26 | - | restate | oldest-unverified |
| q385 | judgement | q061 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Arbetet mot diskriminering | 26 | - | restate | oldest-unverified |
| q386 | section-practice | q062 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | - | restate | oldest-unverified |
| q387 | true-false | q062 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | - | restate | oldest-unverified |
| q388 | false-statement | q062 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | - | restate | oldest-unverified |
| q389 | judgement | q062 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | - | restate | oldest-unverified |
| q390 | section-practice | q063 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | - | restate | oldest-unverified |
| q391 | true-false | q063 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | - | restate | oldest-unverified |
| q392 | false-statement | q063 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | - | restate | oldest-unverified |
| q393 | judgement | q063 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | - | restate | oldest-unverified |
| q394 | section-practice | q064 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | - | restate | oldest-unverified |
| q395 | true-false | q064 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | - | restate | oldest-unverified |
| q396 | false-statement | q064 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | - | restate | oldest-unverified |
| q397 | judgement | q064 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | - | restate | oldest-unverified |
| q398 | section-practice | q065 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | - | restate | oldest-unverified |
| q399 | true-false | q065 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | - | restate | oldest-unverified |
| q400 | false-statement | q065 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | - | restate | oldest-unverified |
| q401 | judgement | q065 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | - | restate | oldest-unverified |
| q402 | section-practice | q066 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Lagar och regler på arbetsmarknaden | 29 | - | restate | oldest-unverified |
| q403 | true-false | q066 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Lagar och regler på arbetsmarknaden | 29 | - | restate | oldest-unverified |
| q404 | false-statement | q066 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Lagar och regler på arbetsmarknaden | 29 | - | restate | oldest-unverified |
| q405 | judgement | q066 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Lagar och regler på arbetsmarknaden | 29 | - | restate | oldest-unverified |
| q406 | section-practice | q067 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | A-kassan | 29 | - | restate | oldest-unverified |
| q407 | true-false | q067 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | A-kassan | 29 | - | restate | oldest-unverified |
| q408 | false-statement | q067 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | A-kassan | 29 | - | restate | oldest-unverified |
| q409 | judgement | q067 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | A-kassan | 29 | - | restate | oldest-unverified |
| q410 | section-practice | q068 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Privatekonomi i Sverige | 29 | - | restate | oldest-unverified |
| q411 | true-false | q068 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Privatekonomi i Sverige | 29 | - | restate | oldest-unverified |
| q412 | false-statement | q068 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Privatekonomi i Sverige | 29 | - | restate | oldest-unverified |
| q413 | judgement | q068 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Privatekonomi i Sverige | 29 | - | restate | oldest-unverified |
| q414 | section-practice | q069 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | - | restate | oldest-unverified |
| q415 | true-false | q069 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | - | restate | oldest-unverified |
| q416 | false-statement | q069 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | - | restate | oldest-unverified |
| q417 | judgement | q069 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | - | restate | oldest-unverified |
| q418 | section-practice | q070 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | - | restate | oldest-unverified |
| q419 | true-false | q070 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | - | restate | oldest-unverified |
| q420 | false-statement | q070 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | - | restate | oldest-unverified |
| q421 | judgement | q070 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | - | restate | oldest-unverified |
| q422 | section-practice | q071 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Statligt finansierad välfärd | 30 | - | restate | oldest-unverified |
| q423 | true-false | q071 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Statligt finansierad välfärd | 30 | - | restate | oldest-unverified |
| q424 | false-statement | q071 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Statligt finansierad välfärd | 30 | - | restate | oldest-unverified |
| q425 | judgement | q071 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Statligt finansierad välfärd | 30 | - | restate | oldest-unverified |
| q426 | section-practice | q072 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Regionerna ansvarar för sjukvården | 30 | - | restate | oldest-unverified |
| q427 | true-false | q072 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Regionerna ansvarar för sjukvården | 30 | - | restate | oldest-unverified |
| q428 | false-statement | q072 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Regionerna ansvarar för sjukvården | 30 | - | restate | oldest-unverified |
| q429 | judgement | q072 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Regionerna ansvarar för sjukvården | 30 | - | restate | oldest-unverified |
| q430 | section-practice | q073 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | - | restate | oldest-unverified |
| q431 | true-false | q073 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | - | restate | oldest-unverified |
| q432 | false-statement | q073 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | - | restate | oldest-unverified |
| q433 | judgement | q073 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | - | restate | oldest-unverified |
| q434 | section-practice | q074 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | - | restate | oldest-unverified |
| q435 | true-false | q074 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | - | restate | oldest-unverified |
| q436 | false-statement | q074 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | - | restate | oldest-unverified |
| q437 | judgement | q074 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | - | restate | oldest-unverified |
| q438 | section-practice | q075 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Från jordbrukssamhälle till industrisamhälle | 32 | - | restate | oldest-unverified |
| q439 | true-false | q075 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Från jordbrukssamhälle till industrisamhälle | 32 | - | restate | oldest-unverified |
| q440 | false-statement | q075 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Från jordbrukssamhälle till industrisamhälle | 32 | - | restate | oldest-unverified |
| q441 | judgement | q075 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Från jordbrukssamhälle till industrisamhälle | 32 | - | restate | oldest-unverified |
| q442 | section-practice | q076 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | - | restate | oldest-unverified |
| q443 | true-false | q076 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | - | restate | oldest-unverified |
| q444 | false-statement | q076 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | - | restate | oldest-unverified |
| q445 | judgement | q076 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | - | restate | oldest-unverified |
| q446 | section-practice | q077 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | - | restate | oldest-unverified |
| q447 | true-false | q077 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | - | restate | oldest-unverified |
| q448 | false-statement | q077 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | - | restate | oldest-unverified |
| q449 | judgement | q077 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | - | restate | oldest-unverified |
| q450 | section-practice | q078 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sveriges väg till demokrati | 33 | - | restate | oldest-unverified |
| q451 | true-false | q078 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sveriges väg till demokrati | 33 | - | restate | oldest-unverified |
| q452 | false-statement | q078 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sveriges väg till demokrati | 33 | - | restate | oldest-unverified |
| q453 | judgement | q078 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sveriges väg till demokrati | 33 | - | restate | oldest-unverified |
| q454 | section-practice | q079 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Folkrörelserna | 33 | - | restate | oldest-unverified |
| q455 | true-false | q079 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Folkrörelserna | 33 | - | restate | oldest-unverified |
| q456 | false-statement | q079 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Folkrörelserna | 33 | - | restate | oldest-unverified |
| q457 | judgement | q079 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Folkrörelserna | 33 | - | restate | oldest-unverified |
| q458 | section-practice | q080 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Demokratins genombrott | 34 | - | restate | oldest-unverified |
| q459 | true-false | q080 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Demokratins genombrott | 34 | - | restate | oldest-unverified |
| q460 | false-statement | q080 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Demokratins genombrott | 34 | - | restate | oldest-unverified |
| q461 | judgement | q080 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Demokratins genombrott | 34 | - | restate | oldest-unverified |
| q462 | section-practice | q081 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Den svenska modellen | 35 | - | restate | oldest-unverified |
| q463 | true-false | q081 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Den svenska modellen | 35 | - | restate | oldest-unverified |
| q464 | false-statement | q081 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Den svenska modellen | 35 | - | restate | oldest-unverified |
| q465 | judgement | q081 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Den svenska modellen | 35 | - | restate | oldest-unverified |
| q466 | section-practice | q082 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Rekordåren | 36 | - | restate | oldest-unverified |
| q467 | true-false | q082 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Rekordåren | 36 | - | restate | oldest-unverified |
| q468 | false-statement | q082 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Rekordåren | 36 | - | restate | oldest-unverified |
| q469 | judgement | q082 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Rekordåren | 36 | - | restate | oldest-unverified |
| q470 | section-practice | q083 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sverige blir ett invandrarland | 36 | - | restate | oldest-unverified |
| q471 | true-false | q083 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sverige blir ett invandrarland | 36 | - | restate | oldest-unverified |
| q472 | false-statement | q083 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sverige blir ett invandrarland | 36 | - | restate | oldest-unverified |
| q473 | judgement | q083 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sverige blir ett invandrarland | 36 | - | restate | oldest-unverified |
| q474 | section-practice | q084 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Digital revolution och globalisering | 38 | - | restate | oldest-unverified |
| q475 | true-false | q084 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Digital revolution och globalisering | 38 | - | restate | oldest-unverified |
| q476 | false-statement | q084 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Digital revolution och globalisering | 38 | - | restate | oldest-unverified |
| q477 | judgement | q084 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Digital revolution och globalisering | 38 | - | restate | oldest-unverified |
| q478 | section-practice | q085 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Nordiskt samarbete | 39 | - | restate | oldest-unverified |
| q479 | true-false | q085 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Nordiskt samarbete | 39 | - | restate | oldest-unverified |
| q480 | false-statement | q085 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Nordiskt samarbete | 39 | - | restate | oldest-unverified |
| q481 | judgement | q085 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Nordiskt samarbete | 39 | - | restate | oldest-unverified |
| q482 | section-practice | q086 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q483 | true-false | q086 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q484 | false-statement | q086 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q485 | judgement | q086 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q486 | section-practice | q087 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q487 | true-false | q087 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q488 | false-statement | q087 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q489 | judgement | q087 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q490 | section-practice | q088 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q491 | true-false | q088 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q492 | false-statement | q088 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q493 | judgement | q088 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | - | restate | oldest-unverified |
| q494 | section-practice | q089 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Globalt samarbete | 39 | - | restate | oldest-unverified |
| q495 | true-false | q089 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Globalt samarbete | 39 | - | restate | oldest-unverified |
| q496 | false-statement | q089 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Globalt samarbete | 39 | - | restate | oldest-unverified |
| q497 | judgement | q089 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Globalt samarbete | 39 | - | restate | oldest-unverified |
| q498 | section-practice | q090 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Efter kalla krigets slut | 40 | - | restate | oldest-unverified |
| q499 | true-false | q090 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Efter kalla krigets slut | 40 | - | restate | oldest-unverified |
| q500 | false-statement | q090 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Efter kalla krigets slut | 40 | - | restate | oldest-unverified |
| q501 | judgement | q090 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Efter kalla krigets slut | 40 | - | restate | oldest-unverified |
| q502 | section-practice | q091 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Sveriges försvar | 40 | - | restate | oldest-unverified |
| q503 | true-false | q091 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Sveriges försvar | 40 | - | restate | oldest-unverified |
| q504 | false-statement | q091 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Sveriges försvar | 40 | - | restate | oldest-unverified |
| q505 | judgement | q091 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Sveriges försvar | 40 | - | restate | oldest-unverified |
| q506 | section-practice | q092 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q507 | true-false | q092 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q508 | false-statement | q092 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q509 | judgement | q092 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q510 | section-practice | q093 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q511 | true-false | q093 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q512 | false-statement | q093 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q513 | judgement | q093 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q514 | section-practice | q094 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q515 | true-false | q094 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q516 | false-statement | q094 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q517 | judgement | q094 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q518 | section-practice | q095 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q519 | true-false | q095 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q520 | false-statement | q095 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q521 | judgement | q095 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q522 | section-practice | q096 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q523 | true-false | q096 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q524 | false-statement | q096 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q525 | judgement | q096 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q526 | section-practice | q097 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nyår | 45 | - | restate | oldest-unverified |
| q527 | true-false | q097 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nyår | 45 | - | restate | oldest-unverified |
| q528 | false-statement | q097 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nyår | 45 | - | restate | oldest-unverified |
| q529 | judgement | q097 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nyår | 45 | - | restate | oldest-unverified |
| q530 | section-practice | q098 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q531 | true-false | q098 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q532 | false-statement | q098 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q533 | judgement | q098 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q534 | section-practice | q099 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | - | restate | oldest-unverified |
| q535 | true-false | q099 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | - | restate | oldest-unverified |
| q536 | false-statement | q099 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | - | restate | oldest-unverified |
| q537 | judgement | q099 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | - | restate | oldest-unverified |
| q538 | section-practice | q100 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q539 | true-false | q100 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q540 | false-statement | q100 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q541 | judgement | q100 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q542 | section-practice | q101 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | - | restate | oldest-unverified |
| q543 | true-false | q101 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | - | restate | oldest-unverified |
| q544 | false-statement | q101 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | - | restate | oldest-unverified |
| q545 | judgement | q101 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | - | restate | oldest-unverified |
| q546 | section-practice | q102 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Valborgsmässoafton | 46 | - | restate | oldest-unverified |
| q547 | true-false | q102 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Valborgsmässoafton | 46 | - | restate | oldest-unverified |
| q548 | false-statement | q102 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Valborgsmässoafton | 46 | - | restate | oldest-unverified |
| q549 | judgement | q102 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Valborgsmässoafton | 46 | - | restate | oldest-unverified |
| q550 | section-practice | q103 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Första maj | 46 | - | restate | oldest-unverified |
| q551 | true-false | q103 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Första maj | 46 | - | restate | oldest-unverified |
| q552 | false-statement | q103 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Första maj | 46 | - | restate | oldest-unverified |
| q553 | judgement | q103 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Första maj | 46 | - | restate | oldest-unverified |
| q554 | section-practice | q104 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q555 | true-false | q104 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q556 | false-statement | q104 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q557 | judgement | q104 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q558 | section-practice | q105 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q559 | true-false | q105 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q560 | false-statement | q105 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q561 | judgement | q105 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q562 | section-practice | q106 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q563 | true-false | q106 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q564 | false-statement | q106 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q565 | judgement | q106 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q566 | section-practice | q107 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q567 | true-false | q107 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q568 | false-statement | q107 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q569 | judgement | q107 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q570 | section-practice | q108 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q571 | true-false | q108 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q572 | false-statement | q108 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q573 | judgement | q108 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q574 | section-practice | q109 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q575 | true-false | q109 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q576 | false-statement | q109 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q577 | judgement | q109 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q578 | section-practice | q110 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | - | restate | oldest-unverified |
| q579 | true-false | q110 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | - | restate | oldest-unverified |
| q580 | false-statement | q110 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | - | restate | oldest-unverified |
| q581 | judgement | q110 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | - | restate | oldest-unverified |
| q582 | section-practice | q111 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q583 | true-false | q111 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q584 | false-statement | q111 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q585 | judgement | q111 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q586 | section-practice | q112 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q587 | true-false | q112 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q588 | false-statement | q112 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q589 | judgement | q112 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q590 | section-practice | q113 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q591 | true-false | q113 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q592 | false-statement | q113 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q593 | judgement | q113 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q594 | section-practice | q114 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q595 | true-false | q114 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q596 | false-statement | q114 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q597 | judgement | q114 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q598 | section-practice | q115 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q599 | true-false | q115 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q600 | false-statement | q115 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q601 | judgement | q115 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q602 | section-practice | q116 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q603 | true-false | q116 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q604 | false-statement | q116 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q605 | judgement | q116 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | - | restate | oldest-unverified |
| q606 | section-practice | q117 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q607 | true-false | q117 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q608 | false-statement | q117 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q609 | judgement | q117 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q610 | section-practice | q118 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q611 | true-false | q118 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q612 | false-statement | q118 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q613 | judgement | q118 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | - | restate | oldest-unverified |
| q614 | section-practice | q119 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q615 | true-false | q119 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q616 | false-statement | q119 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q617 | judgement | q119 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | - | restate | oldest-unverified |
| q618 | section-practice | q120 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | - | restate | oldest-unverified |
| q619 | true-false | q120 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | - | restate | oldest-unverified |
| q620 | false-statement | q120 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | - | restate | oldest-unverified |
| q621 | judgement | q120 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | - | restate | oldest-unverified |
| q622 | section-practice | q121 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q623 | true-false | q121 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q624 | false-statement | q121 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q625 | judgement | q121 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q626 | section-practice | q122 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q627 | true-false | q122 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q628 | false-statement | q122 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q629 | judgement | q122 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | - | restate | oldest-unverified |
| q630 | section-practice | q123 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q631 | true-false | q123 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q632 | false-statement | q123 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q633 | judgement | q123 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | - | restate | oldest-unverified |
| q634 | section-practice | q124 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q635 | true-false | q124 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q636 | false-statement | q124 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q637 | judgement | q124 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q638 | section-practice | q125 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | - | restate | oldest-unverified |
| q639 | true-false | q125 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | - | restate | oldest-unverified |
| q640 | false-statement | q125 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | - | restate | oldest-unverified |
| q641 | judgement | q125 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | - | restate | oldest-unverified |
| q642 | section-practice | q126 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Några traditionella högtider under året | 45 | - | restate | oldest-unverified |
| q643 | true-false | q126 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Några traditionella högtider under året | 45 | - | restate | oldest-unverified |
| q644 | false-statement | q126 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Några traditionella högtider under året | 45 | - | restate | oldest-unverified |
| q645 | judgement | q126 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Några traditionella högtider under året | 45 | - | restate | oldest-unverified |
| q646 | section-practice | q127 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q647 | true-false | q127 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q648 | false-statement | q127 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q649 | judgement | q127 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q650 | section-practice | q128 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q651 | true-false | q128 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q652 | false-statement | q128 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q653 | judgement | q128 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q654 | section-practice | q129 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q655 | true-false | q129 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q656 | false-statement | q129 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q657 | judgement | q129 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q658 | section-practice | q130 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q659 | true-false | q130 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q660 | false-statement | q130 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q661 | judgement | q130 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q662 | section-practice | q131 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | - | restate | oldest-unverified |
| q663 | true-false | q131 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | - | restate | oldest-unverified |
| q664 | false-statement | q131 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | - | restate | oldest-unverified |
| q665 | judgement | q131 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | - | restate | oldest-unverified |
| q666 | section-practice | q132 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q667 | true-false | q132 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q668 | false-statement | q132 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q669 | judgement | q132 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q670 | section-practice | q133 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q671 | true-false | q133 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q672 | false-statement | q133 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q673 | judgement | q133 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | - | restate | oldest-unverified |
| q674 | section-practice | q134 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q675 | true-false | q134 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q676 | false-statement | q134 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q677 | judgement | q134 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q678 | section-practice | q135 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q679 | true-false | q135 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q680 | false-statement | q135 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q681 | judgement | q135 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | - | restate | oldest-unverified |
| q682 | section-practice | q136 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q683 | true-false | q136 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q684 | false-statement | q136 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q685 | judgement | q136 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | - | restate | oldest-unverified |
| q686 | section-practice | q137 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q687 | true-false | q137 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q688 | false-statement | q137 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q689 | judgement | q137 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | - | restate | oldest-unverified |
| q690 | section-practice | q138 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q691 | true-false | q138 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q692 | false-statement | q138 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q693 | judgement | q138 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q694 | section-practice | q139 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q695 | true-false | q139 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q696 | false-statement | q139 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q697 | judgement | q139 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q698 | section-practice | q140 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q699 | true-false | q140 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q700 | false-statement | q140 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q701 | judgement | q140 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | - | restate | oldest-unverified |
| q702 | section-practice | q141 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q703 | true-false | q141 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q704 | false-statement | q141 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
| q705 | judgement | q141 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | - | restate | oldest-unverified |
