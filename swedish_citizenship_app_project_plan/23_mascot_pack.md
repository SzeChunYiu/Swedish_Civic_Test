# 23 — Swedish Mascot Study Companion Pack

Status: BLUEPRINT
Source assets: provided by operator, generated via ChatGPT Plus (DALL·E).
Provenance + commercial license clean per OpenAI Plus terms of service.
Owners: `MASCOT-ART` lane (vectorization + style guide), `MANAGER-uiux` (companion picker UI), `MANAGER-build` (asset wiring + persistence), `DELIGHT` lane (animation hooks)
Reviewer personas: first-time-immigrant picker, returning user changing companion, screen-reader user.

## What ships

A pack of **10 Swedish cultural mascots** the user picks as their study
companion. Primary surface: **settings → Study companion picker**. Same
mascots reused across the app for visual identity and delight (empty
states, achievement unlocks, fact bubbles, chapter headers when
appropriate).

This blueprint covers:
- the asset pack itself (sourcing, vectorization, file budgets)
- the companion picker UX in settings
- secondary use surfaces
- the Swedish-cultural metadata each mascot carries

## The 10 mascots

| ID | Mascot | Cultural anchor | Pairs naturally with |
|---|---|---|---|
| `dala-horse` | Dalahäst | Dalarna folk craft, national symbol | Folk culture / regions / Sami |
| `kanelbulle` | Kanelbulle (cinnamon bun) | Fika, everyday Swedish culture | Daily routines / customs |
| `moose` | Älg | Wildlife, allemansrätten (right to roam) | Nature / environment |
| `tomte` | Tomte (Christmas gnome) | Folklore, winter holidays | Traditions / holidays |
| `salmon` | Lax | Lakes, fishing, geography | Geography / nature / food |
| `fika-cup` | Kaffekopp (fika cup) | Coffee culture, social life | Daily routines / social customs |
| `vasa-ship` | Vasaskeppet | Stockholm history, 1628 maritime icon | History / Stockholm |
| `midsummer-pole` | Midsommarstång | Midsummer celebration | Traditions / holidays |
| `lucia` | Lucia | December 13 candle procession | Christian traditions |
| `snowman` | Snögubbe | Winter, climate | Climate / seasons |

