# Localization Source Materials

Seeded: 2026-05-20. Purpose: give future language sessions a vetted starting
point for learning native civic register before translating app copy.

## Source-quality labels

- `official-fact+register`: can support terminology and Swedish civic facts.
- `official-register`: good for tone/phrasing, but facts may be local to another
  country or domain.
- `tone-only`: useful for everyday idiom, humor, or learner warmth only.

## Cross-language anchor sources

These sources are especially useful because they cover Swedish society in many
languages and often align page-by-page across languages.

| Source | Why it matters | Use |
|---|---|---|
| Informationsverige.se, About Sweden / Om Sverige | County Administrative Boards' civic orientation material for newcomers. Strongest source for rights, duties, democracy, housing, healthcare, work, and social norms in plain public language. | `official-fact+register` |
| Swedish Migration Agency, Swedish citizenship pages | Current citizenship requirements, application/notification terminology, residence-permit vocabulary. | `official-fact+register` |
| Government.se, How Sweden is governed | Official English source for government levels, Riksdag, Government Offices, agencies, and ombudsmen. | `official-fact+register` for English and terminology fallback |
| Equality Ombudsman (DO), English and Swedish pages | Discrimination Act, protected grounds, equal rights/opportunities. | `official-fact+register` |
| Parliamentary Ombudsmen (JO), English and Swedish pages | Ombudsman terminology and public-authority supervision role. | `official-fact+register` |
| Sweden Abroad pages by country/language | Good for localized migration/visa/public-service phrasing for specific audiences, especially Chinese. | `official-register` plus term checks |

## Seed source cards by language

| Language | Best first sources | Notes for next worker |
|---|---|---|
| `ar` Arabic | Informationsverige Arabic rights/obligations, child rights, housing rights pages. | Use MSA public-service register; avoid colloquial jokes unless intentionally localized. |
| `fa` Persian | Informationsverige Persian rights/obligations and religion-freedom pages. | Current repo labels this as Farsi/Dari; workers must decide whether the atom targets Iran Farsi, Dari, or neutral Persian before writing. |
| `so` Somali | Informationsverige Somali rights/obligations, discrimination, child rights, housing pages. | Strong Swedish-official source coverage; record Somali civic terms before translating questions. |
| `ti` Tigrinya | Informationsverige Tigrinya healthcare rights/duties and downloadable method-support PDFs. | Coverage is thinner; gather at least one rights/democracy source before UI or question translation. |
| `tr` Turkish | Sweden Abroad Turkish migration/consular pages plus English/Swedish official civic facts. | The picker lists Turkish, but Swedish official Turkish civic-orientation coverage is limited; use Turkish pages for register and source Swedish facts separately. |
| `ckb` Kurdish Sorani | No strong Swedish-official Sorani civic page found in this seed pass. Use Swedish/English official facts plus Sorani public-service/union material for register. | Mark facts as sourced from Swedish/English until a Sorani official Swedish source is found. |
| `en` English | Informationsverige English, Government.se, Migrationsverket, DO, JO. | English is also the bridge language for second-pass checks. Keep it plain, not bureaucratic. |
| `pl` Polish | If Swedish Polish pages are missing, use official Polish public-service/legal texts for register plus English/Swedish official facts. | Avoid importing Poland-specific institutions into Swedish civics. |
| `uk` Ukrainian | Informationsverige Ukrainian rights/obligations and social-orientation pages. | Good official civic-orientation coverage; use Ukrainian public-service punctuation and titles. |
| `zh-Hans` Simplified Chinese | Existing `locales/zh-Hans/glossary.md`; Sweden Abroad China; Migrationsverket English facts; Government.se. | Mainland conventions; native civic prose should be concise and formal-plain. |
| `zh-Hant` Traditional Chinese | Need separate Taiwan/HK source pass; do not convert `zh-Hans`. | Gather Taiwan/HK public-service style sources plus Swedish official facts. |

## Round-1 web evidence

- Arabic rights/obligations: https://www.informationsverige.se/ar/om-sverige/individens-rattigheter-och-skyldigheter/
- Arabic child rights: https://www.informationsverige.se/ar/om-sverige/individens-rattigheter-och-skyldigheter/barnets-rattigheter.html
- English rights/obligations: https://www.informationsverige.se/en/om-sverige/individens-rattigheter-och-skyldigheter.html
- English democracy/rule of law: https://www.informationsverige.se/en/om-sverige/att-komma-till-sverige/sverige---en-demokrati-och-rattsstat.html
- Persian rights/obligations: https://www.informationsverige.se/fa/om-sverige/individens-rattigheter-och-skyldigheter.html
- Somali rights/obligations index: https://www.informationsverige.se/so/om-sverige.html
- Somali discrimination: https://www.informationsverige.se/so/om-sverige/individens-rattigheter-och-skyldigheter/diskriminering.html
- Somali housing rights: https://www.informationsverige.se/so/om-sverige/att-bo-i-sverige/rattigheter-och-skyldigheter-i-ditt-boende.html
- Tigrinya healthcare rights: https://www.informationsverige.se/ti/om-sverige/att-varda-sin-halsa-i-sverige/rattigheter-och-skyldigheter-i-motet-med-varden.html
- Ukrainian rights/obligations: https://www.informationsverige.se/uk/om-sverige/individens-rattigheter-och-skyldigheter.html
- Ukrainian social orientation: https://www.informationsverige.se/uk/om-sverige/samhallsorientering-om-sverige.html
- Swedish Migration Agency citizenship for adults: https://www.migrationsverket.se/en/you-want-to-apply/swedish-citizenship/citizenship-for-adults.html
- Swedish Migration Agency 2026 rule-change notice: https://www.migrationsverket.se/nyheter/news-archive/2026-05-06-new-rules-for-swedish-citizenship-from-6-june-2026.html
- Sweden Abroad Turkish residence-permit application process: https://www.swedenabroad.se/tr/about-sweden-non-swedish-citizens/t%C3%BCrk%C3%A7e/%C4%B0sve%C3%A7e-gitmek/isve%C3%A7te-%C3%A7al%C4%B1%C5%9Fmak-ve-ya%C5%9Famak-aile-birle%C5%9Fimi/nas%C4%B1l-ba%C5%9Fvuru-yap%C4%B1l%C4%B1r/
- Sweden Abroad Turkish education residence pages: https://www.swedenabroad.se/tr/about-sweden-non-swedish-citizens/t%C3%BCrk%C3%A7e/%C4%B0sve%C3%A7e-gitmek/%C4%B0sve%C3%A7te-e%C4%9Fitim/
- Länsstyrelsen human rights page: https://www.lansstyrelsen.se/english/society/social-sustainability/human-rights.html
- Government.se How Sweden is governed: https://www.regeringen.se/other-languages/english---how-sweden-is-governed/
- Kommunal Sorani information: https://www.kommunal.se/sorani-information-om-kommunal

## Gaps to fill next

1. Dedicated source expansion for domains that are still thin, especially Turkish, Sorani, Polish, and Traditional Chinese civic facts.
2. Native-speaker review notes, especially for humor, warmth, and error-state
   copy.
3. Domain packs: citizenship requirements, democracy/government, rights and
   discrimination, work/tax/welfare, school/family, housing, healthcare.
