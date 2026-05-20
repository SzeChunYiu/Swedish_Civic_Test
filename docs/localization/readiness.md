# Localization Readiness Ledger

Updated: 2026-05-20

This ledger prevents a common localization mistake: treating a source corpus or
style guide as if the language is ready for users. It is not. The corpus teaches
future sessions how to write naturally; a locale is only releasable after the app
strings, question content, glossary, accessibility labels, and culture/humor copy
are translated and reviewed.

Machine-readable source: `readiness.json`.
Validation command: `npm run test:localization-readiness`.

## Release rule

A target language may be marked `available: true` in `lib/i18n/locales.ts` only
when `readiness.json` records all of the following for that locale:

1. `uiStrings: "complete"`
2. `questionContent: "complete"`
3. glossary is complete or intentionally not required for a source locale
4. `nativeReview: "complete"` or source-locale equivalent
5. culture/humor review complete or source-locale equivalent
6. accessibility/runtime review complete, including RTL/CJK/script-specific checks
7. `releaseGate: "allowed"`

Until then, keep the locale visible as coming soon and fallback to English or
Swedish.

## Current status

| Locale | Picker available | Corpus/style guide | Locale workspace | App strings | Question content | Native review | Release gate |
|---|---:|---|---|---|---|---|---|
| `sv` | yes | source locale | not required | complete | complete | source | allowed |
| `en` | yes | complete round 1 | style-guide embedded | complete | complete | needs final reader review before major rewrite | allowed |
| `ar` | no | complete round 1 | phase-1 glossary/phrasebook/audit | not started | not started | missing | blocked |
| `fa` | no | complete round 1 | phase-1 glossary/phrasebook/audit | not started | not started | missing | blocked |
| `so` | no | complete round 1 | phase-1 glossary/phrasebook/audit | not started | not started | missing | blocked |
| `ti` | no | complete round 1 | phase-1 glossary/phrasebook/audit | not started | not started | missing | blocked |
| `pl` | no | complete round 1 | phase-1 glossary/phrasebook/audit | not started | not started | missing | blocked |
| `tr` | no | complete round 1 | phase-1 glossary/phrasebook/audit | not started | not started | missing | blocked |
| `zh-Hans` | no | complete round 1 | phase-1 glossary/phrasebook/audit | not started | not started | missing | blocked |
| `zh-Hant` | no | complete round 1 | phase-1 glossary/phrasebook/audit | not started | not started | missing | blocked |

## Corpus-only locale workspaces

These languages have source corpus/style-guide material and phase-1
glossary/phrasebook/audit workspaces, but they are not in `lib/i18n/locales.ts`
and therefore are intentionally absent from `readiness.json` until a future
picker/runtime decision adds them:

| Locale | Runtime picker | Corpus/style guide | Locale workspace | Release status |
|---|---:|---|---|---|
| `ckb` | no | complete round 1 | phase-1 glossary/phrasebook/audit | not eligible for enablement |
| `uk` | no | complete round 1 | phase-1 glossary/phrasebook/audit | not eligible for enablement |

## Next implementation order

1. Build `locales/<lang>/glossary.md` for target languages before UI strings.
2. Translate a small UI slice for one language at a time, starting with the most
   user-requested language, and keep it behind `available: false` until complete.
3. Translate question/content domains only after the domain's source cards and
   glossary terms exist.
4. Add native review notes and culture/humor decisions to the language corpus.
5. Enable the locale only in the PR that also updates this ledger to `allowed`.
