# Persian Sample Corpus Notes

Locale: Persian/Farsi (`fa`) for Sweden civic-test learners; keep distinct from Dari (`prs`) unless a future owner explicitly merges audiences.

## Register target

Plain public-information Persian with explicit civic terms. Avoid over-literary phrasing in learner UI.

## Seed sources

| Quality | Source | URL | Why use |
|---|---|---|---|
| official-fact+register | Informationsverige Persian rights and obligations | https://www.informationsverige.se/fa/om-sverige/individens-rattigheter-och-skyldigheter.html | Swedish civic-orientation register in Persian. |
| official-fact+register | Informationsverige Persian freedom of religion | https://www.informationsverige.se/fa/om-sverige/individens-rattigheter-och-skyldigheter/religionsfrihet.html | Religion/right terminology and plain examples. |

## Translation risks

- Do not mix Persian/Farsi (`fa`) and Dari (`prs`) conventions silently.
- Use `سوئد`, `مدرسه`, `کودک`, and `اطلاعات` for `fa`; record any Dari alternatives separately.
- Record whether terms use `حق و حقوق`, `حقوق`, `وظایف`, `تعهدات`, or `مسئولیت` based on context.

## Reusable localization notes

- See `style-guide.md` for Persian/Farsi civic voice, variant boundary, UI patterns, glossary, and word-by-word audit checklist.
- Error encouragement should reassure and teach; never shame the learner.
- Source labels must say the app is based on/reference material, not an official exam authority.
- Institution names should teach the Swedish term when the term itself matters.

## Next tasks

1. Native-speaker review of `style-guide.md` examples and the `fa` vs `prs` boundary.
2. Apply the audit checklist before introducing Persian app strings.
3. Add short source cards for any new Persian government/newcomer pages used later.
