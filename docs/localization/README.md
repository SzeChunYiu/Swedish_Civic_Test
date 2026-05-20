# Localization Research Hub

This folder is the shared research shelf for native-quality localization. It is
not a translation dump. It tells language workers what to read before writing,
how to save reusable source notes, and how to avoid mechanical translation.

## Why this exists

The civic-test app teaches Swedish society, law, rights, institutions, and exam
habits. Literal translation is not enough: each language needs the register that
real public-information, civic-education, and government-service texts use for
that audience. Workers must also localize tone, examples, and light humor so the
copy feels written for the reader, not converted from English or Swedish.

## Folder contract

- `source-materials.md` — curated source map by language and source type.
- `sample-corpus/<lang>/README.md` — language-specific reading notes, style
  observations, approved micro-samples, and translation risks.
- `sample-corpus/<lang>/sources.tsv` — machine-readable source cards for future
  sessions.

Do not paste long copyrighted passages here. Store links, metadata, short
micro-excerpts only when needed, and your own style observations. If a source is
public-domain or openly licensed, record the license before copying more than a
few words.

## What workers must do before translating

1. Read `docs/parallel-sessions/language.md` and this hub.
2. Open the target language's `sample-corpus/<lang>/README.md` if it exists.
3. Add at least two high-quality sources to that language's source card before
   translating a new domain. Prefer official Swedish authority material in the
   target language; add community/media sources only for tone or humor, never
   for legal facts.
4. Update `locales/<lang>/glossary.md` with sourced terminology decisions.
5. Translate in two passes: faithful meaning first, native reader polish second.

## Best materials for this project

Priority order:

1. Swedish authority civic/public-information texts in the target language
   (`Informationsverige.se`, `Migrationsverket`, `Sweden Abroad`, `DO`, `JO`,
   `Government.se`). These teach the register and official terminology.
2. Official or NGO learner-facing material about rights, democracy, housing,
   healthcare, school, work, and anti-discrimination. These teach plain-language
   explanations for adults.
3. Target-language public-service websites from the reader's home region only
   when Swedish sources are missing. Use them for style, not Swedish facts.
4. Articles, comics, social posts, or jokes in the target language only for
   tone calibration. Mark them as `tone-only`; do not derive civic facts.

## Humor and culture rule

Never translate jokes word-for-word. A joke, mascot line, badge, or celebration
copy must preserve the function: encouragement, relief after a mistake, or a
small smile. If the same image or idiom is awkward in the target culture, write
a native equivalent and record the decision in the language sample notes.
