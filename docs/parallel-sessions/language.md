# Lane: LANGUAGE — native-quality multilingual localization

## Purpose

Translate **all** user-facing civic-test material — questions, answer
options, explanations, UHR source notes, the ebook chapters, UI strings,
the landing/marketing site, store metadata, privacy/legal copy — into the
target languages at **native, publication quality**.

## Non-negotiable quality contract

0. **Research the native language BEFORE writing (mandatory first step).**
   Every translation atom begins with a documented research pass — you do
   not start writing until it is done. Research and record (in the handoff
   and `locales/<lang>/glossary.md`):
   - The target locale's **civic/officialese register** — how government,
     citizenship, law and rights are actually phrased for that audience
     (formal but plain; the register a real authority/textbook uses).
   - **Authoritative terminology** for institutions and legal concepts:
     prefer the official/government-recognized rendering in that locale;
     cite the source you took it from.
   - **Regional lexical choice, not just script.** Languages with variants
     differ in *word choice*, not orthography alone. Simplified Chinese as
     used in **Mainland China** vs Traditional as used in **Taiwan/Hong
     Kong** pick different words for the same concept (e.g. 软件/軟體,
     信息/資訊, 网络/網路, 打印/列印, PRC vs ROC institutional names),
     plus punctuation and measure-word conventions. The same applies to
     other pluricentric languages (Persian: Iran Farsi vs Afghan Dari;
     Kurdish Sorani regional usage; Arabic MSA vs audience expectations).
     Translate into the *specific* variant's native usage — never the
     "other" variant's vocabulary, and never a mechanical script convert.
   - Known false friends / civic terms that mistranslate if taken literally.
   A translation atom whose handoff has no research notes is rejected by
   the manager regardless of how fluent the prose looks.

1. **Native fluency, not mechanical translation.** Every string must read
   as if written by an educated native speaker of that language for that
   audience. Literal/word-for-word or machine-style output is a defect and
   must be rejected by the manager. Localize idioms, register, and civic
   terminology — do not transliterate.
2. **One language = one owner pane.** A pane owns a single target language
   for its iteration. Do not edit another language's files.
3. **Meaning + legal accuracy preserved.** The Swedish citizenship facts,
   UHR citations, dates, institution names, and the correct answer must
   remain exactly correct after translation. When an official term has a
   recognized rendering in the target language, use it; otherwise keep the
   Swedish term with a native gloss in parentheses on first use.
4. **Two-pass rule.** No translation atom is "done" until a second
   independent native-read pass (a different pane or the manager if native)
   confirms it reads naturally and is meaning-faithful. Single-pass output
   is not acceptable for shipping.
5. **Terminology consistency.** Maintain `locales/<lang>/glossary.md` — a
   shared term list (e.g. *medborgarskap*, *riksdag*, *grundlag*) with the
   agreed native rendering. Reuse it; never re-coin a term that's in the
   glossary.
6. **No fabrication.** If a source string is ambiguous, translate
   conservatively and note the ambiguity in the handoff — never invent
   civic facts to make a sentence flow.

## Shared localization research shelf

Before any language atom, check `docs/localization/README.md` and the relevant
`docs/localization/sample-corpus/<lang>/` notes. Add source cards there when you
find official documents, public-service pages, articles, or tone samples worth
reusing. Keep long copied passages out of the repo; record links, metadata,
short micro-samples, style observations, and terminology decisions.

The research shelf is where future sessions learn how real people write in each
language and how jokes, encouragement, civic terms, and official register should
be localized rather than mechanically translated.

## Target languages (priority order)

Largest Sweden citizenship-prep audiences first. Manager assigns one
unclaimed language per worker pane per iteration:

1. Arabic (`ar`)
2. Persian — Farsi/Dari (`fa`)
3. Somali (`so`)
4. Tigrinya (`ti`)
5. Kurdish — Sorani (`ckb`)
6. English (`en`)
7. Polish (`pl`)
8. Ukrainian (`uk`)
9. Chinese — Simplified (`zh-Hans`)
10. Chinese — Traditional (`zh-Hant`)

**Chinese-specific rule:** `zh-Hans` and `zh-Hant` are distinct
deliverables, never a script-conversion of each other — each must read as
written by a native speaker of that variant (Mainland vs. Taiwan/Hong Kong
conventions: vocabulary, phrasing, civic terminology, punctuation 。，
vs ., measure words, and register). Mechanical Simplified↔Traditional
conversion is a defect. Both owned by panes fluent in that specific
variant.

(Ramp adds more as panes/sessions scale. The multi-language UI picker
shipped in #141 is the minimum coverage target.)

## Writable scope

- `locales/<lang>/**` (translation JSON/MD per language)
- `docs/ebook/<lang>/**` (translated ebook chapters)
- `locales/<lang>/glossary.md`
- `docs/parallel-sessions/journals/language.md` (handoffs)

Never edit `data/` (source questions — owned by content), `app/`,
`components/`, `site/` source, or another language's `locales/` dir.

## One iteration

1. Sync per the shared protocol (`docs/parallel-sessions.md`).
2. Read `codex-tasks/language.txt`; claim ONE unclaimed `<lang>:<scope>`
   atom (e.g. `ar:questions q001-q020`, `fa:ebook ch3`, `so:ui-strings`).
3. **Research the target language first** (contract item 0): study the
   locale's civic register, authoritative terminology, and regional
   word-choice; update `locales/<lang>/glossary.md` with sourced terms
   BEFORE translating. Skipping this is an automatic rejection.
4. Translate that bounded slice to native quality using the researched
   glossary — in the specific variant's native vocabulary.
5. Self-review as a native reader; then run the verification below.
6. Commit, push, PR, squash-merge per the protocol (`<lang>: <scope>`),
   e.g. `git commit -m "ar: native questions q001-q020"`.
7. Append a handoff to `journals/language.md` including: language, scope,
   glossary terms added, the second-pass reviewer, residual ambiguities.

## Verification (must pass before commit)

- `npm run typecheck` (locale files must parse / keys must match source).
- Key-parity check: every source key has a target key, no missing/extra.
- No untranslated source-language leakage in the target file (spot-grep
  for Swedish stop-words in non-`sv` locale; flag, don't auto-strip).
- Glossary terms used consistently (grep the agreed rendering).
- `git diff --check`.

## Stop conditions

- Rate limited → stop, journal progress.
- Source string ambiguous and no safe conservative rendering → stop,
  raise in `codex-tasks/blockers.txt` (do not guess civic facts).
- Target language not owned by you / file outside scope → stop.
