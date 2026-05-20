# UI preview v8 native-review packets

These are preview-only app UI copy review packets for the blocked localization target locales.

Do not use these packets to enable a locale. They exist so native reviewers can check natural wording, civic terminology, placeholders, accessibility labels, privacy/authority boundaries, monetization copy, script direction, punctuation, and runtime-risk notes before any readiness gate moves.

## Scope

- Source: typed preview-only objects under `lib/localization/*UiPreview.ts`.
- Review locales: `ar`, `ckb`, `fa`, `pl`, `so`, `ti`, `tr`, `uk`, `zh-Hans`, `zh-Hant`.
- Status: every source object must remain `preview_only_release_blocked`.
- Readiness: target locales remain `available=false`, `uiStrings=not_started`, and `releaseGate=blocked` in the readiness ledger.

## Reviewer instructions

For each row, check that:

1. target text is natural in the target language and not a literal English/Swedish calque,
2. civic terms such as UHR, Migrationsverket, and Riksdag are handled consistently,
3. the text does not promise official outcomes, citizenship, pass results, or authority endorsement,
4. placeholders in `{braces}` are preserved and grammatically usable,
5. accessibility labels are understandable when read by screen readers,
6. RTL/CJK/Ge'ez/script-specific punctuation and layout risks are noted, and
7. `native_review_status` remains `pending_native_review` until a reviewed copy records a reviewer decision.
