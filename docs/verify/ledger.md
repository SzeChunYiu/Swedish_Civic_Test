# VERIFY Ledger

Bootstrap date: 2026-05-18
Bootstrap commit: 1161847
Last inventory refresh: 2026-05-18 at 3e63c23

This ledger is the rolling CONTENT-VERIFY inventory. A `restate` status means the row is inventoried but not independently re-verified; do not treat it as accepted evidence. A future VERIFY pass must open the cited source and check fact, citation, correct answer, distractors, language naturalness, and regression before changing a row to `ok` or filing a `defect`.

Allowed statuses: `ok`, `defect`, `restate`.

## Coverage Summary

- Exported question rows inventoried: 720
- Authored source questions: 144
- Base source questions in data/questions.ts: 20
- Additional authored source questions: 124
- Generated published variants: 576
- Initial verification state: all rows are `restate` pending independent citation checks.

## Rolling Queue

| ID | Kind | Source ID | Source path | Chapter ID | UHR chapter | UHR section | Page | Last verified commit | Status | Next recheck |
|---|---|---|---|---|---|---|---:|---|---|---|
| q001 | authored-source | q001 | data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | 97f3096 | ok | rolling-source-slice |
| q002 | authored-source | q002 | data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | 97f3096 | ok | rolling-source-slice |
| q003 | authored-source | q003 | data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | 97f3096 | ok | rolling-source-slice |
| q004 | authored-source | q004 | data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | 97f3096 | ok | rolling-source-slice |
| q005 | authored-source | q005 | data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | 97f3096 | ok | rolling-source-slice |
| q006 | authored-source | q006 | data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | 97f3096 | ok | rolling-source-slice |
| q007 | authored-source | q007 | data/questions.ts | ch01 | Landet Sverige | Fjäll | 6 | 97f3096 | ok | rolling-source-slice |
| q008 | authored-source | q008 | data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | 97f3096 | ok | rolling-source-slice |
| q009 | authored-source | q009 | data/questions.ts | ch01 | Landet Sverige | Befolkning | 7 | 97f3096 | ok | rolling-source-slice |
| q010 | authored-source | q010 | data/questions.ts | ch01 | Landet Sverige | Naturresurser | 7 | 97f3096 | ok | rolling-source-slice |
| q011 | authored-source | q011 | data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | 97f3096 | ok | rolling-source-slice |
| q012 | authored-source | q012 | data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | 97f3096 | ok | rolling-source-slice |
| q013 | authored-source | q013 | data/questions.ts | ch02 | Sveriges demokratiska system | En stark demokrati | 10 | 97f3096 | ok | rolling-source-slice |
| q014 | authored-source | q014 | data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | 97f3096 | ok | rolling-source-slice |
| q015 | authored-source | q015 | data/questions.ts | ch02 | Sveriges demokratiska system | Hot mot demokratin | 11 | 97f3096 | ok | rolling-source-slice |
| q016 | authored-source | q016 | data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 97f3096 | ok | rolling-source-slice |
| q017 | authored-source | q017 | data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 97f3096 | ok | rolling-source-slice |
| q018 | authored-source | q018 | data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | d468f31 | ok | recent-data-regression |
| q019 | authored-source | q019 | data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | 97f3096 | ok | rolling-source-slice |
| q020 | authored-source | q020 | data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | 97f3096 | ok | rolling-source-slice |
| q021 | authored-source | q021 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Landet styrs på olika nivåer | 12 | 97f3096 | ok | rolling-source-slice |
| q022 | authored-source | q022 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 97f3096 | ok | rolling-source-slice |
| q023 | authored-source | q023 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 97f3096 | ok | rolling-source-slice |
| q024 | authored-source | q024 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Myndigheter | 13 | 97f3096 | ok | rolling-source-slice |
| q025 | authored-source | q025 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Regioner och kommuner | 13 | 97f3096 | ok | rolling-source-slice |
| q026 | authored-source | q026 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Kommunernas ansvar | 13 | 97f3096 | ok | rolling-source-slice |
| q027 | authored-source | q027 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Sveriges statsskick | 13 | 97f3096 | ok | rolling-source-slice |
| q028 | authored-source | q028 | data/additionalQuestions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 97f3096 | ok | rolling-source-slice |
| q029 | authored-source | q029 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | 97f3096 | ok | rolling-source-slice |
| q030 | authored-source | q030 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | 97f3096 | ok | rolling-source-slice |
| q031 | authored-source | q031 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | 97f3096 | ok | rolling-source-slice |
| q032 | authored-source | q032 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Så här går det till att rösta | 14 | 97f3096 | ok | rolling-source-slice |
| q033 | authored-source | q033 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Politiska partier | 15 | 97f3096 | ok | rolling-source-slice |
| q034 | authored-source | q034 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | 97f3096 | ok | rolling-source-slice |
| q035 | authored-source | q035 | data/additionalQuestions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | 97f3096 | ok | rolling-source-slice |
| q036 | authored-source | q036 | data/additionalQuestions.ts | ch05 | Lag och rätt | Grundlagarna | 16 | 97f3096 | ok | rolling-source-slice |
| q037 | authored-source | q037 | data/additionalQuestions.ts | ch05 | Lag och rätt | Regeringsformen | 16 | 97f3096 | ok | rolling-source-slice |
| q038 | authored-source | q038 | data/additionalQuestions.ts | ch05 | Lag och rätt | Successionsordningen | 16 | 97f3096 | ok | rolling-source-slice |
| q039 | authored-source | q039 | data/additionalQuestions.ts | ch05 | Lag och rätt | Allemansrätten | 17 | 97f3096 | ok | rolling-source-slice |
| q040 | authored-source | q040 | data/additionalQuestions.ts | ch05 | Lag och rätt | Rättsväsendet | 17 | 97f3096 | ok | rolling-source-slice |
| q041 | authored-source | q041 | data/additionalQuestions.ts | ch05 | Lag och rätt | Rättssäkerhet | 17 | 97f3096 | ok | rolling-source-slice |
| q042 | authored-source | q042 | data/additionalQuestions.ts | ch05 | Lag och rätt | Domstolar | 18 | 97f3096 | ok | rolling-source-slice |
| q043 | authored-source | q043 | data/additionalQuestions.ts | ch05 | Lag och rätt | Polisen | 18 | 97f3096 | ok | rolling-source-slice |
| q044 | authored-source | q044 | data/additionalQuestions.ts | ch05 | Lag och rätt | Straffmyndighet och belastningsregister | 19 | 97f3096 | ok | rolling-source-slice |
| q045 | authored-source | q045 | data/additionalQuestions.ts | ch06 | Mediernas roll | Fria medier | 20 | 97f3096 | ok | rolling-source-slice |
| q046 | authored-source | q046 | data/additionalQuestions.ts | ch06 | Mediernas roll | Fria medier | 20 | 97f3096 | ok | rolling-source-slice |
| q047 | authored-source | q047 | data/additionalQuestions.ts | ch06 | Mediernas roll | Fria medier | 20 | 97f3096 | ok | rolling-source-slice |
| q048 | authored-source | q048 | data/additionalQuestions.ts | ch06 | Mediernas roll | Public service | 21 | 97f3096 | ok | rolling-source-slice |
| q049 | authored-source | q049 | data/additionalQuestions.ts | ch06 | Mediernas roll | Public service | 21 | 97f3096 | ok | rolling-source-slice |
| q050 | authored-source | q050 | data/additionalQuestions.ts | ch06 | Mediernas roll | Källkritik | 21 | 97f3096 | ok | rolling-source-slice |
| q051 | authored-source | q051 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Mänskliga rättigheter gäller alla | 22 | ca00008 | ok | rolling-source-slice |
| q052 | authored-source | q052 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | FN:s förklaring om de mänskliga rättigheterna | 22 | ca00008 | ok | rolling-source-slice |
| q053 | authored-source | q053 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Jämställdhet mellan könen | 23 | ca00008 | ok | rolling-source-slice |
| q054 | authored-source | q054 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Könsrelaterat våld och förtryck | 23 | ca00008 | ok | rolling-source-slice |
| q055 | authored-source | q055 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Sexköpslagen | 24 | ca00008 | ok | rolling-source-slice |
| q056 | authored-source | q056 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 24 | ca00008 | ok | rolling-source-slice |
| q057 | authored-source | q057 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 25 | ca00008 | ok | rolling-source-slice |
| q058 | authored-source | q058 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | ca00008 | ok | rolling-source-slice |
| q059 | authored-source | q059 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | ca00008 | ok | rolling-source-slice |
| q060 | authored-source | q060 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Hbtqi-personer | 26 | ca00008 | ok | rolling-source-slice |
| q061 | authored-source | q061 | data/additionalQuestions.ts | ch07 | Mänskliga rättigheter | Arbetet mot diskriminering | 26 | ca00008 | ok | rolling-source-slice |
| q062 | authored-source | q062 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | ca00008 | ok | rolling-source-slice |
| q063 | authored-source | q063 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | ca00008 | ok | rolling-source-slice |
| q064 | authored-source | q064 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | ca00008 | ok | rolling-source-slice |
| q065 | authored-source | q065 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | ca00008 | ok | rolling-source-slice |
| q066 | authored-source | q066 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | Lagar och regler på arbetsmarknaden | 29 | ca00008 | ok | rolling-source-slice |
| q067 | authored-source | q067 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | A-kassan | 29 | ca00008 | ok | rolling-source-slice |
| q068 | authored-source | q068 | data/additionalQuestions.ts | ch08 | Arbetsmarknad och privatekonomi | Privatekonomi i Sverige | 29 | ca00008 | ok | rolling-source-slice |
| q069 | authored-source | q069 | data/additionalQuestions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | ca00008 | ok | rolling-source-slice |
| q070 | authored-source | q070 | data/additionalQuestions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | d468f31 | ok | recent-data-regression |
| q071 | authored-source | q071 | data/additionalQuestions.ts | ch09 | Välfärdssamhället | Statligt finansierad välfärd | 30 | ca00008 | ok | rolling-source-slice |
| q072 | authored-source | q072 | data/additionalQuestions.ts | ch09 | Välfärdssamhället | Regionerna ansvarar för sjukvården | 30 | ca00008 | ok | rolling-source-slice |
| q073 | authored-source | q073 | data/additionalQuestions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | ca00008 | ok | rolling-source-slice |
| q074 | authored-source | q074 | data/additionalQuestions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | ca00008 | ok | rolling-source-slice |
| q075 | authored-source | q075 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Från jordbrukssamhälle till industrisamhälle | 32 | ca00008 | ok | rolling-source-slice |
| q076 | authored-source | q076 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | ca00008 | ok | rolling-source-slice |
| q077 | authored-source | q077 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | ca00008 | ok | rolling-source-slice |
| q078 | authored-source | q078 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Sveriges väg till demokrati | 33 | ca00008 | ok | rolling-source-slice |
| q079 | authored-source | q079 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Folkrörelserna | 33 | ca00008 | ok | rolling-source-slice |
| q080 | authored-source | q080 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Demokratins genombrott | 34 | ca00008 | ok | rolling-source-slice |
| q081 | authored-source | q081 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Den svenska modellen | 35 | ca00008 | ok | rolling-source-slice |
| q082 | authored-source | q082 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Rekordåren | 36 | ca00008 | ok | rolling-source-slice |
| q083 | authored-source | q083 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Sverige blir ett invandrarland | 36 | ca00008 | ok | rolling-source-slice |
| q084 | authored-source | q084 | data/additionalQuestions.ts | ch10 | Sveriges moderna historia | Digital revolution och globalisering | 38 | ca00008 | ok | rolling-source-slice |
| q085 | authored-source | q085 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | Nordiskt samarbete | 39 | ca00008 | ok | rolling-source-slice |
| q086 | authored-source | q086 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | ca00008 | ok | rolling-source-slice |
| q087 | authored-source | q087 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | ca00008 | ok | rolling-source-slice |
| q088 | authored-source | q088 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | ca00008 | ok | rolling-source-slice |
| q089 | authored-source | q089 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | Globalt samarbete | 39 | ca00008 | ok | rolling-source-slice |
| q090 | authored-source | q090 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | Efter kalla krigets slut | 40 | ca00008 | ok | rolling-source-slice |
| q091 | authored-source | q091 | data/additionalQuestions.ts | ch11 | Sverige och omvärlden | Sveriges försvar | 40 | ca00008 | ok | rolling-source-slice |
| q092 | authored-source | q092 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | ca00008 | ok | rolling-source-slice |
| q093 | authored-source | q093 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | ca00008 | ok | rolling-source-slice |
| q094 | authored-source | q094 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | ca00008 | ok | rolling-source-slice |
| q095 | authored-source | q095 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | ca00008 | ok | rolling-source-slice |
| q096 | authored-source | q096 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | ca00008 | ok | rolling-source-slice |
| q097 | authored-source | q097 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Nyår | 45 | ca00008 | ok | rolling-source-slice |
| q098 | authored-source | q098 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | ca00008 | ok | rolling-source-slice |
| q099 | authored-source | q099 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | ca00008 | ok | rolling-source-slice |
| q100 | authored-source | q100 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Lucia | 47 | ca00008 | ok | rolling-source-slice |
| q101 | authored-source | q101 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Påsk | 45 | 998185a | ok | rolling-source-slice |
| q102 | authored-source | q102 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Valborgsmässoafton | 46 | 998185a | ok | rolling-source-slice |
| q103 | authored-source | q103 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Första maj | 46 | 998185a | ok | rolling-source-slice |
| q104 | authored-source | q104 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | 998185a | ok | rolling-source-slice |
| q105 | authored-source | q105 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Advent | 47 | 998185a | ok | rolling-source-slice |
| q106 | authored-source | q106 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Jul | 47 | 998185a | ok | rolling-source-slice |
| q107 | authored-source | q107 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | 998185a | ok | rolling-source-slice |
| q108 | authored-source | q108 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | d468f31 | ok | recent-data-regression |
| q109 | authored-source | q109 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | d468f31 | ok | recent-data-regression |
| q110 | authored-source | q110 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | 998185a | ok | rolling-source-slice |
| q111 | authored-source | q111 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 998185a | ok | rolling-source-slice |
| q112 | authored-source | q112 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 998185a | ok | rolling-source-slice |
| q113 | authored-source | q113 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | 998185a | ok | rolling-source-slice |
| q114 | authored-source | q114 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | d468f31 | ok | recent-data-regression |
| q115 | authored-source | q115 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 998185a | ok | rolling-source-slice |
| q116 | authored-source | q116 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 998185a | ok | rolling-source-slice |
| q117 | authored-source | q117 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | 998185a | ok | rolling-source-slice |
| q118 | authored-source | q118 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | 998185a | ok | rolling-source-slice |
| q119 | authored-source | q119 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | 998185a | ok | rolling-source-slice |
| q120 | authored-source | q120 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | 998185a | ok | rolling-source-slice |
| q121 | authored-source | q121 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 998185a | ok | rolling-source-slice |
| q122 | authored-source | q122 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 998185a | ok | rolling-source-slice |
| q123 | authored-source | q123 | data/additionalQuestions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | d468f31 | ok | recent-data-regression |
| q124 | authored-source | q124 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | d468f31 | ok | recent-data-regression |
| q125 | authored-source | q125 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | 998185a | ok | rolling-source-slice |
| q126 | authored-source | q126 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Några traditionella högtider under året | 45 | 998185a | ok | rolling-source-slice |
| q127 | authored-source | q127 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | 998185a | ok | rolling-source-slice |
| q128 | authored-source | q128 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | 998185a | ok | rolling-source-slice |
| q129 | authored-source | q129 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Lucia | 47 | 998185a | ok | rolling-source-slice |
| q130 | authored-source | q130 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Jul | 47 | 998185a | ok | rolling-source-slice |
| q131 | authored-source | q131 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Påsk | 45 | 998185a | ok | rolling-source-slice |
| q132 | authored-source | q132 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Advent | 47 | 998185a | ok | rolling-source-slice |
| q133 | authored-source | q133 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | 998185a | ok | rolling-source-slice |
| q134 | authored-source | q134 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | 998185a | ok | rolling-source-slice |
| q135 | authored-source | q135 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Advent | 47 | 998185a | ok | rolling-source-slice |
| q136 | authored-source | q136 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | 998185a | ok | rolling-source-slice |
| q137 | authored-source | q137 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | 998185a | ok | rolling-source-slice |
| q138 | authored-source | q138 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Jul | 47 | 998185a | ok | rolling-source-slice |
| q139 | authored-source | q139 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Jul | 47 | 998185a | ok | rolling-source-slice |
| q140 | authored-source | q140 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Jul | 47 | 998185a | ok | rolling-source-slice |
| q141 | authored-source | q141 | data/additionalQuestions.ts | ch13 | Traditioner och högtider | Lucia | 47 | 998185a | ok | rolling-source-slice |
| q142 | authored-source | q142 | data/additionalQuestions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | d468f31 | ok | recent-data-regression |
| q143 | authored-source | q143 | data/additionalQuestions.ts | ch01 | Landet Sverige | Sveriges indelning | 6 | d468f31 | ok | recent-data-regression |
| q144 | authored-source | q144 | data/additionalQuestions.ts | ch01 | Landet Sverige | Sveriges indelning | 6 | d468f31 | ok | recent-data-regression |
| q145 | section-practice | q001 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q146 | true-false | q001 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q147 | false-statement | q001 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q148 | judgement | q001 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q149 | section-practice | q002 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q150 | true-false | q002 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q151 | false-statement | q002 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q152 | judgement | q002 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q153 | section-practice | q003 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q154 | true-false | q003 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q155 | false-statement | q003 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q156 | judgement | q003 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q157 | section-practice | q004 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q158 | true-false | q004 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q159 | false-statement | q004 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q160 | judgement | q004 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q161 | section-practice | q005 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q162 | true-false | q005 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q163 | false-statement | q005 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q164 | judgement | q005 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q165 | section-practice | q006 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q166 | true-false | q006 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q167 | false-statement | q006 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q168 | judgement | q006 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Geografi, klimat och natur | 5 | d96376d | ok | rolling-source-slice |
| q169 | section-practice | q007 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Fjäll | 6 | d96376d | ok | rolling-source-slice |
| q170 | true-false | q007 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Fjäll | 6 | d96376d | ok | rolling-source-slice |
| q171 | false-statement | q007 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Fjäll | 6 | d96376d | ok | rolling-source-slice |
| q172 | judgement | q007 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Fjäll | 6 | d96376d | ok | rolling-source-slice |
| q173 | section-practice | q008 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | d96376d | ok | rolling-source-slice |
| q174 | true-false | q008 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | d96376d | ok | rolling-source-slice |
| q175 | false-statement | q008 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | d96376d | ok | rolling-source-slice |
| q176 | judgement | q008 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | d96376d | ok | rolling-source-slice |
| q177 | section-practice | q009 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Befolkning | 7 | d96376d | ok | rolling-source-slice |
| q178 | true-false | q009 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Befolkning | 7 | d96376d | ok | rolling-source-slice |
| q179 | false-statement | q009 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Befolkning | 7 | d96376d | ok | rolling-source-slice |
| q180 | judgement | q009 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Befolkning | 7 | d96376d | ok | rolling-source-slice |
| q181 | section-practice | q010 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Naturresurser | 7 | d96376d | ok | rolling-source-slice |
| q182 | true-false | q010 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Naturresurser | 7 | d96376d | ok | rolling-source-slice |
| q183 | false-statement | q010 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Naturresurser | 7 | d96376d | ok | rolling-source-slice |
| q184 | judgement | q010 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Naturresurser | 7 | d96376d | ok | rolling-source-slice |
| q185 | section-practice | q011 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | d96376d | ok | rolling-source-slice |
| q186 | true-false | q011 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | d96376d | ok | rolling-source-slice |
| q187 | false-statement | q011 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | d96376d | ok | rolling-source-slice |
| q188 | judgement | q011 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | d96376d | ok | rolling-source-slice |
| q189 | section-practice | q012 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | d96376d | ok | rolling-source-slice |
| q190 | true-false | q012 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | d96376d | ok | rolling-source-slice |
| q191 | false-statement | q012 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | d96376d | ok | rolling-source-slice |
| q192 | judgement | q012 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | d96376d | ok | rolling-source-slice |
| q193 | section-practice | q013 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | En stark demokrati | 10 | d96376d | ok | rolling-source-slice |
| q194 | true-false | q013 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | En stark demokrati | 10 | d96376d | ok | rolling-source-slice |
| q195 | false-statement | q013 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | En stark demokrati | 10 | d96376d | ok | rolling-source-slice |
| q196 | judgement | q013 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | En stark demokrati | 10 | d96376d | ok | rolling-source-slice |
| q197 | section-practice | q014 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | d96376d | ok | rolling-source-slice |
| q198 | true-false | q014 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | d96376d | ok | rolling-source-slice |
| q199 | false-statement | q014 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | d96376d | ok | rolling-source-slice |
| q200 | judgement | q014 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Demokrati betyder folkstyre | 10 | d96376d | ok | rolling-source-slice |
| q201 | section-practice | q015 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Hot mot demokratin | 11 | 719cb3b | ok | rolling-source-slice |
| q202 | true-false | q015 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Hot mot demokratin | 11 | 719cb3b | ok | rolling-source-slice |
| q203 | false-statement | q015 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Hot mot demokratin | 11 | 719cb3b | ok | rolling-source-slice |
| q204 | judgement | q015 | lib/content/derivedQuestions.ts -> data/questions.ts | ch02 | Sveriges demokratiska system | Hot mot demokratin | 11 | 719cb3b | defect | queued-data-integrity-single-choice-filler-options |
| q205 | section-practice | q016 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q206 | true-false | q016 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q207 | false-statement | q016 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q208 | judgement | q016 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | defect | queued-data-integrity-single-choice-filler-options |
| q209 | section-practice | q017 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q210 | true-false | q017 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q211 | false-statement | q017 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q212 | judgement | q017 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | defect | queued-data-integrity-single-choice-filler-options |
| q213 | section-practice | q018 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q214 | true-false | q018 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q215 | false-statement | q018 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q216 | judgement | q018 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | defect | queued-data-integrity-single-choice-filler-options |
| q217 | section-practice | q019 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | 719cb3b | ok | rolling-source-slice |
| q218 | true-false | q019 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | 719cb3b | ok | rolling-source-slice |
| q219 | false-statement | q019 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | 719cb3b | ok | rolling-source-slice |
| q220 | judgement | q019 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | 719cb3b | defect | queued-data-integrity-single-choice-filler-options |
| q221 | section-practice | q020 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | 719cb3b | ok | rolling-source-slice |
| q222 | true-false | q020 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | 719cb3b | ok | rolling-source-slice |
| q223 | false-statement | q020 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | 719cb3b | ok | rolling-source-slice |
| q224 | judgement | q020 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | 719cb3b | defect | queued-data-integrity-single-choice-filler-options |
| q225 | section-practice | q021 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Landet styrs på olika nivåer | 12 | 719cb3b | ok | rolling-source-slice |
| q226 | true-false | q021 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Landet styrs på olika nivåer | 12 | 719cb3b | ok | rolling-source-slice |
| q227 | false-statement | q021 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Landet styrs på olika nivåer | 12 | 719cb3b | ok | rolling-source-slice |
| q228 | judgement | q021 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Landet styrs på olika nivåer | 12 | 719cb3b | defect | queued-data-integrity-single-choice-filler-options |
| q229 | section-practice | q022 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q230 | true-false | q022 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q231 | false-statement | q022 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q232 | judgement | q022 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | defect | queued-data-integrity-single-choice-filler-options |
| q233 | section-practice | q023 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | defect | queued-data-integrity-judgement-truefalse-filler-all |
| q234 | true-false | q023 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q235 | false-statement | q023 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | ok | rolling-source-slice |
| q236 | judgement | q023 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | 719cb3b | defect | queued-data-integrity-judgement-truefalse-filler-all |
| q237 | section-practice | q024 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Myndigheter | 13 | 719cb3b | ok | rolling-source-slice |
| q238 | true-false | q024 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Myndigheter | 13 | 719cb3b | ok | rolling-source-slice |
| q239 | false-statement | q024 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Myndigheter | 13 | 719cb3b | ok | rolling-source-slice |
| q240 | judgement | q024 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Myndigheter | 13 | 719cb3b | defect | queued-data-integrity-single-choice-filler-options |
| q241 | section-practice | q025 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Regioner och kommuner | 13 | 719cb3b | ok | rolling-source-slice |
| q242 | true-false | q025 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Regioner och kommuner | 13 | 719cb3b | ok | rolling-source-slice |
| q243 | false-statement | q025 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Regioner och kommuner | 13 | 719cb3b | ok | rolling-source-slice |
| q244 | judgement | q025 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Regioner och kommuner | 13 | 719cb3b | defect | queued-data-integrity-single-choice-filler-options |
| q245 | section-practice | q026 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Kommunernas ansvar | 13 | 719cb3b | ok | rolling-source-slice |
| q246 | true-false | q026 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Kommunernas ansvar | 13 | 719cb3b | ok | rolling-source-slice |
| q247 | false-statement | q026 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Kommunernas ansvar | 13 | 719cb3b | ok | rolling-source-slice |
| q248 | judgement | q026 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Kommunernas ansvar | 13 | 719cb3b | defect | queued-data-integrity-single-choice-filler-options |
| q249 | section-practice | q027 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Sveriges statsskick | 13 | 719cb3b | ok | rolling-source-slice |
| q250 | true-false | q027 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Sveriges statsskick | 13 | 719cb3b | ok | rolling-source-slice |
| q251 | false-statement | q027 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Sveriges statsskick | 13 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q252 | judgement | q027 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Sveriges statsskick | 13 | b8e66f7 | ok | rolling-source-slice |
| q253 | section-practice | q028 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | b8e66f7 | ok | rolling-source-slice |
| q254 | true-false | q028 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q255 | false-statement | q028 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | b8e66f7 | defect | queued-data-integrity-false-explanation+tf-prefix |
| q256 | judgement | q028 | lib/content/derivedQuestions.ts -> data/questions.ts | ch03 | Så här styrs Sverige | Staten | 12 | b8e66f7 | ok | rolling-source-slice |
| q257 | section-practice | q029 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | b8e66f7 | ok | rolling-source-slice |
| q258 | true-false | q029 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q259 | false-statement | q029 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q260 | judgement | q029 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | b8e66f7 | ok | rolling-source-slice |
| q261 | section-practice | q030 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | b8e66f7 | ok | rolling-source-slice |
| q262 | true-false | q030 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q263 | false-statement | q030 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q264 | judgement | q030 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Val och röstning | 14 | b8e66f7 | ok | rolling-source-slice |
| q265 | section-practice | q031 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | b8e66f7 | ok | rolling-source-slice |
| q266 | true-false | q031 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q267 | false-statement | q031 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q268 | judgement | q031 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Folkomröstningar | 14 | b8e66f7 | ok | rolling-source-slice |
| q269 | section-practice | q032 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Så här går det till att rösta | 14 | b8e66f7 | ok | rolling-source-slice |
| q270 | true-false | q032 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Så här går det till att rösta | 14 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q271 | false-statement | q032 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Så här går det till att rösta | 14 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q272 | judgement | q032 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Så här går det till att rösta | 14 | b8e66f7 | ok | rolling-source-slice |
| q273 | section-practice | q033 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Politiska partier | 15 | b8e66f7 | ok | rolling-source-slice |
| q274 | true-false | q033 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Politiska partier | 15 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q275 | false-statement | q033 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Politiska partier | 15 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q276 | judgement | q033 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Politiska partier | 15 | b8e66f7 | ok | rolling-source-slice |
| q277 | section-practice | q034 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | b8e66f7 | ok | rolling-source-slice |
| q278 | true-false | q034 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q279 | false-statement | q034 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q280 | judgement | q034 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | b8e66f7 | ok | rolling-source-slice |
| q281 | section-practice | q035 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | b8e66f7 | ok | rolling-source-slice |
| q282 | true-false | q035 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q283 | false-statement | q035 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q284 | judgement | q035 | lib/content/derivedQuestions.ts -> data/questions.ts | ch04 | Politiska val och partier | Proportionella val | 15 | b8e66f7 | ok | rolling-source-slice |
| q285 | section-practice | q036 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Grundlagarna | 16 | b8e66f7 | ok | rolling-source-slice |
| q286 | true-false | q036 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Grundlagarna | 16 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q287 | false-statement | q036 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Grundlagarna | 16 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q288 | judgement | q036 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Grundlagarna | 16 | b8e66f7 | ok | rolling-source-slice |
| q289 | section-practice | q037 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Regeringsformen | 16 | b8e66f7 | ok | rolling-source-slice |
| q290 | true-false | q037 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Regeringsformen | 16 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q291 | false-statement | q037 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Regeringsformen | 16 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q292 | judgement | q037 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Regeringsformen | 16 | b8e66f7 | ok | rolling-source-slice |
| q293 | section-practice | q038 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Successionsordningen | 16 | b8e66f7 | ok | rolling-source-slice |
| q294 | true-false | q038 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Successionsordningen | 16 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q295 | false-statement | q038 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Successionsordningen | 16 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q296 | judgement | q038 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Successionsordningen | 16 | b8e66f7 | ok | rolling-source-slice |
| q297 | section-practice | q039 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Allemansrätten | 17 | b8e66f7 | ok | rolling-source-slice |
| q298 | true-false | q039 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Allemansrätten | 17 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q299 | false-statement | q039 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Allemansrätten | 17 | b8e66f7 | defect | queued-data-integrity-tf-prefix-surface |
| q300 | judgement | q039 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Allemansrätten | 17 | b8e66f7 | ok | rolling-source-slice |
| q301 | section-practice | q040 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättsväsendet | 17 | 8bb2ccf | ok | rolling-source-slice |
| q302 | true-false | q040 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättsväsendet | 17 | 8bb2ccf | ok | rolling-source-slice |
| q303 | false-statement | q040 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättsväsendet | 17 | 8bb2ccf | ok | rolling-source-slice |
| q304 | judgement | q040 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättsväsendet | 17 | 8bb2ccf | ok | rolling-source-slice |
| q305 | section-practice | q041 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättssäkerhet | 17 | 8bb2ccf | ok | rolling-source-slice |
| q306 | true-false | q041 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättssäkerhet | 17 | 8bb2ccf | ok | rolling-source-slice |
| q307 | false-statement | q041 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättssäkerhet | 17 | 8bb2ccf | ok | rolling-source-slice |
| q308 | judgement | q041 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Rättssäkerhet | 17 | 8bb2ccf | ok | rolling-source-slice |
| q309 | section-practice | q042 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Domstolar | 18 | 8bb2ccf | ok | rolling-source-slice |
| q310 | true-false | q042 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Domstolar | 18 | 8bb2ccf | ok | rolling-source-slice |
| q311 | false-statement | q042 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Domstolar | 18 | 8bb2ccf | ok | rolling-source-slice |
| q312 | judgement | q042 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Domstolar | 18 | 8bb2ccf | ok | rolling-source-slice |
| q313 | section-practice | q043 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Polisen | 18 | 8bb2ccf | ok | rolling-source-slice |
| q314 | true-false | q043 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Polisen | 18 | 8bb2ccf | ok | rolling-source-slice |
| q315 | false-statement | q043 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Polisen | 18 | 8bb2ccf | ok | rolling-source-slice |
| q316 | judgement | q043 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Polisen | 18 | 8bb2ccf | ok | rolling-source-slice |
| q317 | section-practice | q044 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Straffmyndighet och belastningsregister | 19 | 8bb2ccf | ok | rolling-source-slice |
| q318 | true-false | q044 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Straffmyndighet och belastningsregister | 19 | 8bb2ccf | defect | queued-data-integrity-residual-grammar |
| q319 | false-statement | q044 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Straffmyndighet och belastningsregister | 19 | 8bb2ccf | defect | queued-data-integrity-residual-grammar |
| q320 | judgement | q044 | lib/content/derivedQuestions.ts -> data/questions.ts | ch05 | Lag och rätt | Straffmyndighet och belastningsregister | 19 | 8bb2ccf | ok | rolling-source-slice |
| q321 | section-practice | q045 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | 8bb2ccf | ok | rolling-source-slice |
| q322 | true-false | q045 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | 8bb2ccf | ok | rolling-source-slice |
| q323 | false-statement | q045 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | 8bb2ccf | ok | rolling-source-slice |
| q324 | judgement | q045 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | 8bb2ccf | ok | rolling-source-slice |
| q325 | section-practice | q046 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | 8bb2ccf | ok | rolling-source-slice |
| q326 | true-false | q046 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | 8bb2ccf | ok | rolling-source-slice |
| q327 | false-statement | q046 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | 8bb2ccf | ok | rolling-source-slice |
| q328 | judgement | q046 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | 8bb2ccf | ok | rolling-source-slice |
| q329 | section-practice | q047 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | 8bb2ccf | ok | rolling-source-slice |
| q330 | true-false | q047 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | 8bb2ccf | ok | rolling-source-slice |
| q331 | false-statement | q047 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | 8bb2ccf | defect | queued-data-integrity-false-explanation |
| q332 | judgement | q047 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Fria medier | 20 | 8bb2ccf | ok | rolling-source-slice |
| q333 | section-practice | q048 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | 8bb2ccf | ok | rolling-source-slice |
| q334 | true-false | q048 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | 8bb2ccf | ok | rolling-source-slice |
| q335 | false-statement | q048 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | 8bb2ccf | ok | rolling-source-slice |
| q336 | judgement | q048 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | 8bb2ccf | ok | rolling-source-slice |
| q337 | section-practice | q049 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | 8bb2ccf | ok | rolling-source-slice |
| q338 | true-false | q049 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | 8bb2ccf | ok | rolling-source-slice |
| q339 | false-statement | q049 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | 8bb2ccf | defect | queued-data-integrity-false-explanation |
| q340 | judgement | q049 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Public service | 21 | 8bb2ccf | ok | rolling-source-slice |
| q341 | section-practice | q050 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Källkritik | 21 | 8bb2ccf | ok | rolling-source-slice |
| q342 | true-false | q050 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Källkritik | 21 | 8bb2ccf | ok | rolling-source-slice |
| q343 | false-statement | q050 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Källkritik | 21 | 8bb2ccf | ok | rolling-source-slice |
| q344 | judgement | q050 | lib/content/derivedQuestions.ts -> data/questions.ts | ch06 | Mediernas roll | Källkritik | 21 | 8bb2ccf | ok | rolling-source-slice |
| q345 | section-practice | q051 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Mänskliga rättigheter gäller alla | 22 | 8bb2ccf | ok | rolling-source-slice |
| q346 | true-false | q051 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Mänskliga rättigheter gäller alla | 22 | 8bb2ccf | defect | queued-data-integrity-residual-grammar |
| q347 | false-statement | q051 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Mänskliga rättigheter gäller alla | 22 | 8bb2ccf | defect | queued-data-integrity-residual-grammar |
| q348 | judgement | q051 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Mänskliga rättigheter gäller alla | 22 | 8bb2ccf | ok | rolling-source-slice |
| q349 | section-practice | q052 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | FN:s förklaring om de mänskliga rättigheterna | 22 | 8bb2ccf | ok | rolling-source-slice |
| q350 | true-false | q052 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | FN:s förklaring om de mänskliga rättigheterna | 22 | 8bb2ccf | defect | queued-data-integrity-residual-grammar |
| q351 | false-statement | q052 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | FN:s förklaring om de mänskliga rättigheterna | 22 | 120d440 | ok | rolling-source-slice |
| q352 | judgement | q052 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | FN:s förklaring om de mänskliga rättigheterna | 22 | 120d440 | ok | rolling-source-slice |
| q353 | section-practice | q053 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Jämställdhet mellan könen | 23 | 120d440 | ok | rolling-source-slice |
| q354 | true-false | q053 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Jämställdhet mellan könen | 23 | 120d440 | ok | rolling-source-slice |
| q355 | false-statement | q053 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Jämställdhet mellan könen | 23 | 120d440 | ok | rolling-source-slice |
| q356 | judgement | q053 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Jämställdhet mellan könen | 23 | 120d440 | ok | rolling-source-slice |
| q357 | section-practice | q054 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Könsrelaterat våld och förtryck | 23 | 120d440 | ok | rolling-source-slice |
| q358 | true-false | q054 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Könsrelaterat våld och förtryck | 23 | 120d440 | defect | queued-data-integrity-standalone-stem |
| q359 | false-statement | q054 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Könsrelaterat våld och förtryck | 23 | 120d440 | defect | queued-data-integrity-standalone-stem |
| q360 | judgement | q054 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Könsrelaterat våld och förtryck | 23 | 120d440 | ok | rolling-source-slice |
| q361 | section-practice | q055 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Sexköpslagen | 24 | 120d440 | ok | rolling-source-slice |
| q362 | true-false | q055 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Sexköpslagen | 24 | 120d440 | ok | rolling-source-slice |
| q363 | false-statement | q055 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Sexköpslagen | 24 | 120d440 | ok | rolling-source-slice |
| q364 | judgement | q055 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Sexköpslagen | 24 | 120d440 | ok | rolling-source-slice |
| q365 | section-practice | q056 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 24 | 120d440 | ok | rolling-source-slice |
| q366 | true-false | q056 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 24 | 120d440 | ok | rolling-source-slice |
| q367 | false-statement | q056 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 24 | 120d440 | ok | rolling-source-slice |
| q368 | judgement | q056 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 24 | 120d440 | ok | rolling-source-slice |
| q369 | section-practice | q057 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 25 | 120d440 | ok | rolling-source-slice |
| q370 | true-false | q057 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 25 | 120d440 | ok | rolling-source-slice |
| q371 | false-statement | q057 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 25 | 120d440 | defect | queued-data-integrity-answer-ambiguity |
| q372 | judgement | q057 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Barns rättigheter | 25 | 120d440 | ok | rolling-source-slice |
| q373 | section-practice | q058 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | 120d440 | ok | rolling-source-slice |
| q374 | true-false | q058 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | 120d440 | defect | queued-data-integrity-sv-naturalness |
| q375 | false-statement | q058 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | 120d440 | defect | queued-data-integrity-sv-naturalness |
| q376 | judgement | q058 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | 120d440 | ok | rolling-source-slice |
| q377 | section-practice | q059 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | 120d440 | ok | rolling-source-slice |
| q378 | true-false | q059 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | 120d440 | ok | rolling-source-slice |
| q379 | false-statement | q059 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | 120d440 | ok | rolling-source-slice |
| q380 | judgement | q059 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Nationella minoriteter och urfolk | 25 | 120d440 | ok | rolling-source-slice |
| q381 | section-practice | q060 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Hbtqi-personer | 26 | 120d440 | ok | rolling-source-slice |
| q382 | true-false | q060 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Hbtqi-personer | 26 | 120d440 | ok | rolling-source-slice |
| q383 | false-statement | q060 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Hbtqi-personer | 26 | 120d440 | ok | rolling-source-slice |
| q384 | judgement | q060 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Hbtqi-personer | 26 | 120d440 | ok | rolling-source-slice |
| q385 | section-practice | q061 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Arbetet mot diskriminering | 26 | 120d440 | ok | rolling-source-slice |
| q386 | true-false | q061 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Arbetet mot diskriminering | 26 | 120d440 | ok | rolling-source-slice |
| q387 | false-statement | q061 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Arbetet mot diskriminering | 26 | 120d440 | ok | rolling-source-slice |
| q388 | judgement | q061 | lib/content/derivedQuestions.ts -> data/questions.ts | ch07 | Mänskliga rättigheter | Arbetet mot diskriminering | 26 | 120d440 | ok | rolling-source-slice |
| q389 | section-practice | q062 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | 120d440 | ok | rolling-source-slice |
| q390 | true-false | q062 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | 120d440 | ok | rolling-source-slice |
| q391 | false-statement | q062 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | 120d440 | ok | rolling-source-slice |
| q392 | judgement | q062 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | 120d440 | ok | rolling-source-slice |
| q393 | section-practice | q063 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | 120d440 | ok | rolling-source-slice |
| q394 | true-false | q063 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | 120d440 | ok | rolling-source-slice |
| q395 | false-statement | q063 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | 120d440 | ok | rolling-source-slice |
| q396 | judgement | q063 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Så fungerar arbetsmarknaden | 27 | 120d440 | ok | rolling-source-slice |
| q397 | section-practice | q064 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | 120d440 | ok | rolling-source-slice |
| q398 | true-false | q064 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | 120d440 | defect | queued-data-integrity-standalone-stem |
| q399 | false-statement | q064 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | 120d440 | defect | queued-data-integrity-standalone-stem |
| q400 | judgement | q064 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | 120d440 | ok | rolling-source-slice |
| q401 | section-practice | q065 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | 120d440 | ok | rolling-source-slice |
| q402 | true-false | q065 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | 120d440 | ok | rolling-source-slice |
| q403 | false-statement | q065 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | 120d440 | ok | rolling-source-slice |
| q404 | judgement | q065 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Arbetsmarknadens parter | 28 | 120d440 | ok | rolling-source-slice |
| q405 | section-practice | q066 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Lagar och regler på arbetsmarknaden | 29 | 120d440 | ok | rolling-source-slice |
| q406 | true-false | q066 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Lagar och regler på arbetsmarknaden | 29 | 120d440 | defect | queued-data-integrity-standalone-stem |
| q407 | false-statement | q066 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Lagar och regler på arbetsmarknaden | 29 | 120d440 | defect | queued-data-integrity-standalone-stem |
| q408 | judgement | q066 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Lagar och regler på arbetsmarknaden | 29 | 120d440 | ok | rolling-source-slice |
| q409 | section-practice | q067 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | A-kassan | 29 | 120d440 | ok | rolling-source-slice |
| q410 | true-false | q067 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | A-kassan | 29 | 120d440 | ok | rolling-source-slice |
| q411 | false-statement | q067 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | A-kassan | 29 | 120d440 | defect | queued-data-integrity-standalone-stem |
| q412 | judgement | q067 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | A-kassan | 29 | 120d440 | ok | rolling-source-slice |
| q413 | section-practice | q068 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Privatekonomi i Sverige | 29 | 120d440 | ok | rolling-source-slice |
| q414 | true-false | q068 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Privatekonomi i Sverige | 29 | 120d440 | ok | rolling-source-slice |
| q415 | false-statement | q068 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Privatekonomi i Sverige | 29 | 120d440 | ok | rolling-source-slice |
| q416 | judgement | q068 | lib/content/derivedQuestions.ts -> data/questions.ts | ch08 | Arbetsmarknad och privatekonomi | Privatekonomi i Sverige | 29 | 120d440 | ok | rolling-source-slice |
| q417 | section-practice | q069 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | 120d440 | ok | rolling-source-slice |
| q418 | true-false | q069 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | 120d440 | ok | rolling-source-slice |
| q419 | false-statement | q069 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | 120d440 | ok | rolling-source-slice |
| q420 | judgement | q069 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | 120d440 | ok | rolling-source-slice |
| q421 | section-practice | q070 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | 120d440 | ok | rolling-source-slice |
| q422 | true-false | q070 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | 120d440 | ok | rolling-source-slice |
| q423 | false-statement | q070 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | 120d440 | ok | rolling-source-slice |
| q424 | judgement | q070 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Skatter för Sveriges välfärd | 30 | 120d440 | ok | rolling-source-slice |
| q425 | section-practice | q071 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Statligt finansierad välfärd | 30 | 120d440 | ok | rolling-source-slice |
| q426 | true-false | q071 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Statligt finansierad välfärd | 30 | 120d440 | ok | rolling-source-slice |
| q427 | false-statement | q071 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Statligt finansierad välfärd | 30 | 120d440 | ok | rolling-source-slice |
| q428 | judgement | q071 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Statligt finansierad välfärd | 30 | 120d440 | ok | rolling-source-slice |
| q429 | section-practice | q072 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Regionerna ansvarar för sjukvården | 30 | 120d440 | ok | rolling-source-slice |
| q430 | true-false | q072 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Regionerna ansvarar för sjukvården | 30 | 120d440 | ok | rolling-source-slice |
| q431 | false-statement | q072 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Regionerna ansvarar för sjukvården | 30 | 120d440 | ok | rolling-source-slice |
| q432 | judgement | q072 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Regionerna ansvarar för sjukvården | 30 | 120d440 | ok | rolling-source-slice |
| q433 | section-practice | q073 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | 120d440 | ok | rolling-source-slice |
| q434 | true-false | q073 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | 120d440 | ok | rolling-source-slice |
| q435 | false-statement | q073 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | 120d440 | ok | rolling-source-slice |
| q436 | judgement | q073 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | 120d440 | ok | rolling-source-slice |
| q437 | section-practice | q074 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | 120d440 | ok | rolling-source-slice |
| q438 | true-false | q074 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | 120d440 | ok | rolling-source-slice |
| q439 | false-statement | q074 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | 120d440 | ok | rolling-source-slice |
| q440 | judgement | q074 | lib/content/derivedQuestions.ts -> data/questions.ts | ch09 | Välfärdssamhället | Kommunerna har ett stort ansvar | 31 | 120d440 | ok | rolling-source-slice |
| q441 | section-practice | q075 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Från jordbrukssamhälle till industrisamhälle | 32 | 120d440 | ok | rolling-source-slice |
| q442 | true-false | q075 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Från jordbrukssamhälle till industrisamhälle | 32 | 120d440 | ok | rolling-source-slice |
| q443 | false-statement | q075 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Från jordbrukssamhälle till industrisamhälle | 32 | 120d440 | ok | rolling-source-slice |
| q444 | judgement | q075 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Från jordbrukssamhälle till industrisamhälle | 32 | 120d440 | ok | rolling-source-slice |
| q445 | section-practice | q076 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | 120d440 | ok | rolling-source-slice |
| q446 | true-false | q076 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | 120d440 | defect | queued-data-integrity-standalone-stem |
| q447 | false-statement | q076 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | 120d440 | defect | queued-data-integrity-standalone-stem |
| q448 | judgement | q076 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | 120d440 | ok | rolling-source-slice |
| q449 | section-practice | q077 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | 120d440 | ok | rolling-source-slice |
| q450 | true-false | q077 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | 120d440 | ok | rolling-source-slice |
| q451 | false-statement | q077 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | 38cb692 | ok | rolling-source-slice |
| q452 | judgement | q077 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Befolkningsökning | 32 | 38cb692 | ok | rolling-source-slice |
| q453 | section-practice | q078 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sveriges väg till demokrati | 33 | 38cb692 | ok | rolling-source-slice |
| q454 | true-false | q078 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sveriges väg till demokrati | 33 | 38cb692 | defect | queued-data-integrity-residual |
| q455 | false-statement | q078 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sveriges väg till demokrati | 33 | 38cb692 | ok | rolling-source-slice |
| q456 | judgement | q078 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sveriges väg till demokrati | 33 | 38cb692 | ok | rolling-source-slice |
| q457 | section-practice | q079 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Folkrörelserna | 33 | 38cb692 | ok | rolling-source-slice |
| q458 | true-false | q079 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Folkrörelserna | 33 | 38cb692 | ok | rolling-source-slice |
| q459 | false-statement | q079 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Folkrörelserna | 33 | 38cb692 | ok | rolling-source-slice |
| q460 | judgement | q079 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Folkrörelserna | 33 | 38cb692 | ok | rolling-source-slice |
| q461 | section-practice | q080 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Demokratins genombrott | 34 | 38cb692 | ok | rolling-source-slice |
| q462 | true-false | q080 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Demokratins genombrott | 34 | 38cb692 | ok | rolling-source-slice |
| q463 | false-statement | q080 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Demokratins genombrott | 34 | 38cb692 | ok | rolling-source-slice |
| q464 | judgement | q080 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Demokratins genombrott | 34 | 38cb692 | ok | rolling-source-slice |
| q465 | section-practice | q081 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Den svenska modellen | 35 | 38cb692 | ok | rolling-source-slice |
| q466 | true-false | q081 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Den svenska modellen | 35 | 38cb692 | defect | queued-data-integrity-residual |
| q467 | false-statement | q081 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Den svenska modellen | 35 | 38cb692 | ok | rolling-source-slice |
| q468 | judgement | q081 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Den svenska modellen | 35 | 38cb692 | ok | rolling-source-slice |
| q469 | section-practice | q082 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Rekordåren | 36 | 38cb692 | ok | rolling-source-slice |
| q470 | true-false | q082 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Rekordåren | 36 | 38cb692 | defect | queued-data-integrity-residual |
| q471 | false-statement | q082 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Rekordåren | 36 | 38cb692 | defect | queued-data-integrity-residual |
| q472 | judgement | q082 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Rekordåren | 36 | 38cb692 | ok | rolling-source-slice |
| q473 | section-practice | q083 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sverige blir ett invandrarland | 36 | 38cb692 | ok | rolling-source-slice |
| q474 | true-false | q083 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sverige blir ett invandrarland | 36 | 38cb692 | ok | rolling-source-slice |
| q475 | false-statement | q083 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sverige blir ett invandrarland | 36 | 38cb692 | ok | rolling-source-slice |
| q476 | judgement | q083 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Sverige blir ett invandrarland | 36 | 38cb692 | ok | rolling-source-slice |
| q477 | section-practice | q084 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Digital revolution och globalisering | 38 | 38cb692 | ok | rolling-source-slice |
| q478 | true-false | q084 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Digital revolution och globalisering | 38 | 38cb692 | ok | rolling-source-slice |
| q479 | false-statement | q084 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Digital revolution och globalisering | 38 | 38cb692 | defect | queued-data-integrity-residual |
| q480 | judgement | q084 | lib/content/derivedQuestions.ts -> data/questions.ts | ch10 | Sveriges moderna historia | Digital revolution och globalisering | 38 | 38cb692 | ok | rolling-source-slice |
| q481 | section-practice | q085 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Nordiskt samarbete | 39 | 38cb692 | ok | rolling-source-slice |
| q482 | true-false | q085 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Nordiskt samarbete | 39 | 38cb692 | ok | rolling-source-slice |
| q483 | false-statement | q085 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Nordiskt samarbete | 39 | 38cb692 | ok | rolling-source-slice |
| q484 | judgement | q085 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Nordiskt samarbete | 39 | 38cb692 | ok | rolling-source-slice |
| q485 | section-practice | q086 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | 38cb692 | ok | rolling-source-slice |
| q486 | true-false | q086 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | 38cb692 | ok | rolling-source-slice |
| q487 | false-statement | q086 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | 38cb692 | ok | rolling-source-slice |
| q488 | judgement | q086 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | 38cb692 | ok | rolling-source-slice |
| q489 | section-practice | q087 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | 38cb692 | ok | rolling-source-slice |
| q490 | true-false | q087 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | 38cb692 | ok | rolling-source-slice |
| q491 | false-statement | q087 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | 38cb692 | ok | rolling-source-slice |
| q492 | judgement | q087 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | 38cb692 | ok | rolling-source-slice |
| q493 | section-practice | q088 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | 38cb692 | ok | rolling-source-slice |
| q494 | true-false | q088 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | 38cb692 | ok | rolling-source-slice |
| q495 | false-statement | q088 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | 38cb692 | defect | queued-data-integrity-residual |
| q496 | judgement | q088 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | EU och Europarådet | 39 | 38cb692 | ok | rolling-source-slice |
| q497 | section-practice | q089 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Globalt samarbete | 39 | 38cb692 | ok | rolling-source-slice |
| q498 | true-false | q089 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Globalt samarbete | 39 | 38cb692 | ok | rolling-source-slice |
| q499 | false-statement | q089 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Globalt samarbete | 39 | 38cb692 | ok | rolling-source-slice |
| q500 | judgement | q089 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Globalt samarbete | 39 | 38cb692 | ok | rolling-source-slice |
| q501 | section-practice | q090 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Efter kalla krigets slut | 40 | 85fe297 | ok | rolling-source-slice |
| q502 | true-false | q090 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Efter kalla krigets slut | 40 | 85fe297 | ok | rolling-source-slice |
| q503 | false-statement | q090 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Efter kalla krigets slut | 40 | 85fe297 | ok | rolling-source-slice |
| q504 | judgement | q090 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Efter kalla krigets slut | 40 | 85fe297 | ok | rolling-source-slice |
| q505 | section-practice | q091 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Sveriges försvar | 40 | 85fe297 | ok | rolling-source-slice |
| q506 | true-false | q091 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Sveriges försvar | 40 | 85fe297 | ok | rolling-source-slice |
| q507 | false-statement | q091 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Sveriges försvar | 40 | 85fe297 | ok | rolling-source-slice |
| q508 | judgement | q091 | lib/content/derivedQuestions.ts -> data/questions.ts | ch11 | Sverige och omvärlden | Sveriges försvar | 40 | 85fe297 | ok | rolling-source-slice |
| q509 | section-practice | q092 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 85fe297 | ok | rolling-source-slice |
| q510 | true-false | q092 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 85fe297 | ok | rolling-source-slice |
| q511 | false-statement | q092 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 85fe297 | ok | rolling-source-slice |
| q512 | judgement | q092 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 85fe297 | ok | rolling-source-slice |
| q513 | section-practice | q093 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 85fe297 | ok | rolling-source-slice |
| q514 | true-false | q093 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 85fe297 | ok | rolling-source-slice |
| q515 | false-statement | q093 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 85fe297 | ok | rolling-source-slice |
| q516 | judgement | q093 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 85fe297 | ok | rolling-source-slice |
| q517 | section-practice | q094 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 85fe297 | ok | rolling-source-slice |
| q518 | true-false | q094 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 85fe297 | ok | rolling-source-slice |
| q519 | false-statement | q094 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 85fe297 | ok | rolling-source-slice |
| q520 | judgement | q094 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 85fe297 | ok | rolling-source-slice |
| q521 | section-practice | q095 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | 85fe297 | ok | rolling-source-slice |
| q522 | true-false | q095 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | 85fe297 | ok | rolling-source-slice |
| q523 | false-statement | q095 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | 85fe297 | ok | rolling-source-slice |
| q524 | judgement | q095 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | 85fe297 | ok | rolling-source-slice |
| q525 | section-practice | q096 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 85fe297 | ok | rolling-source-slice |
| q526 | true-false | q096 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 85fe297 | defect | queued-data-integrity-q501-q550-current |
| q527 | false-statement | q096 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 85fe297 | defect | queued-data-integrity-q501-q550-current |
| q528 | judgement | q096 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 85fe297 | ok | rolling-source-slice |
| q529 | section-practice | q097 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nyår | 45 | 85fe297 | ok | rolling-source-slice |
| q530 | true-false | q097 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nyår | 45 | 85fe297 | defect | queued-data-integrity-q501-q550-current |
| q531 | false-statement | q097 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nyår | 45 | 85fe297 | defect | queued-data-integrity-q501-q550-current |
| q532 | judgement | q097 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nyår | 45 | 85fe297 | ok | rolling-source-slice |
| q533 | section-practice | q098 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | 85fe297 | ok | rolling-source-slice |
| q534 | true-false | q098 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | 85fe297 | ok | rolling-source-slice |
| q535 | false-statement | q098 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | 85fe297 | defect | queued-data-integrity-q501-q550-current |
| q536 | judgement | q098 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | 85fe297 | ok | rolling-source-slice |
| q537 | section-practice | q099 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | 85fe297 | ok | rolling-source-slice |
| q538 | true-false | q099 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | 85fe297 | ok | rolling-source-slice |
| q539 | false-statement | q099 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | 85fe297 | ok | rolling-source-slice |
| q540 | judgement | q099 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | 85fe297 | ok | rolling-source-slice |
| q541 | section-practice | q100 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | 85fe297 | ok | rolling-source-slice |
| q542 | true-false | q100 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | 85fe297 | defect | queued-data-integrity-q501-q550-current |
| q543 | false-statement | q100 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | 85fe297 | defect | queued-data-integrity-q501-q550-current |
| q544 | judgement | q100 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | 85fe297 | ok | rolling-source-slice |
| q545 | section-practice | q101 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | 85fe297 | ok | rolling-source-slice |
| q546 | true-false | q101 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | 85fe297 | ok | rolling-source-slice |
| q547 | false-statement | q101 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | 85fe297 | ok | rolling-source-slice |
| q548 | judgement | q101 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | 85fe297 | ok | rolling-source-slice |
| q549 | section-practice | q102 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Valborgsmässoafton | 46 | 85fe297 | ok | rolling-source-slice |
| q550 | true-false | q102 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Valborgsmässoafton | 46 | 85fe297 | ok | rolling-source-slice |
| q551 | false-statement | q102 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Valborgsmässoafton | 46 | e0f379a | ok | rolling-source-slice |
| q552 | judgement | q102 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Valborgsmässoafton | 46 | e0f379a | ok | rolling-source-slice |
| q553 | section-practice | q103 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Första maj | 46 | e0f379a | ok | rolling-source-slice |
| q554 | true-false | q103 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Första maj | 46 | e0f379a | ok | rolling-source-slice |
| q555 | false-statement | q103 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Första maj | 46 | e0f379a | ok | rolling-source-slice |
| q556 | judgement | q103 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Första maj | 46 | e0f379a | ok | rolling-source-slice |
| q557 | section-practice | q104 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | e0f379a | ok | rolling-source-slice |
| q558 | true-false | q104 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | e0f379a | ok | rolling-source-slice |
| q559 | false-statement | q104 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | e0f379a | ok | rolling-source-slice |
| q560 | judgement | q104 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | e0f379a | ok | rolling-source-slice |
| q561 | section-practice | q105 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | e0f379a | ok | rolling-source-slice |
| q562 | true-false | q105 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | e0f379a | ok | rolling-source-slice |
| q563 | false-statement | q105 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | e0f379a | defect | queued-data-integrity-q551-q600-current |
| q564 | judgement | q105 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | e0f379a | ok | rolling-source-slice |
| q565 | section-practice | q106 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | e0f379a | ok | rolling-source-slice |
| q566 | true-false | q106 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | e0f379a | ok | rolling-source-slice |
| q567 | false-statement | q106 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | e0f379a | ok | rolling-source-slice |
| q568 | judgement | q106 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | e0f379a | ok | rolling-source-slice |
| q569 | section-practice | q107 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | e0f379a | ok | rolling-source-slice |
| q570 | true-false | q107 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | e0f379a | ok | rolling-source-slice |
| q571 | false-statement | q107 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | e0f379a | ok | rolling-source-slice |
| q572 | judgement | q107 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | e0f379a | ok | rolling-source-slice |
| q573 | section-practice | q108 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | e0f379a | ok | rolling-source-slice |
| q574 | true-false | q108 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | e0f379a | defect | queued-data-integrity-q551-q600-current |
| q575 | false-statement | q108 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | e0f379a | ok | rolling-source-slice |
| q576 | judgement | q108 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | e0f379a | ok | rolling-source-slice |
| q577 | section-practice | q109 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | e0f379a | ok | rolling-source-slice |
| q578 | true-false | q109 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | e0f379a | ok | rolling-source-slice |
| q579 | false-statement | q109 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | e0f379a | ok | rolling-source-slice |
| q580 | judgement | q109 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | e0f379a | ok | rolling-source-slice |
| q581 | section-practice | q110 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | e0f379a | ok | rolling-source-slice |
| q582 | true-false | q110 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | e0f379a | ok | rolling-source-slice |
| q583 | false-statement | q110 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | e0f379a | ok | rolling-source-slice |
| q584 | judgement | q110 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | e0f379a | ok | rolling-source-slice |
| q585 | section-practice | q111 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | e0f379a | ok | rolling-source-slice |
| q586 | true-false | q111 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | e0f379a | ok | rolling-source-slice |
| q587 | false-statement | q111 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | e0f379a | ok | rolling-source-slice |
| q588 | judgement | q111 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | e0f379a | ok | rolling-source-slice |
| q589 | section-practice | q112 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | e0f379a | ok | rolling-source-slice |
| q590 | true-false | q112 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | e0f379a | ok | rolling-source-slice |
| q591 | false-statement | q112 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | e0f379a | ok | rolling-source-slice |
| q592 | judgement | q112 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | e0f379a | ok | rolling-source-slice |
| q593 | section-practice | q113 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | e0f379a | ok | rolling-source-slice |
| q594 | true-false | q113 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | e0f379a | ok | rolling-source-slice |
| q595 | false-statement | q113 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | e0f379a | ok | rolling-source-slice |
| q596 | judgement | q113 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | e0f379a | ok | rolling-source-slice |
| q597 | section-practice | q114 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | e0f379a | ok | rolling-source-slice |
| q598 | true-false | q114 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | e0f379a | defect | queued-data-integrity-q551-q600-current |
| q599 | false-statement | q114 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | e0f379a | defect | queued-data-integrity-q551-q600-current |
| q600 | judgement | q114 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | e0f379a | ok | rolling-source-slice |
| q601 | section-practice | q115 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 3967593 | ok | rolling-source-slice |
| q602 | true-false | q115 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 3967593 | ok | rolling-source-slice |
| q603 | false-statement | q115 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 3967593 | ok | rolling-source-slice |
| q604 | judgement | q115 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 3967593 | ok | rolling-source-slice |
| q605 | section-practice | q116 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 3967593 | ok | rolling-source-slice |
| q606 | true-false | q116 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 3967593 | defect | queued-data-integrity-q601-q650-current |
| q607 | false-statement | q116 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 3967593 | defect | queued-data-integrity-q601-q650-current |
| q608 | judgement | q116 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionsfrihet | 42 | 3967593 | ok | rolling-source-slice |
| q609 | section-practice | q117 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | 3967593 | ok | rolling-source-slice |
| q610 | true-false | q117 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | 3967593 | ok | rolling-source-slice |
| q611 | false-statement | q117 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | 3967593 | defect | queued-data-integrity-q601-q650-current |
| q612 | judgement | q117 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | 3967593 | ok | rolling-source-slice |
| q613 | section-practice | q118 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | 3967593 | ok | rolling-source-slice |
| q614 | true-false | q118 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | 3967593 | ok | rolling-source-slice |
| q615 | false-statement | q118 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | 3967593 | ok | rolling-source-slice |
| q616 | judgement | q118 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Religionens roll | 42 | 3967593 | ok | rolling-source-slice |
| q617 | section-practice | q119 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | 3967593 | ok | rolling-source-slice |
| q618 | true-false | q119 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | 3967593 | ok | rolling-source-slice |
| q619 | false-statement | q119 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | 3967593 | ok | rolling-source-slice |
| q620 | judgement | q119 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Kristendom | 43 | 3967593 | ok | rolling-source-slice |
| q621 | section-practice | q120 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | 3967593 | ok | rolling-source-slice |
| q622 | true-false | q120 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | 3967593 | defect | queued-data-integrity-q601-q650-current |
| q623 | false-statement | q120 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | 3967593 | ok | rolling-source-slice |
| q624 | judgement | q120 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Judendom | 43 | 3967593 | ok | rolling-source-slice |
| q625 | section-practice | q121 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 3967593 | ok | rolling-source-slice |
| q626 | true-false | q121 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 3967593 | ok | rolling-source-slice |
| q627 | false-statement | q121 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 3967593 | ok | rolling-source-slice |
| q628 | judgement | q121 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 3967593 | ok | rolling-source-slice |
| q629 | section-practice | q122 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 3967593 | ok | rolling-source-slice |
| q630 | true-false | q122 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 3967593 | ok | rolling-source-slice |
| q631 | false-statement | q122 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 3967593 | ok | rolling-source-slice |
| q632 | judgement | q122 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Islam | 44 | 3967593 | ok | rolling-source-slice |
| q633 | section-practice | q123 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | 3967593 | ok | rolling-source-slice |
| q634 | true-false | q123 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | 3967593 | ok | rolling-source-slice |
| q635 | false-statement | q123 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | 3967593 | ok | rolling-source-slice |
| q636 | judgement | q123 | lib/content/derivedQuestions.ts -> data/questions.ts | ch12 | En sekulär stat och ett mångreligiöst land | Hinduism och buddhism | 43 | 3967593 | ok | rolling-source-slice |
| q637 | section-practice | q124 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | 3967593 | ok | rolling-source-slice |
| q638 | true-false | q124 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | 3967593 | ok | rolling-source-slice |
| q639 | false-statement | q124 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | 3967593 | ok | rolling-source-slice |
| q640 | judgement | q124 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | 3967593 | ok | rolling-source-slice |
| q641 | section-practice | q125 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | 3967593 | ok | rolling-source-slice |
| q642 | true-false | q125 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | 3967593 | ok | rolling-source-slice |
| q643 | false-statement | q125 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | 3967593 | ok | rolling-source-slice |
| q644 | judgement | q125 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Midsommar | 46 | 3967593 | ok | rolling-source-slice |
| q645 | section-practice | q126 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Några traditionella högtider under året | 45 | 3967593 | ok | rolling-source-slice |
| q646 | true-false | q126 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Några traditionella högtider under året | 45 | 3967593 | ok | rolling-source-slice |
| q647 | false-statement | q126 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Några traditionella högtider under året | 45 | 3967593 | ok | rolling-source-slice |
| q648 | judgement | q126 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Några traditionella högtider under året | 45 | 3967593 | ok | rolling-source-slice |
| q649 | section-practice | q127 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | 3967593 | ok | rolling-source-slice |
| q650 | true-false | q127 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | 3967593 | ok | rolling-source-slice |
| q651 | false-statement | q127 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | d91a489 | ok | rolling-source-slice |
| q652 | judgement | q127 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | d91a489 | ok | rolling-source-slice |
| q653 | section-practice | q128 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | d91a489 | ok | rolling-source-slice |
| q654 | true-false | q128 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | d91a489 | ok | rolling-source-slice |
| q655 | false-statement | q128 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | d91a489 | ok | rolling-source-slice |
| q656 | judgement | q128 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | d91a489 | ok | rolling-source-slice |
| q657 | section-practice | q129 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | d91a489 | ok | rolling-source-slice |
| q658 | true-false | q129 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | d91a489 | ok | rolling-source-slice |
| q659 | false-statement | q129 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | d91a489 | ok | rolling-source-slice |
| q660 | judgement | q129 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | d91a489 | ok | rolling-source-slice |
| q661 | section-practice | q130 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d91a489 | ok | rolling-source-slice |
| q662 | true-false | q130 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d91a489 | ok | rolling-source-slice |
| q663 | false-statement | q130 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d91a489 | defect | queued-data-integrity-q651-q700-current |
| q664 | judgement | q130 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d91a489 | ok | rolling-source-slice |
| q665 | section-practice | q131 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | d91a489 | ok | rolling-source-slice |
| q666 | true-false | q131 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | d91a489 | ok | rolling-source-slice |
| q667 | false-statement | q131 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | d91a489 | ok | rolling-source-slice |
| q668 | judgement | q131 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Påsk | 45 | d91a489 | ok | rolling-source-slice |
| q669 | section-practice | q132 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | d91a489 | ok | rolling-source-slice |
| q670 | true-false | q132 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | d91a489 | defect | queued-data-integrity-q651-q700-current |
| q671 | false-statement | q132 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | d91a489 | defect | queued-data-integrity-q651-q700-current |
| q672 | judgement | q132 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | d91a489 | ok | rolling-source-slice |
| q673 | section-practice | q133 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | d91a489 | ok | rolling-source-slice |
| q674 | true-false | q133 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | d91a489 | ok | rolling-source-slice |
| q675 | false-statement | q133 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | d91a489 | ok | rolling-source-slice |
| q676 | judgement | q133 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Sveriges nationaldag | 46 | d91a489 | ok | rolling-source-slice |
| q677 | section-practice | q134 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | d91a489 | ok | rolling-source-slice |
| q678 | true-false | q134 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | d91a489 | ok | rolling-source-slice |
| q679 | false-statement | q134 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | d91a489 | ok | rolling-source-slice |
| q680 | judgement | q134 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | d91a489 | ok | rolling-source-slice |
| q681 | section-practice | q135 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | d91a489 | ok | rolling-source-slice |
| q682 | true-false | q135 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | d91a489 | ok | rolling-source-slice |
| q683 | false-statement | q135 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | d91a489 | ok | rolling-source-slice |
| q684 | judgement | q135 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Advent | 47 | d91a489 | ok | rolling-source-slice |
| q685 | section-practice | q136 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | d91a489 | ok | rolling-source-slice |
| q686 | true-false | q136 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | d91a489 | ok | rolling-source-slice |
| q687 | false-statement | q136 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | d91a489 | ok | rolling-source-slice |
| q688 | judgement | q136 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Alla helgons dag | 46 | d91a489 | ok | rolling-source-slice |
| q689 | section-practice | q137 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | d91a489 | ok | rolling-source-slice |
| q690 | true-false | q137 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | d91a489 | ok | rolling-source-slice |
| q691 | false-statement | q137 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | d91a489 | ok | rolling-source-slice |
| q692 | judgement | q137 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Nya traditioner | 47 | d91a489 | ok | rolling-source-slice |
| q693 | section-practice | q138 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d91a489 | ok | rolling-source-slice |
| q694 | true-false | q138 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d91a489 | ok | rolling-source-slice |
| q695 | false-statement | q138 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d91a489 | ok | rolling-source-slice |
| q696 | judgement | q138 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d91a489 | ok | rolling-source-slice |
| q697 | section-practice | q139 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d91a489 | ok | rolling-source-slice |
| q698 | true-false | q139 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d91a489 | defect | queued-data-integrity-q651-q700-current |
| q699 | false-statement | q139 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d91a489 | ok | rolling-source-slice |
| q700 | judgement | q139 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d91a489 | ok | rolling-source-slice |
| q701 | section-practice | q140 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d1753ae | ok | rolling-source-slice |
| q702 | true-false | q140 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d1753ae | ok | rolling-source-slice |
| q703 | false-statement | q140 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d1753ae | ok | rolling-source-slice |
| q704 | judgement | q140 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Jul | 47 | d1753ae | ok | rolling-source-slice |
| q705 | section-practice | q141 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | d1753ae | ok | rolling-source-slice |
| q706 | true-false | q141 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | d1753ae | ok | rolling-source-slice |
| q707 | false-statement | q141 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | d1753ae | ok | rolling-source-slice |
| q708 | judgement | q141 | lib/content/derivedQuestions.ts -> data/questions.ts | ch13 | Traditioner och högtider | Lucia | 47 | d1753ae | ok | rolling-source-slice |
| q709 | section-practice | q142 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | d1753ae | ok | rolling-source-slice |
| q710 | true-false | q142 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | d1753ae | ok | rolling-source-slice |
| q711 | false-statement | q142 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | d1753ae | ok | rolling-source-slice |
| q712 | judgement | q142 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Skogar, sjöar och öar | 6 | d1753ae | ok | rolling-source-slice |
| q713 | section-practice | q143 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Sveriges indelning | 6 | d1753ae | defect | queued-data-integrity-q701-q720-current |
| q714 | true-false | q143 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Sveriges indelning | 6 | d1753ae | ok | rolling-source-slice |
| q715 | false-statement | q143 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Sveriges indelning | 6 | d1753ae | ok | rolling-source-slice |
| q716 | judgement | q143 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Sveriges indelning | 6 | d1753ae | defect | queued-data-integrity-q701-q720-current |
| q717 | section-practice | q144 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Sveriges indelning | 6 | d1753ae | ok | rolling-source-slice |
| q718 | true-false | q144 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Sveriges indelning | 6 | d1753ae | ok | rolling-source-slice |
| q719 | false-statement | q144 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Sveriges indelning | 6 | d1753ae | ok | rolling-source-slice |
| q720 | judgement | q144 | lib/content/derivedQuestions.ts -> data/questions.ts | ch01 | Landet Sverige | Sveriges indelning | 6 | d1753ae | ok | rolling-source-slice |

