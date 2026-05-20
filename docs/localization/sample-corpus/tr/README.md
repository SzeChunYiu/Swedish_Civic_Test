# Turkish Sample Corpus Notes

Locale: Turkish (`tr`) for Turkish-speaking adults preparing for a Swedish civic/citizenship test.

## Register target

Clear, respectful public-information Turkish. Use the formal `siz` register for instructions and rights/duties. Keep Swedish facts anchored to Swedish/English official sources, and use Turkish official/embassy prose to learn natural phrasing.

## Seed sources

| Quality | Source | URL | Why use |
|---|---|---|---|
| official-register | Sweden Abroad Turkish residence-permit application pages | https://www.swedenabroad.se/tr/about-sweden-non-swedish-citizens/t%C3%BCrk%C3%A7e/%C4%B0sve%C3%A7e-gitmek/isve%C3%A7te-%C3%A7al%C4%B1%C5%9Fmak-ve-ya%C5%9Famak-aile-birle%C5%9Fimi/nas%C4%B1l-ba%C5%9Fvuru-yap%C4%B1l%C4%B1r/ | Swedish-authority Turkish service register: başvuru, oturum izni, belge, karar, ücret. |
| official-register | Sweden Abroad Turkish family-member residence page | https://www.swedenabroad.se/tr/about-sweden-non-swedish-citizens/t%25C3%25BCrk%25C3%25A7e/%25C4%25B0sve%25C3%25A7e-gitmek/isve%25C3%25A7te-%25C3%25A7al%25C4%25B1%25C5%259Fmak-ve-ya%25C5%259Famak-aile-birle%25C5%259Fimi/%25C4%25B0sve%25C3%25A7te-yak%25C4%25B1n-aile-bireyine-gitmek-i%25C3%25A7in-oturum-ba%25C5%259Fvurusu/ | Natural explanations for eligibility, family terms, and decisions by Swedish Migration Agency. |
| official-register | Sweden Abroad Turkish education residence pages | https://www.swedenabroad.se/tr/about-sweden-non-swedish-citizens/t%C3%BCrk%C3%A7e/%C4%B0sve%C3%A7e-gitmek/%C4%B0sve%C3%A7te-e%C4%9Fitim/ | Public-service Turkish for requirements, documents, fees, and application process. |
| official-fact+fallback | Informationsverige English democracy and rule of law | https://www.informationsverige.se/en/om-sverige/att-komma-till-sverige/sverige---en-demokrati-och-rattsstat.html | Swedish civic facts when Turkish official translations are unavailable. |
| official-fact+fallback | Swedish Migration Agency citizenship for adults | https://www.migrationsverket.se/en/you-want-to-apply/swedish-citizenship/citizenship-for-adults.html | Current citizenship facts and changing-rule warnings; translate after same-day check. |

## Reusable localization notes

- Swedish official Turkish material is concentrated in Sweden Abroad migration/consular pages, not full civic-orientation pages. Use it for tone and terminology, not as a complete civic fact source.
- Turkish public-service copy normally uses `başvuru yapmak`, `oturum izni`, `gerekli belgeler`, `değerlendirilir`, and `karar verilir` rather than literal English structures.
- Prefer `İsveç` and `İsveççe`; preserve dotted/dotless Turkish letters.
- See `style-guide.md` for mechanical-translation repairs, civic terms, UI patterns, humor guidance, and word-by-word audit gates.

## Translation risks

- Do not import Turkey-specific institutions or legal categories into Swedish civics.
- Do not translate Swedish `Riksdag` as only `meclis` when the Swedish institution itself matters; use `İsveç Parlamentosu (Riksdag)` on first mention.
- Avoid casual second-person singular (`sen`) in app instructions; use formal/plural `siz` or neutral imperative patterns.
- Citizenship facts are time-sensitive; check Migrationsverket live pages before release.

## Next tasks

1. Add native Turkish review notes for democracy, rights, discrimination, and public-authority vocabulary.
2. Build `locales/tr/glossary.md` before any UI or question translation is enabled.
3. Keep `tr` disabled in the picker until UI strings, question content, glossary, and native review are complete.
