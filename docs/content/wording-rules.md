# Wording Rules — Sweden Civic Test Prep

**Audience:** every session writing or generating questions, options, explanations, ebook copy, UI strings, or onboarding text — in **any** language.

These rules are enforced via render-time text passes (`lib/quiz/questionText.ts`) and CI tests. New languages MUST follow the same rules from day one.

## 1. No redundant question-type prefixes

The UI already renders True/False buttons. Single-choice questions render A/B/C/D buttons. Flashcards flip. Stating the question type in the stem is redundant noise.

**Do not write:**
- `True or false: <statement>`
- `Sant eller falskt: <påstående>`
- 真假题：<陈述>
- صحيح أم خطأ: <عبارة>
- (any equivalent in any language)

**Do write:** the bare statement / question. The UI affords the answer type.

Existing data still containing these prefixes is stripped at render time. New content MUST NOT include them.

## 2. No nested-quote answer-judgement templates

The auto-derived template `"A correct answer to <question> is <answer>"` (and its Swedish equivalent `"Ett korrekt svar på frågan ... är ..."`) reads like a translation puzzle, not a question. **Forbidden in all languages.**

When a true/false variant of a single-choice question is needed, write a **flat declarative statement**:

| Bad (nested) | Good (declarative) |
|---|---|
| "True or false: A correct answer to 'Which statement about tax is correct?' is 'Only people who work pay tax'." | "Only people who work pay tax in Sweden." (answer: false) |
| "Sant eller falskt: Ett korrekt svar på frågan 'Vad är midsommar?' är 'En folkomröstning'." | "Midsommar är en folkomröstning." (svar: falskt) |

## 3. No source-authority phrasing in the question stem

Don't write `"according to the UHR material"`, `"enligt UHR-materialet"`, `"the UHR section says"`, or equivalents in the question text. The provenance belongs on a label/badge on the question card, not in the prose.

Source citation appears via `getQuestionSourceCitation()` as a separate UI element.

## 4. Natural prose, not literal translation

When translating from Swedish to another language (or vice versa), prefer **natural target-language phrasing** over literal word-for-word translation. A question must read as if a native speaker of the target language wrote it.

Specifically:
- Use idiomatic word order for the target language.
- Use punctuation native to the script (e.g., 中文 uses ：，。 not Latin `:` `,` `.`; Arabic uses ، ؛ ؟).
- Use grammatical gender/case appropriate to the target.
- Numbers, dates, and units in the target convention (e.g., 1 000 vs 1,000 vs 1٬000).

## 5. One concept per question

A question stem should test exactly one fact. If a stem requires two clauses joined by "and" / "och" / "和", split into two questions.

## 6. Source provenance must be honest

Every question carries a `provenance` field (once the schema migration lands):

- `'uhr'` — directly traceable to a chapter and section of UHR *Sverige i fokus*. Must have a populated `uhrReference`.
- `'derived'` — algorithmically generated variant of a UHR question (current `published-variant` tag). Must reference the source question id.
- `'editorial'` — hand-authored supplementary question (context expansion, historical clarification, common confusion). Must have `sourceNotes` explaining why it was added.

In **practice mode**, supplementary (non-`uhr`) questions are gated behind an opt-in toggle (default off). In **mock exam mode**, only `provenance === 'uhr'` questions are eligible.

## 7. Disclaimer is non-negotiable

Every screen showing questions must show the UHR disclaimer (see `docs/content-strategy.md`). Never claim official affiliation, never claim questions are real exam questions, never overclaim ("will appear on exam", "guaranteed correct").

## 8. Multilingual content schema

The current `PracticeQuestion` type hardcodes `questionSv` / `questionEn` pairs. The roadmap is to migrate to:

```ts
questionText: Record<LocaleCode, string>;
optionText: Record<LocaleCode, string>;  // per option
explanationText: Record<LocaleCode, string>;
```

When that lands, **every locale present in `lib/i18n/locales.ts` must be representable**. A missing translation falls back to the locale's `fallback` field, surfaced with a clear "Translation not yet reviewed" badge — never silently substituted without UI signal.

## 9. Tests are the enforcement layer

- `tests/content-question-speech-text-parity.test.js` mirrors the production strip patterns. Update both files when adding a new pattern.
- `tests/content-language-settings-parity.test.js` verifies every locale in the picker resolves.
- New rules in this doc should land with a paired test.

---

**See also:**
- `docs/content-strategy.md` — overall content rules
- `lib/quiz/questionText.ts` — production text pass
- `lib/i18n/locales.ts` — supported locales
- `AGENTS.md` — operator/manager/worker chain
