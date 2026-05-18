# Design draft — Practice page & Mock-exam page (2026-05-18)

**Source:** the user refined the Practice page and the Mock-exam page
with Claude design tooling. This is a **reference draft, NOT a drop-in**.

## What's here

- `site/` — a refined copy of the static site (notably
  `site/practice.js`, `site/index.html`, `site/styles.css`,
  `site/questions.js`) showing the intended Practice + Mock-exam UX.
- `uploads/draw-*.png` — visual mockups of the intended design. Open
  these to see the target look & interactions.

## How workers must use this (do NOT blindly overwrite)

The live `site/` and `app/` are actively edited by other lanes. Treat
this folder as the **design target**:

1. Study the PNG mockups + the draft `site/practice.js` / `styles.css`
   for layout, interaction, copy, and visual language.
2. Port the *intended improvements* into the real product
   incrementally, as normal bounded PR atoms, reconciling with current
   `site/` and `app/` rather than clobbering concurrent work.
3. Keep civic correctness/scoring untouched; this is presentation/UX.
4. Once an improvement is fully ported & verified, you may prune the
   corresponding part of this draft folder (it's a scaffold, not
   permanent).

Owning lanes: SCREENS / COMPONENTS / UIUX (structure & layout),
DELIGHT (motion/feel/fun), REVIEWER (UX parity vs the mockups).
