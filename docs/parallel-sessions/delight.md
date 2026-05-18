# Lane: DELIGHT — playful UX, fun, motion & special effects

## Purpose

Make civic-test genuinely **fun and playful**, not a dry crammer (see
[[project_civic_app_voice]]). Add delightful micro-interactions,
animations, special effects, and game-feel "fun points" that make
studying for the Swedish citizenship test enjoyable — without harming
correctness, accessibility, or load.

## What to build (examples, not exhaustive)

- **Juicy feedback**: satisfying correct/incorrect answer animations,
  streak counters, combo/score pops, confetti on milestones, subtle
  haptics (where supported), tasteful sound (opt-in, muted by default).
- **Progression fun**: daily streaks, XP/levels, badges for topic
  mastery, a "citizenship readiness" meter, gentle celebratory moments.
- **Personality**: the FACT-BUBBLE Swedish-humor tone, playful
  empty/loading/error states, easter eggs, friendly mascot reactions
  (coordinate with MASCOT-ART for assets — DELIGHT wires/animates them).
- **Special effects**: tasteful page/transition FX, parallax/aurora
  touches consistent with the existing site design tokens.

## Hard rules

- **Reduce-motion safe.** Every animation respects
  `prefers-reduced-motion`; provide a non-animated equivalent. Nothing
  blocks or delays answering a question.
- **Never change civic correctness.** Do not touch `data/` or question
  logic; effects are presentation only. A wrong answer must never look
  right because of an effect.
- **Performance budget**: no jank; lazy-load heavy FX; keep bundle/site
  weight sane (the landing site is static — keep it fast).
- Sound/haptics **off by default**, user-toggleable, remembered.
- Use existing design tokens/components; coordinate shared UI with the
  UIUX lanes (read their journals; don't fight leases).

## Writable scope

- `components/**` (delight/feedback/animation components)
- `app/**` wiring of those components (presentation only)
- `site/**` JS/CSS for landing-site FX (e.g. `site/fx.js`, styles)
- `lib/animation/**`, assets for effects
- `docs/parallel-sessions/journals/delight.md`

Never edit `data/`, `locales/`, `docs/research`, question/scoring logic.

## One iteration

1. Sync per `docs/parallel-sessions.md`.
2. Claim ONE atom from `codex-tasks/delight.txt` (e.g.
   `streak counter + milestone confetti`, `answer-result micro-anim`,
   `site hero parallax (reduced-motion safe)`).
3. Build it; verify reduced-motion path + that question correctness/flow
   is untouched.
4. Verify: `npm run typecheck`; relevant tests; manual reduced-motion
   check noted in handoff; `git diff --check`.
5. Commit → push → PR → squash-merge (`delight: <feature>`), handoff to
   `journals/delight.md`.

## Stop conditions

Rate limited; an effect needs `data/`/logic changes (→ wrong lane,
blocker); accessibility regression you can't avoid → stop, blocker.
