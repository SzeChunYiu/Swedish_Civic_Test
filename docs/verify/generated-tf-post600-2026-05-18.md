# VERIFY generated true/false post-#600 recheck - 2026-05-18

Scope: focused current-output recheck after DATA-INTEGRITY PR #600 /
`476afdb` changed generated true/false stems. This report supersedes the
current-output status for the affected rows in the earlier q101-q150,
q651-q700, and q701-q720 reports, but does not replace those broader source
coverage reports.

Primary source opened: UHR, `Sverige i fokus`, official PDF:
https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf

Current output checked: `content/question-bank.csv` and `site/questions.js`
at `origin/main` commit `476afdb`.

Result: cited source support, answer keys, and ordinary distractors remain
acceptable for the checked rows. PR #600 cleared the positive
statement-about-statement true/false stems, but current output still contains
redundant true/false prefixes, false-statement answer/explanation mismatches,
negative statement-about-statement stems, and three previously routed grammar
defects.

## Cleared By #600

- `q150`: the question stem is now a direct Arctic Circle proposition in both
  Swedish and English, so the prior `Påståendet är sant:` / `The statement is
  true:` question-stem defect is cleared. It still remains a prefix-surface
  defect because the generated question begins with `Sant eller falskt:` /
  `True or false:`.
- `q166`: spot-checked as a cleared positive-stem row; the generated question
  now asks directly about Sweden's mild climate at its latitude. It still
  remains a prefix-surface defect for the same reason.
- `q714`: the question stem is now a direct Götaland/Svealand/Norrland
  proposition in both Swedish and English, so the prior positive meta-stem
  defect is cleared. It still remains a prefix-surface defect.

## Current Defects

- `q150`, `q166`, and `q714`: positive meta stems are cleared, but current
  generated/static question text still begins with the redundant true/false
  prefix already routed as `REVIEWER-GENERATED-TF-PREFIX-SURFACE-1`.
- `q151`, `q167`, `q235`, `q255`, `q331`, `q339`, `q439`, and `q715`: current
  generated false-statement rows still have answer/explanation or prefix
  defects covered by the q151-q200 post-#600 audit and its all-bank scan.
- `q266`, `q507`, and `q519`: current generated false-statement rows still
  publish `Det är inte sant att` / `It is not true that` question stems. These
  are facts about the truth value of another statement rather than direct
  learner-facing propositions.
- `q666` and `q667`: current English stems still splice gerund answer text
  after `it is common to`, producing `to eating` / `to lighting` phrasing.
- `q699`: current English stem still preserves a capitalized option fragment
  in mid-sentence, producing `celebrates The arrival of spring`.

These defects belong to DATA-INTEGRITY's generator, validator mirror, exported
CSV, and static-site mirror route. VERIFY did not edit generated output.

## Source Coverage

- `q150`, `q151`, `q166`, and `q167`: `Landet Sverige` / `Geografi, klimat
  och natur`, printed page 5, covering Sweden's northernmost part north of
  the Arctic Circle and the Gulf Stream/North Atlantic Current contribution to
  Sweden's milder climate.
- `q235` and `q255`: `Så här styrs Sverige` / `Staten`, printed page 12,
  covering the Riksdag choosing the prime minister and the opposition's role.
- `q266`: `Politiska val och partier` / `Folkomröstningar`, printed page 14,
  covering referendums as advisory.
- `q331`: `Mediernas roll` / `Fria medier`, printed page 20, covering the
  right to provide information to media and remain anonymous.
- `q339`: `Mediernas roll` / `Public service`, printed page 21, covering
  public-service independence from political and other interests.
- `q439`: `Välfärdssamhället` / `Kommunerna har ett stort ansvar`, printed
  page 31, covering municipalities offering older people support and help.
- `q507`: `Sverige och omvärlden` / `Sveriges försvar`, printed page 40,
  covering total defence including military and civil defence.
- `q519`: `En sekulär stat och ett mångreligiöst land` / `Religionsfrihet`,
  printed page 42, covering the 2000 separation of the state and the Church
  of Sweden.
- `q666` and `q667`: `Traditioner och högtider` / `Påsk`, printed page 45,
  covering Easter Saturday food and Easter eggs.
- `q699`: `Traditioner och högtider` / `Jul`, printed page 47, covering
  Christmas as traditionally celebrating Jesus' birth in Christianity.
- `q714` and `q715`: `Landet Sverige` / `Sveriges indelning`, printed page 6,
  covering Sweden's division into Götaland, Svealand, and Norrland.

## Ledger Update

Updated `docs/verify/ledger.md` at `476afdb`:

- `defect` / `queued-data-integrity-tf-prefix-surface`: `q150`, `q166`,
  `q714`
- `defect` / `queued-data-integrity-false-explanation+tf-prefix`: `q151`,
  `q167`, `q235`, `q255`, `q331`, `q339`, `q439`, `q715`
- `defect` / `queued-data-integrity-post600-negative-meta`: `q266`, `q507`,
  `q519`
- `defect` / `queued-data-integrity-residual`: `q666`, `q667`, `q699`
