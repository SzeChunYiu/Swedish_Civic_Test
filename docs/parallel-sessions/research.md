# Lane: RESEARCH — comparative citizenship-test research → content enrichment

## Purpose

Make civic-test the deepest, most accurate Swedish citizenship-prep
product by researching how other countries run their citizenship/
naturalization tests — **especially the Nordics** — and turning findings
into concrete, sourced enrichment for our own content.

## What to research (priority order)

1. **Nordic**: Norway, Denmark, Finland, Iceland — citizenship/residence
   test structure, topic areas, question styles, difficulty, official
   study material, language requirements, recent reforms.
2. Germany (Einbürgerungstest), UK (Life in the UK), Netherlands, Canada,
   Australia, USA — structure and topic coverage.
3. Sweden's own UHR `medborgarskapsprov` framework, official sources,
   sample materials, and any updates.

## Hard rules

- **Never copy another country's question bank or copyrighted items.**
  Study *structure, topic taxonomy, pedagogy, difficulty calibration* —
  then design original Sweden-specific content. (Extends the standing
  competitive-distillation directive.)
- **Every claim is sourced.** Findings carry a citation (official site,
  statute, ministry doc, reputable reference) — URL or document + section.
  No unsourced assertions, no fabricated facts (see [[feedback_no_fabrication]]).
- Output is **proposals + sourced question candidates**, handed to the
  CONTENT lane via the queue — RESEARCH does not edit `data/` itself.

## Writable scope

- `docs/research/**` (findings, comparative tables, topic-gap analyses)
- `docs/research/question-candidates/**` (proposed SV+EN items with full
  UHR-style citations, ready for CONTENT to verify+import)
- `codex-tasks/content.txt` / `codex-tasks/open.txt` (append proposed
  CONTENT atoms — append only, do not rewrite others' lines)
- `docs/parallel-sessions/journals/research.md` (handoffs)

Never edit `data/`, `app/`, `components/`, `site/`, other lanes' docs.

## One iteration

1. Sync per `docs/parallel-sessions.md`.
2. Claim ONE atom from `codex-tasks/research.txt` (e.g.
   `nordic:norway test structure`, `gap:swedish-law topic coverage`).
3. Research it from primary/authoritative sources; capture citations.
4. Write the finding to `docs/research/…`; if it implies new/better
   questions, add original sourced candidates to
   `docs/research/question-candidates/` and queue a CONTENT atom.
5. Verify: links/citations resolve; `npm run typecheck` if any TS touched;
   `git diff --check`.
6. Commit → push → PR → squash-merge per protocol
   (`research: <topic>`), then handoff to `journals/research.md`.

## Stop conditions

Rate limited; source unverifiable (note it, don't fabricate); scope
outside RESEARCH → raise blocker.
