# Ukrainian Glossary

Status: phase-1 glossary. Use with `docs/localization/sample-corpus/uk/style-guide.md`.

## Source notes

This phase uses Ukrainian Informationsverige pages for both Swedish civic facts and public-service register. Useful source-backed patterns include:

- orientation framing: `Про Швецію — матеріал для соціальної орієнтації`
- learner/topic framing: `Цей текст присвячений ...`, `Ви дізнаєтеся ...`, `Питання для роздумів`
- rights language: `права та обов'язки`, `кожна людина має право ...`
- democracy language: `вільні і справедливі вибори`, `народовладдя`, `представницька демократія`
- Swedish governance terms: `парламент`, `регіон`, `муніципалітет`, `державні служби`, `уряд`
- source-critical register: `критична оцінка джерел інформації`

Use Ukrainian official Swedish-source wording where available. Do not substitute Ukrainian institutions for Swedish ones.

## Civic terms

| Swedish/English concept | Ukrainian rendering | Notes |
|---|---|---|
| Sweden | Швеція | Use `у Швеції`. |
| Swedish | шведський / шведська / шведське | Match gender and case. |
| Swedish citizenship | громадянство Швеції / шведське громадянство | Prefer legal clarity. |
| Swedish Migration Agency | Міграційне управління Швеції (Migrationsverket) | Keep Swedish name on first mention; verify official Ukrainian form before release. |
| residence permit | дозвіл на проживання / посвідка на проживання | Source navigation uses `дозвіл на проживання`; choose by context. |
| application | заява / подати заяву | Avoid calque-like `аплікація`. |
| decision | рішення | Use `ухвалити рішення` / `прийняти рішення` as context requires. |
| democracy | демократія | Use `представницька демократія` when relevant. |
| rule of law | верховенство права / правова держава | Choose by sentence. |
| constitution | конституція | Capitalize in proper-name contexts. |
| Riksdag | Парламент Швеції (Риксдаг) | Keep Swedish term visible. |
| government | уряд | Do not confuse with `держава`. |
| government agency/public authority | державна служба / державний орган | Exact agency names where known. |
| municipality / kommun | муніципалітет / комуна (kommun) | Use Swedish-system explanation; avoid Ukrainian hromada substitution. |
| region | регіон | Swedish regional government level. |
| rights | права | |
| duties/obligations | обов'язки / зобов'язання | `зобов'язання` is more formal/legal. |
| rights and duties | права та обов'язки | Source phrase. |
| freedom of expression | свобода вираження поглядів / свобода слова | Choose by source context. |
| discrimination | дискримінація | Define with plain examples when needed. |
| gender equality | гендерна рівність | Rights-based wording. |
| source criticism | критична оцінка джерел інформації | Source navigation phrase. |

## UI term decisions

| English app term | Ukrainian candidate | Notes |
|---|---|---|
| practice | тренування / практика | Use `тренування` for quiz practice. |
| start practice | Почати тренування | Short CTA. |
| continue practice | Продовжити тренування | Short CTA. |
| question | питання | |
| answer | відповідь | |
| answer option | варіант відповіді | |
| explanation | пояснення | |
| correct | Правильно / Відповідь правильна | Warm feedback. |
| incorrect | Цього разу відповідь неправильна | Non-shaming. |
| source | джерело | |
| source material | джерельний матеріал / джерела | Choose by context. |
| coming soon | Ця мовна версія ще готується | Public-information tone. |
| local device | цей пристрій | Privacy/local-storage copy. |

## False friends and style warnings

- Avoid Russian calques: use `брати участь`, not `приймати участь`; `є`, not `являється`; `протягом`, not `на протязі`.
- Do not use Russian or mixed-language slang.
- Do not map `Riksdag`, `kommun`, or Swedish agencies to Ukrainian institutions.
- Be especially careful with war, asylum, migration status, citizenship, passports, religion, gender, and minority-rights language.
- Ukrainian cases and gendered forms require native review in full runtime strings.
