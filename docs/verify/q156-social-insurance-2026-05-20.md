# VERIFY q156/q780-q783 Social Insurance Check - 2026-05-20

Scope:
- Authored source row `q156` in `data/additionalQuestions.ts`.
- Current exported/static generated rows `q780`-`q783` in
  `content/question-bank.csv` and `site/questions.js`.
- Current commit inspected: `5a9c01b7`.
- Official source opened: UHR `Sverige i fokus` PDF,
  `Välfärdssamhället`, `Statligt finansierad välfärd`, printed p. 30.

Source support:
- The UHR source says welfare includes access to health care, education, and
  financial support during sickness or unemployment.
- The same section says the state finances pensions, sickness insurance,
  parental insurance, unemployment insurance, study support, child allowance,
  and higher education/research.
- It separately says regions offer health care and fund hospitals and health
  centres, while municipalities are responsible for schools, childcare, elder
  care, social services, and other local welfare.

Findings:

| Unit | Status | Evidence |
|---|---|---|
| q156 | ok | The current English prompt no longer says `state security systems`; `state-funded social insurance systems` is natural and faithful to `statliga trygghetssystem`. Correct option `a` matches the UHR state-financed welfare list. Distractors point to region, municipal, or private-credit concepts and are unambiguously wrong for the asked source fact. Swedish and English explanations are natural enough for this pass. |
| q780 | defect | Fact and answer key inherit q156 support, but generated single-choice wording starts with `Vilket svar stämmer bäst?` / `Which answer best matches?`, which is UI-afforded meta prompt text already tracked in `GENERATED-SINGLE-CHOICE-CHOOSE-PROMPT-CLEANUP-1` / related generated single-choice cleanup. |
| q781 | defect | Correct truth value is supported by q156's UHR source, but the true/false prompt is a bare noun list (`Sjukförsäkring, föräldraförsäkring och arbetslöshetsförsäkring.` / `Sickness insurance, parental insurance, and unemployment insurance.`), not a standalone proposition. Existing queue atom `GENERATED-TF-CH09-SOCIAL-INSURANCE-PHRASE-Q781-Q782-1` covers this exact defect. |
| q782 | defect | False truth value is supported because regional health care/public transport are not the state-financed social-insurance answer, but the true/false prompt is a bare noun list (`Vårdcentraler, sjukhus och regional kollektivtrafik.` / `Health centres, hospitals, and regional public transport.`), not a standalone proposition. Existing queue atom `GENERATED-TF-CH09-SOCIAL-INSURANCE-PHRASE-Q781-Q782-1` covers this exact defect. |
| q783 | defect | Fact and answer key inherit q156 support, but generated single-choice wording starts with `Välj rätt alternativ:` / `Choose the correct option:`, which is UI-afforded meta prompt text already tracked in `GENERATED-SINGLE-CHOICE-CHOOSE-PROMPT-CLEANUP-1`. |

No new owner queue atom was added: the current defects are already present in
`codex-tasks/open.txt`, and duplicating them would create noisy parallel work.

Ledger note:
- `docs/verify/ledger.md` still inventories 720 rows, while the current export
  has 795 rows. q780-q783 are therefore recorded in this focused report pending
  a full ledger inventory refresh.
