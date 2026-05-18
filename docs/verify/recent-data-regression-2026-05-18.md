# Recent Data Regression Audit - 2026-05-18

Scope: `regress:re-check the 10 most recently changed data/ items for
re-broken facts` from `codex-tasks/verify.txt`, run by CONTENT-VERIFY Pane 3
on current `origin/main` commit `d468f31`.

Selection method: `git log --oneline -- data` was used to identify the most
recent question-level source records touched in `data/` commits. The checked
records are `q144`, `q124`, `q123`, `q114`, `q018`, `q108`, `q109`, `q143`,
`q142`, and `q070`.

Primary source opened: UHR, `Sverige i fokus`, official PDF:
https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf

PDF evidence: `pdfinfo` reported the official file as `Sverige i fokus`, 48
pages, created 2026-04-23 and modified 2026-05-07. `pdftotext -layout` was
used to inspect the cited printed pages 6, 12, 30, 42, 43, 46, and 47.

Result: no new content defect filed. The ten source questions remain traceable
to their cited UHR chapter/section/page, the marked answers are supported, the
distractors are clearly wrong, and current canonical/static output matches for
the checked source rows. Existing generated-output follow-ups and the unleased
authored true/false-prefix cleanup remain under their existing routes; this
regression pass did not reopen or duplicate those routes.

## Checked Rows

| ID | Recent data commit | UHR support checked | Result |
|---|---|---|---|
| `q144` | `38e4a45` | `Landet Sverige` / `Sveriges indelning`, printed page 6: 25 landskap, former legal role, and distinction from 21 län, 290 kommuner, and three landsdelar. | ok |
| `q124` | `67847d4` | `Traditioner och högtider` / `Sveriges nationaldag`, printed page 46: Gustav Vasa elected king on 6 June 1523 and the 1809 Instrument of Government. | ok |
| `q123` | `f15404a` | `En sekulär stat och ett mångreligiöst land` / `Hinduism och buddhism`, printed page 43: Buddhists and Hindus in Sweden mainly among immigrants from countries where those religions are large. | ok |
| `q114` | `f5454ba` | `En sekulär stat och ett mångreligiöst land` / `Hinduism och buddhism`, printed page 43: 20th-century contacts through travel to Asia and interest in meditation/yoga. | ok |
| `q018` | `76b3bde` | `Så här styrs Sverige` / `Staten`, printed page 12: the Riksdag chooses the prime minister, who forms the government. | ok |
| `q108` | `d86717e` | `En sekulär stat och ett mångreligiöst land` / `Hinduism och buddhism`, printed page 43: Buddhist and Hindu congregations and temples in different places in Sweden. | ok |
| `q109` | `b2c4e5d` | `En sekulär stat och ett mångreligiöst land` / `Religionens roll`, printed page 42 and continuation on page 43: religion's social role has decreased while attention to religious questions and represented religions has increased. | ok |
| `q143` | `98bc031` | `Landet Sverige` / `Sveriges indelning`, printed page 6: Götaland, Svealand, and Norrland, including Norrland's large share of Sweden's area. | ok |
| `q142` | `4636321` | `Landet Sverige` / `Skogar, sjöar och öar`, printed page 6: Sweden has about 250,000 islands, more than any other country. | ok |
| `q070` | `6d2bd46` | `Välfärdssamhället` / `Skatter för Sveriges välfärd`, printed page 30: tax is paid by workers and companies, and VAT is paid on goods and services. | ok |

## Current Output Check

- Checked the ten IDs in the generated site question bank and the committed
  `site/questions.js`.
- Confirmed the expected source chapter, section, printed page, and answer
  index for every target row.
- Confirmed no learner-visible `Sant eller falskt:` / `True or false:` prefix
  remains in the target rows, including `q143`.
- Confirmed the ten static rows match the generated canonical text for stems
  and explanations.

Focused assertion result:

```text
recent-data regression rows OK (10): q144:single_choice:Sveriges indelning:answer0, q124:single_choice:Sveriges nationaldag:answer0, q123:single_choice:Hinduism och buddhism:answer0, q114:single_choice:Hinduism och buddhism:answer0, q018:single_choice:Staten:answer0, q108:single_choice:Hinduism och buddhism:answer0, q109:single_choice:Religionens roll:answer0, q143:true_false:Sveriges indelning:answer0, q142:single_choice:Skogar, sjöar och öar:answer0, q070:single_choice:Skatter för Sveriges välfärd:answer0
```

## Ledger Update

Updated `docs/verify/ledger.md` authored-source rows `q018`, `q070`, `q108`,
`q109`, `q114`, `q123`, `q124`, `q142`, `q143`, and `q144`:

- `Last verified commit`: `d468f31`
- `Status`: `ok`
- `Next recheck`: `recent-data-regression`