The cultural-anchor metadata is shipped in `lib/mascot/catalog.ts` so the
picker can render Sv + En descriptions ("Lucia — December 13 candle
procession") and the app can show context-appropriate companions in
chapter-relevant moments (this is OPT-IN per chapter, not a hard mapping).

## Sourcing + licensing

- Raw assets: 10 PNG images generated via ChatGPT Plus / DALL·E by the
  operator.
- License: per OpenAI ToS, paid-plan users own commercial rights to
  images they generate. Provenance is clean.
- Save originals to `assets/mascot/source/` (in repo, NOT git-lfs — they
  are reference, not runtime assets).

## Vectorization (REQUIRED — MASCOT-ART lane policy is SVG-only)

`docs/parallel-sessions/mascot.md` says: *"Vector (SVG) — scalable,
crisp on web + native, small file size. No raster/AI-photo assets for
the mascot itself."*

Workflow:
1. **Auto-trace pass** — Vectorizer.AI (cheapest) or Adobe Illustrator
   Image Trace. Output: rough SVG with too many anchor points.
2. **Cleanup pass** — manual simplification of paths (target < 200
   anchor points per mascot); flatten colors to a 6–8 swatch palette
   per mascot derived from the existing design tokens; ensure
   accessible contrast.
3. **Expression-set pass** — each mascot needs the expression set
   required by DELIGHT lane: `idle`, `happy` (correct), `oops` (wrong),
   `think`, `celebrate`. 5 SVGs per mascot × 10 mascots = 50 files.
4. **Optimization pass** — SVGO with the project's existing config.
   File-size budget per SVG: **< 8 KB**. Total mascot pack budget:
   **< 400 KB**.

Output paths:
- `assets/mascot/<id>/<expression>.svg` (e.g. `assets/mascot/lucia/idle.svg`)
- `assets/mascot/source/<id>.png` (the original raster reference, kept
  for re-vectorization when the style guide evolves)

## Companion picker UX (settings)

`app/settings.tsx` gets a new section: **"Study companion"** (Sv:
"Studievän"), positioned below language / above accessibility.

- Currently selected mascot rendered at 64×64 px on the left.
- "Change" button opens a modal grid of 10 mascots, 5 per row on phone /
  10 per row on tablet+. Each cell shows the `idle` expression at 80×80
  px with the Sv label below.
- Tap a mascot → it becomes the selected companion + the modal closes
  with a haptic + a brief `celebrate` animation on the next screen.
- A11y: `accessibilityRole="radio"`, `accessibilityLabel` includes the
  Sv label + the cultural anchor (e.g. "Älg, vild djur").

Persistence: new MMKV-backed `lib/storage/companionStore.ts` (separate
from settingsStore — its v1.0 shape is pinned). Stored as a string id;
fallback to `dala-horse` (most recognizable national symbol) if the id
is unknown after a future content change.

## Secondary surfaces (where the chosen companion appears)

| Surface | What appears | Mood |
|---|---|---|
| Onboarding final step | The selected companion waves / `celebrate` | Welcome |
| Empty state on `mistakes.tsx` | `idle` companion + "No mistakes yet" | Calm |
| Empty state on `dashboard.tsx` (blueprint 22) | `idle` companion + "Take a quiz to see stats" | Calm |
| Correct-answer reveal (DELIGHT-rec) | `happy` brief flash | Reward |
| Wrong-answer reveal (DELIGHT-rec) | `oops` brief flash | Empathy |
| Chapter completion | `celebrate` + chapter mastered toast | Reward |
| Badge unlock | `celebrate` next to badge | Reward |
| Mock pass result | `celebrate` + pass-line line | Reward |
| Fact-bubble between questions (DELIGHT) | `idle` mascot speaks the fact | Personality |
| Loading > 2s | `think` animation | Reassurance |

All secondary usages are **opt-in per surface**; nothing is forced. The
companion is the user's pet — they should want to see it, not have it
shoved at them every screen.

## File structure

```
assets/mascot/
  source/                    # raster originals (kept for re-vectorization)
    dala-horse.png
    kanelbulle.png
    ...
  dala-horse/
    idle.svg
    happy.svg
    oops.svg
    think.svg
    celebrate.svg
  kanelbulle/
    ...
```

```
lib/mascot/
  catalog.ts                 # MASCOT_CATALOG: id + Sv/En labels + descriptions
  expressions.ts             # MascotExpression type union
  useCompanion.ts            # hook reading the selected companion + helpers
lib/storage/
  companionStore.ts          # MMKV-backed selected companion id
components/mascot/
  Mascot.tsx                 # <Mascot id={...} expression={...} size={...} />
  CompanionPicker.tsx        # grid modal
```

## Acceptance test (executable)

```bash
# 1. Catalog has all 10 mascots with bilingual labels
grep -q "dala-horse" lib/mascot/catalog.ts
test "$(grep -cE "^\s+id:" lib/mascot/catalog.ts)" -eq 10

# 2. Each mascot has its 5 expressions on disk
for id in dala-horse kanelbulle moose tomte salmon fika-cup vasa-ship midsummer-pole lucia snowman; do
  for expr in idle happy oops think celebrate; do
    test -f "assets/mascot/$id/$expr.svg" || { echo "missing $id/$expr"; exit 1; }
  done
done

# 3. SVG size budget: each file under 8 KB
find assets/mascot -name "*.svg" -size +8192c -print -exec false {} +

# 4. Companion store exists
test -f lib/storage/companionStore.ts
grep -q "companion.selectedId.v1" lib/storage/companionStore.ts

# 5. Picker component + settings wiring
test -f components/mascot/CompanionPicker.tsx
grep -q "CompanionPicker" app/settings.tsx

# 6. Mascot rendering component + a11y
test -f components/mascot/Mascot.tsx
grep -q "accessibilityRole" components/mascot/CompanionPicker.tsx

# 7. tsc + lint
npx tsc --noEmit && npm run lint
```

## Product source paths

`lib/mascot/`, `lib/storage/companionStore.ts`, `components/mascot/`,
`app/settings.tsx`, `app/onboarding.tsx`, `assets/mascot/`, `tests/mascot/`.

## Reviewer hooks

- `--kind functional` — pick a companion in settings, close + reopen
  app → same companion persists.
- `--kind user-sim` — first-time-immigrant persona: cultural anchors
  understandable in Sv + En; nothing patronizing.
- `--kind a11y` — picker grid is keyboard / screen-reader navigable;
  each option announces its cultural anchor.
- `--kind data` — file-size budget enforced (8 KB per SVG, 400 KB total).
- `--kind language` — Sv label + cultural anchor wording is what a
  Swedish speaker would actually use (no awkward translations).

## Iteration plan (lane: `mascot-pack`)

1. **Asset prep** — vectorize 10 mascots × 5 expressions (50 SVGs).
   File-size pass. Commit to `assets/mascot/`.
2. **Catalog + store** — `lib/mascot/catalog.ts`, `lib/storage/companionStore.ts`,
   types, unit tests on selection persistence + fallback.
3. **Mascot component** — `<Mascot id expression size />` with SVG
   loader; a11y label from catalog; supports reduced-motion (static SVG
   instead of animation).
4. **Companion picker** — `<CompanionPicker />` modal grid + settings
   row.
5. **Secondary surfaces** — wire `happy/oops/celebrate/think/idle` into
   the surfaces listed above. Each in its own commit so reviewer can
   block any one without rolling back the others.

## Why this is its own blueprint (not lumped into DELIGHT)

DELIGHT lane animates and reacts; MASCOT-ART lane draws. This blueprint
is the **content + product spec** that bridges both: the catalog
metadata, the selection persistence, the picker UX, and the surface map.
DELIGHT wires the animations on top.

## Out of scope (explicit)

- AI-generated mascot expressions at runtime (the 5 expressions ship as
  pre-drawn SVGs; no in-app generation).
- User-uploaded custom mascots — privacy + moderation cost too high for
  the value.
- Chapter-mascot hard mapping (each chapter has one fixed mascot) —
  considered and rejected: many chapters don't have a natural single
  mascot, and forcing it creates awkward couplings. Soft "this chapter
  resonates with X mascot" hints stay on the table for later.
- Mascot voice lines (TTS reading the fact bubble) — DELIGHT may
  experiment; out of scope for v1.1.
