# zh-Hant Sample Corpus Notes

Locale: Traditional Chinese; choose Taiwan vs Hong Kong conventions explicitly before shipping.

## Register target

Separate native Traditional Chinese deliverable, not a script conversion from zh-Hans.

## Seed sources

| Quality | Source | URL | Why use |
|---|---|---|---|
| official-fact+register | Government.se How Sweden is governed | https://www.regeringen.se/other-languages/english---how-sweden-is-governed/ | Fact anchor for Swedish institutions. |
| official-fact+register | Swedish Migration Agency citizenship for adults | https://www.migrationsverket.se/en/you-want-to-apply/swedish-citizenship/citizenship-for-adults.html | Current citizenship requirements and terms. |

## Translation risks

- Do not convert 简体 strings mechanically. Decide Taiwan/HK terms: 資訊/資料, 網路/網絡, 軟體/軟件.
- Avoid Mainland-only wording unless the target is explicitly Mainland Traditional, which is unlikely.

## Reusable localization notes

- Error encouragement should reassure and teach; never shame the learner.
- Source labels must say the app is based on/reference material, not an official exam authority.
- Institution names should teach the Swedish term when the term itself matters.

## Next tasks

1. Add native-speaker observations after reading the sources directly.
2. Add glossary terms with source URLs before translating UI or questions.
3. Add humor/tone examples that are newly authored, not copied.
