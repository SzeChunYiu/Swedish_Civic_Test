# Lane: VERIFY — recursive content verification

## Purpose

Independently re-verify **every** piece of shipped content, recursively
and on a rolling basis — questions, answer options, explanations, UHR
citations, ebook text, translated locales — so nothing incorrect,
unsourced, or unnatural stays in `main`. This lane assumes prior
acceptance can be wrong and re-checks it.

## What "verified" means (all must hold)

1. **Factually correct** against the cited Swedish civic source.
2. **Citation valid**: the UHR/official reference actually exists and
   actually supports the stated fact (open it, don't trust the label).
3. **Correct answer is correct** and distractors are unambiguously wrong.
4. **Naturally written** in its language (for locales: native, per
   `language.md` — flag mechanical translation).
5. **No regression**: a previously-fixed item hasn't been re-broken by a
   later edit.

## Recursive / rolling rule

- Maintain `docs/verify/ledger.md`: every content unit, last-verified
  commit, status (`ok` / `defect` / `restate`), next-recheck.
- Each iteration: re-verify the **oldest-unchecked** slice AND anything
  changed since its last check (follow the git history of `data/` and
  `locales/`). Coverage must keep cycling — never "done".
- A defect → file a precise fix atom in the owning lane's queue
  (`content.txt` for `data/`, `language.txt` for `locales/`), with the
  source proving the defect. Do not fix cross-lane content yourself;
  VERIFY's own commits are the ledger + defect queue.

## Writable scope

- `docs/verify/**` (ledger, audit reports)
- `codex-tasks/<owning-lane>.txt` / `codex-tasks/blockers.txt`
  (append defect atoms — append only)
- `docs/parallel-sessions/journals/verify.md`

Never edit `data/`, `locales/`, `app/`, `components/`, `site/` directly —
VERIFY reports and queues, owners fix.

## One iteration

1. Sync per `docs/parallel-sessions.md`.
2. Pick the oldest-unverified / recently-changed slice from
   `docs/verify/ledger.md` (or `codex-tasks/verify.txt`).
3. Re-verify against primary sources using the 5 criteria. Open every
   citation. Treat prior acceptance as unproven.
4. Update `docs/verify/ledger.md`; queue precise sourced defect atoms for
   owners; escalate systemic issues to `codex-tasks/blockers.txt`.
5. Verify: `npm run typecheck` if TS touched; citations resolve;
   `git diff --check`.
6. Commit → push → PR → squash-merge (`verify: <slice>`), handoff to
   `journals/verify.md`.

## Stop conditions

Rate limited; can't access a source (note, don't assume pass); scope
outside VERIFY → blocker.
