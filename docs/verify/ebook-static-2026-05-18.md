# Static Ebook Verification - 2026-05-18

Baseline: rebased current `origin/main` during the 2026-05-18 pane slice

Scope:
- `site/ebook.js`
- `site/index.html`
- `site/app.js`
- `site/questions.js`
- `tests/content-static-site-ebook-parity.test.js`

Objective: verify the shipped static ebook for chapter/practice alignment and
source-coverage claims without editing `site/**`.

## Summary

- Static chapter inventory is current: `site/questions.js` exposes 13 shipped
  chapter metadata records and 720 questions.
- Static ebook navigation is current: `site/ebook.js` declares `intro` plus
  chapters `1` through `13`, and `site/index.html` has matching ebook nav
  entries.
- Ebook practice links are topical rather than one-to-one with UHR chapter IDs.
  They currently point to valid static routes/filters (`#/practice?c=10`,
  `#/practice?c=3`, `#/practice?c=5`, `#/practice?c=8`, `#/practice?c=7`,
  `#/practice?c=9`, `#/practice?c=1`, `#/practice?c=13`,
  `#/practice?c=11`, `#/practice?c=mix`, and `#/mock`). No broken
  chapter-count or route-coverage defect is filed from this slice.
- Source coverage is not adequate for the ebook copy. This slice files
  `REVIEWER-SITE-EBOOK-SOURCE-COVERAGE-1`.

## Defect: Ebook Source Coverage

The static site markets the ebook as source-backed and the ebook intro promises
that every claim is footnoted, but the current Sources page only describes the
question bank citation model.

Evidence:
- `site/index.html` Home lede says the app has "Short, source-backed
  chapters".
- `site/ebook.js` intro says the ebook is "Not a substitute for the actual
  sources" and that "every claim here is footnoted in the sources page".
- `site/index.html` Sources page is scoped to the question bank:
  "The current question bank cites UHR's public study material..." and "Every
  shipped question cites a chapter, section, and page from this material."
- The Sources page has no ebook-specific source family, no chapter source map,
  and no footnotes for ebook claims.
- The current ebook parity guard checks stale placeholder copy, nav coverage,
  Swedish/English body parity, and chapter 13 rendering. It does not fail when
  ebook source-backed/footnoted claims exist without ebook citations.

Examples of ebook claims that need a visible citation model or softer
provenance copy:
- `site/ebook.js` chapter 1: EU membership in 1995, euro referendum in 2003,
  NATO membership in 2024, and long peace since 1814.
- `site/ebook.js` chapter 4: income-tax/VAT figures, union membership share,
  parental-leave day count, and Skatteverket address-registration wording.
- `site/ebook.js` chapter 11: citizenship-test start date, standard residence
  requirement, dual-citizenship timing, and decision authority.

Impact:
- This conflicts with `docs/content/wording-rules.md` applying honest
  provenance expectations to ebook copy, not just questions.
- A learner who clicks Sources from the ebook sees question-bank provenance,
  not the ebook footnotes promised by the ebook itself.
- Existing green static ebook tests are proxy coverage only; they do not cover
  the source-backed / every-claim-footnoted promise.

Recommended owner and acceptance:
- Owner: SETUP/site with CONTENT support for source wording.
- Either add visible ebook source notes/footnotes and a Sources-page ebook
  section covering the shipped ebook claims, or soften/remove the
  "source-backed chapters" and "every claim here is footnoted" copy until a
  real ebook citation model exists.
- Add an executable guard that fails when the ebook claims source-backed or
  footnoted coverage without corresponding ebook source metadata or a Sources
  page section.
- Keep this separate from question-bank source-citation parity, which is
  already guarded by `site/questions.js`.

## Verification Commands

Passed:
- `node --test tests/content-static-site-ebook-parity.test.js`
- `node scripts/export-site-question-bank.js --check`
- focused Node static inventory scan of ebook `ORDER`, `PRACTICE_LINKS`, and
  `window.SMT_CHAPTERS_META`
- `npm run validate:content`
- `npm run typecheck -- --pretty false`
- `npm run test:ownership`
- `git diff --check`
