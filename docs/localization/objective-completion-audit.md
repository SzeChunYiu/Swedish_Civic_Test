# Localization Objective Completion Audit

Updated: 2026-05-20

Status: **not complete**. This audit exists so future sessions do not confuse the
source-corpus/phase-1 copy work with finished localization.

## Objective restated as concrete success criteria

The user asked for non-mechanical localization across the civic-test project's
translated languages. Concrete deliverables are:

1. For each translated/target language, gather useful official or public-service
   language samples into organized project folders.
2. Learn and document the register, culture, humor boundaries, and word-choice
   conventions for each language.
3. Check words/phrases in the current non-Swedish language surfaces for
   mechanical translation and culturally weak jokes.
4. Improve the actual website/app language, not just write planning docs.
5. Keep non-ready locales fail-closed until UI strings, question content,
   accessibility/runtime checks, and native review are complete.
6. PR and merge each completed round to `main` with validation evidence.

## Prompt-to-artifact checklist

| Requirement | Evidence inspected | Current result | Covered? |
|---|---|---:|---:|
| Organized sample folders per target language | `docs/localization/sample-corpus/*/{README.md,sources.tsv,style-guide.md}` exists for `ar`, `ckb`, `en`, `fa`, `pl`, `so`, `ti`, `tr`, `uk`, `zh-Hans`, `zh-Hant` | Source-corpus round 1 exists. | yes, round 1 |
| Official/public-service source choices recorded | `docs/localization/source-materials.md` and per-language `sources.tsv` files | Each corpus has source rows and rationale. | yes, round 1 |
| Culture/humor/register documented | per-language `style-guide.md` files plus `locales/*/phrasebook.md` | All corpus languages have style guides; all target/corpus workspaces have phrasebooks/audits except source English uses embedded style-guide treatment. | yes, phase 1 |
| Word-level glossary/audit workspaces | `locales/{ar,ckb,fa,pl,so,ti,tr,uk,zh-Hans,zh-Hant}/` | README, glossary, phrasebook, and audit files exist for all listed language workspaces. | yes, phase 1 |
| Runtime fail-closed state | `docs/localization/readiness.json`; `lib/i18n/locales.ts`; `node --test scripts/localization-readiness.test.js` | Picker targets `ar/fa/so/ti/pl/tr/zh-Hans/zh-Hant` are unavailable and blocked; test passes. | yes |
| Actual website/static copy improvement | `site/i18n-extras.js`; `scripts/static-site-i18n-extras-cultural-copy.test.js` | Static extra copy improved for `zh-Hans`, `zh-Hant`, `ar`, `fa`, `pl`, `so`, `ti`, `tr`, `uk`; guard covers pass/passport slogans, Turkish outcome promises, and Chinese punctuation. | partial |
| Actual app UI strings translated | `docs/localization/readiness.json` has `uiStrings: "not_started"`; `lib/i18n/locales.ts` and `components/ui/LanguagePicker.tsx` include native coming-soon badges for all blocked picker target locales | Full app UI translations are not done; only a tiny language-picker unavailable badge slice exists for blocked picker target locales. | partial |
| Question bank and answer explanations translated | `docs/localization/readiness.json` has `questionContent: "not_started"` for target picker locales | No target-language question/content translation is complete. | no |
| Accessibility labels and screen-reader text translated | readiness entries show `missing`, `missing_rtl_runtime_review`, `missing_cjk_runtime_review`, or `missing_geez_script_review` | Accessibility/runtime review remains missing. | no |
| Native review completed | readiness entries show `nativeReview: "missing"` for target picker locales | Native review is missing. | no |
| Release gates allowed for target languages | readiness entries show `releaseGate: "blocked"` for all unavailable targets | Correctly blocked; not release-ready. | blocked by design |
| PR and merge after each round | Recent merged PRs include source corpus, style guides, glossary/audit packs, readiness summary, and static copy rounds | Rounds are merged to `main`; CI red is unrelated typecheck before localization tests. | yes for completed rounds |

## Current state snapshot

Runtime readiness, inspected from `docs/localization/readiness.json` on
2026-05-20:

| Locale | Available | Corpus | Glossary/audit | UI strings | Question content | Native review | Accessibility/runtime | Gate |
|---|---:|---|---|---|---|---|---|---|
| `sv` | yes | source | source | complete | complete | source | complete | allowed |
| `en` | yes | complete round 1 | embedded in style guide | complete | complete | needs final reader review before major rewrite | complete for current surfaces | allowed |
| `ar` | no | complete round 1 | phase 1 | not started | not started | missing | missing RTL runtime review | blocked |
| `fa` | no | complete round 1 | phase 1 | not started | not started | missing | missing RTL runtime review | blocked |
| `so` | no | complete round 1 | phase 1 | not started | not started | missing | missing | blocked |
| `ti` | no | complete round 1 | phase 1 | not started | not started | missing | missing Ge'ez script review | blocked |
| `pl` | no | complete round 1 | phase 1 | not started | not started | missing | missing | blocked |
| `tr` | no | complete round 1 | phase 1 | not started | not started | missing | missing | blocked |
| `zh-Hans` | no | complete round 1 | phase 1 | not started | not started | missing | missing CJK runtime review | blocked |
| `zh-Hant` | no | complete round 1 | phase 1 | not started | not started | missing | missing CJK runtime review | blocked |

Corpus-only workspaces outside the runtime picker:

| Locale | Workspace status | Release status |
|---|---|---|
| `ckb` | phase-1 glossary/phrasebook/audit exists | not in picker/readiness yet |
| `uk` | phase-1 glossary/phrasebook/audit exists | static extra surface added; not in native picker/readiness yet |

## Recent merged evidence

- `#1614` improved Simplified and Traditional Chinese static-site copy and added
  the cultural-copy guard.
- `#1617` improved Arabic and Somali static-site copy and extended the guard.
- `#1619` added this objective audit and explicitly marked the broader objective incomplete.
- `#1620` added native Chinese coming-soon badges while keeping Chinese fail-closed.
- `#1611` summarized phase-1 readiness status.
- `#1602`, `#1603`, `#1606`, `#1607`, and `#1608` closed the remaining
  phase-1 glossary/audit workspaces for Polish, Tigrinya, Traditional Chinese,
  Ukrainian, and Sorani.

## Missing work before this objective can be called complete

1. Translate actual app UI strings for one target language at a time, starting
   with a bounded surface such as settings + language picker.
2. Translate question bank and explanations by content domain; do not enable the
   language while content remains incomplete.
3. Add accessibility labels and screen-reader strings for the translated surface.
4. Run script-specific runtime reviews: CJK layout for `zh-Hans`/`zh-Hant`, RTL
   for `ar`/`fa`, Ge'ez rendering for `ti`, and expansion/wrapping checks for all.
5. Obtain or record native review for each language before moving any release
   gate to `allowed`.
6. Continue replacing static/app mechanical copy for languages beyond the current
   static extra surface (any future `ckb` picker
   addition).

## Recommended next round

After the native coming-soon badge slice, continue with a larger but still
bounded `zh-Hans` app UI surface because the original user complaint came from a
native Chinese speaker:

1. Translate settings + language-picker modal copy into native Simplified Chinese
   in a preview/testable structure without adding `zh-Hans` to `AppLanguage` or
   making it selectable.
2. Keep `zh-Hans.available=false`, `uiStrings=not_started`, and
   `releaseGate=blocked` until all app UI/content/native/accessibility blockers
   are closed.
3. Add targeted tests proving fallback/blocking still works and the translated
   slice avoids pass/passport outcome promises.
4. PR and merge the slice before moving to question content or another language.
