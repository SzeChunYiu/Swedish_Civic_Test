# Simplified Chinese Locale Bootstrap

Scope: `zh-Hans:bootstrap locales/zh-Hans/ + glossary.md`.

This directory is the Simplified Chinese localization workspace for
publication-quality Mainland Chinese translations of the Swedish civic-test
app. Copy should use formal but plain civic language: accurate enough for
citizenship-study material, readable for adult learners, and faithful to
Swedish institutions rather than forcing Mainland Chinese institutional
equivalents onto Sweden.

Use `glossary.md` as the authoritative term list before translating UI strings,
questions, chapters, legal/privacy copy, or store metadata. `zh-Hans` is a
Mainland Chinese deliverable, not a script conversion from Traditional Chinese.

## Phase-1 audit artifacts

- `phrasebook.md` contains candidate Simplified Chinese UI phrases for common
  controls, feedback, source labels, and safe encouragement. These strings are
  not wired into the app yet.
- `audit.md` records checked terminology/style decisions and the remaining
  release blockers before `zh-Hans` can be enabled.

Keep `zh-Hans` disabled until `docs/localization/readiness.json` marks UI,
question content, native review, CJK runtime/accessibility review, and the
release gate as complete.
