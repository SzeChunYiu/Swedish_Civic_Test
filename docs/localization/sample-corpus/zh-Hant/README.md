# zh-Hant Sample Corpus Notes

Locale: Traditional Chinese; default to Taiwan-style Traditional Chinese unless a future product decision explicitly chooses Hong Kong conventions.

## Register target

Separate native Traditional Chinese deliverable, not a script conversion from zh-Hans; keep Swedish facts anchored to official Swedish sources.

## Seed sources

| Quality | Source | URL | Why use |
|---|---|---|---|
| official-fact+register | Government.se How Sweden is governed | https://www.regeringen.se/other-languages/english---how-sweden-is-governed/ | Fact anchor for Swedish institutions. |
| official-fact+register | Swedish Migration Agency citizenship for adults | https://www.migrationsverket.se/en/you-want-to-apply/swedish-citizenship/citizenship-for-adults.html | Current citizenship requirements and terms. |

## Translation risks

- Do not convert 简体 strings mechanically. Default to Taiwan terms such as `資訊`, `網路`, `軟體`; document any Hong Kong alternative.
- Avoid Mainland-only wording or PRC institution analogies.
- Keep Swedish institution names visible when the Swedish term itself matters.

## Reusable localization notes

- See `style-guide.md` for Traditional Chinese civic voice, Taiwan/HK convention boundary, UI patterns, glossary, and word-by-word audit checklist.
- Error encouragement should reassure and teach; never shame the learner.
- Source labels must say the app is based on/reference material, not an official exam authority.
- Institution names should teach the Swedish term when the term itself matters.

## Next tasks

1. Native-speaker review of `style-guide.md`, especially Taiwan/HK convention choices.
2. Apply the audit checklist before introducing Traditional Chinese app strings.
3. Add short source cards for any new Traditional Chinese government/newcomer pages used later.
