# Translation Review Log

Updated: 2026-05-22

This log records **which website fields have been translated into the non-base
locales, by what method, when, and their review status**. It complements the
fail-closed release ledger in [`readiness.json`](./readiness.json).

## Honest status in one line

All non-base-locale translations shipped so far are **phase-1, model-assisted
("machine") translations** that pass **automated** structural verification.
**No surface has had native-speaker review yet.** No locale is release-enabled
(`appAvailable` stays `false` in `lib/i18n/locales.ts`; the `tr()` lookups fall
back to English if a value is ever missing).

Base languages: `sv` (source of truth), `en` (bridge). Target locales (10):
`zh-Hans`, `zh-Hant`, `ar`, `ckb`, `fa`, `pl`, `so`, `ti`, `tr`, `uk`.

## What "verified" means here

| Check                     | Type                         | Meaning                                                                                            |
| ------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Completeness              | automated                    | every key/field present and non-empty in all 10 locales                                            |
| HTML/anchor integrity     | automated                    | tags, `href`, placeholders preserved vs source                                                     |
| CJK punctuation           | automated                    | no ASCII sentence punctuation adjacent to Han characters                                           |
| Answer-logic (questions)  | automated + model self-check | correct option stays correct; distractors stay factually wrong about Sweden; 1:1 option-id mapping |
| Proper-noun policy        | model + spot-check           | Swedish institutions/brand kept in Latin; bracketed gloss on first use                             |
| **Native-speaker review** | **NOT DONE**                 | meaning, register, dialect, RTL runtime, culture/humour — pending                                  |

## Surfaces translated (by date)

| Surface                                                                                                                                                    | Source / mechanism                                                                | Locales | Date                    | Method                           | Automated checks                                         | Native review | PR                | Comment                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------- | ----------------------- | -------------------------------- | -------------------------------------------------------- | ------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Static-site UI dictionary — home, nav, footer, **Privacy / Terms / Sources / Support / How-it-works**, settings, consent (180 keys)                        | `site/i18n-extras.js` (`data-i18n`)                                               | all 10  | 2026-05-20              | phase-1 machine                  | completeness, HTML/anchor, CJK punctuation — pass        | **pending**   | #1749 #1769 #1770 | Reviewed high-frequency keys (hero/footer/consent) were already curated; not overwritten.                                   |
| Practice & mock-exam page chrome (Quick round, Pick a chapter, Accuracy, "answered", mock config + results)                                                | `site/practice.js` ternaries → `tr({…})`                                          | all 10  | 2026-05-20              | phase-1 machine                  | node syntax, eslint, per-locale resolution — pass        | **pending**   | #1789             | "Fel"/"Needs review" softening rendered inconsistently across locales — flag for native pass.                               |
| Chapter list — titles + descriptions (13)                                                                                                                  | `data/chapters.ts` `nameText`/`descriptionText` → exported to `site/questions.js` | all 10  | 2026-05-20              | phase-1 machine                  | schema-valid, parses, `tr()` resolves — pass             | **pending**   | #1785 #1786       | Canonical + deployed artifact both carry translations.                                                                      |
| Ebook reader + app-shell chrome (highlights, Previous/Next, study actions, practice CTA labels, mock exam, disclaimer, nav aria-labels, quiz empty states) | `site/ebook.js` + `site/app.js` ternaries → `tr()`/`smtTr()`                      | all 10  | 2026-05-20 → 2026-05-22 | phase-1 machine                  | node syntax, eslint, per-locale resolution — pass        | **pending**   | #1793             | `PRACTICE_LINKS` CTA labels now covered for all target locales; `appAvailable` remains false pending native-speaker review. |
| **Ebook chapter reading content** (intro + 13 chapters: kicker/title/lede/body prose + factbox facts)                                                      | `site/ebook.js` `CHAPTERS`                                                        | all 10  | 2026-05-20              | phase-1 machine, **in progress** | HTML integrity, CJK punctuation — per batch              | **pending**   | (in progress)     | Swedish terms kept with bracketed gloss, e.g. `公开原则（offentlighetsprincipen）`.                                         |
| Question bank — v8 localization pilot                                                                                                                      | `data/questionLocalizations.ts`                                                   | all 10  | 2026-05-15 → 2026-05-20 | phase-1 machine                  | `check-question-i18n-v8`, answer-logic self-check — pass | **pending**   | (pilot) #1782     | **Coverage: 50 of 169 authored questions** (q001–q040 + q160–q169). Derived questions (q170+) inherit via derivation.       |

## Not yet translated (known gaps)

- **Question bank:** 119 authored questions (q041–q159) not yet in the localization pilot.
- Any field reachable only at runtime states not exercised by the automated checks.

## Per-locale native-review checklist (all PENDING)

For each of `zh-Hans, zh-Hant, ar, ckb, fa, pl, so, ti, tr, uk`, before
`appAvailable=true`:

- [ ] Native-speaker review of UI strings (meaning, register, dialect)
- [ ] Native-speaker review of chapter + ebook content
- [ ] Native-speaker review of question bank (incl. that distractors read as plausibly wrong, not nonsensical)
- [ ] Culture/humour review (no jokes about migration, religion, family, legal status)
- [ ] RTL runtime + accessibility review (`ar`, `ckb`, `fa`): layout, alignment, numerals, line-wrapping
- [ ] Legal/credential copy review (citizenship terminology, "unofficial" framing)
- [ ] Glossary/terminology sign-off (`locales/<lang>/glossary.md` phase-1 → reviewed)

## How to update this log

When a surface is translated or reviewed, add/extend a row with the date, the
method, the automated checks run, and the native-review outcome (reviewer +
date + comment). Keep `readiness.json` in sync — a locale only becomes
`appAvailable=true` when every box in its checklist above is ticked.