## Non-Question Content

| ID | Kind | Source path | UHR source | Last verified commit | Status | Next recheck |
|---|---|---|---|---|---|---|
| chapter-ch01 | chapter-record | data/chapters.ts | Landet Sverige, TOC p. 2 / printed p. 5 | c6299ce | ok | rolling-chapter-records |
| chapter-ch02 | chapter-record | data/chapters.ts | Sveriges demokratiska system, TOC p. 2 / printed p. 10 | c6299ce | ok | rolling-chapter-records |
| chapter-ch03 | chapter-record | data/chapters.ts | Så här styrs Sverige, TOC p. 2 / printed p. 12 | c6299ce | ok | rolling-chapter-records |
| chapter-ch04 | chapter-record | data/chapters.ts | Politiska val och partier, TOC p. 2 / printed p. 14 | c6299ce | ok | rolling-chapter-records |
| chapter-ch05 | chapter-record | data/chapters.ts | Lag och rätt, TOC p. 2 / printed p. 16 | c6299ce | ok | rolling-chapter-records |
| chapter-ch06 | chapter-record | data/chapters.ts | Mediernas roll, TOC p. 2 / printed p. 20 | c6299ce | ok | rolling-chapter-records |
| chapter-ch07 | chapter-record | data/chapters.ts | Mänskliga rättigheter, TOC p. 2 / printed p. 22 | c6299ce | ok | rolling-chapter-records |
| chapter-ch08 | chapter-record | data/chapters.ts | Arbetsmarknad och privatekonomi, TOC p. 2 / printed p. 27 | c6299ce | ok | rolling-chapter-records |
| chapter-ch09 | chapter-record | data/chapters.ts | Välfärdssamhället, TOC p. 3 / printed p. 30 | c6299ce | ok | rolling-chapter-records |
| chapter-ch10 | chapter-record | data/chapters.ts | Sveriges moderna historia, TOC p. 3 / printed p. 32 | c6299ce | ok | rolling-chapter-records |
| chapter-ch11 | chapter-record | data/chapters.ts | Sverige och omvärlden, TOC p. 3 / printed p. 39 | c6299ce | ok | rolling-chapter-records |
| chapter-ch12 | chapter-record | data/chapters.ts | En sekulär stat och ett mångreligiöst land, TOC p. 3 / printed p. 42 | c6299ce | ok | rolling-chapter-records |
| chapter-ch13 | chapter-record | data/chapters.ts | Traditioner och högtider, TOC p. 3 / printed p. 45 | c6299ce | ok | rolling-chapter-records |
