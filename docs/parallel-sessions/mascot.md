# Lane: MASCOT-ART — mascot & visual identity redesign

## Purpose

The mascots currently look rough. Redesign them into a polished,
charming, cohesive visual identity that fits a playful but trustworthy
Swedish-civics product, and raise overall visual quality (illustration,
iconography, color, consistency).

## Direction

- Friendly, modern, **vector** (SVG) — scalable, crisp on web + native,
  small file size. No raster/AI-photo assets for the mascot itself.
- A small, consistent **expression/pose set** per mascot (idle, happy/
  correct, oops/incorrect, thinking, celebrate) so DELIGHT can animate
  reactions. Document the set.
- Cohesive palette derived from the existing design tokens
  (`lib/theme`, site styles) — Swedish-flag-adjacent but not garish;
  accessible contrast.
- A short **style guide** so future art stays consistent.

## Hard rules

- **Self-contained, license-clean** assets you author (SVG markup /
  code-generated). No copyrighted/third-party characters; no fabricated
  attribution.
- Presentation only — never touch `data/`, question logic, or scoring.
- Keep assets optimized (minified SVG, sane viewBox); no giant binaries
  committed.
- Provide each mascot as a reusable component/asset DELIGHT and the app
  can consume; coordinate via journals (don't break the UIUX leases).

## Writable scope

- `assets/mascots/**`, `assets/illustrations/**` (SVG)
- `components/mascot/**` (render components + expression API)
- `docs/design/mascot-style-guide.md`
- `site/` mascot assets only (the static landing site's mascot art)
- `docs/parallel-sessions/journals/mascot.md`

Never edit `data/`, `locales/`, scoring/question code, other lanes' docs.

## One iteration

1. Sync per `docs/parallel-sessions.md`.
2. Claim ONE atom from `codex-tasks/mascot.txt` (e.g.
   `primary mascot: base SVG + idle/happy/oops`, `style guide v1`,
   `replace placeholder mascot in <component>`).
3. Produce the asset/component; keep it optimized and consistent with
   the style guide.
4. Verify: `npm run typecheck` (component compiles); SVG renders (note
   how checked); bundle/file-size sane; `git diff --check`.
5. Commit → push → PR → squash-merge (`mascot: <asset>`), handoff to
   `journals/mascot.md`.

## Stop conditions

Rate limited; need a non-art code change (wrong lane → blocker);
ambiguous brand direction → ask in `codex-tasks/blockers.txt`, don't
guess wildly.
