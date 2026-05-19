# Mascot Style Guide

## Role

The mascot system should make the citizenship prep app feel friendly, calm,
and credible. Mascots are study companions, not comic relief or official
authorities. They can encourage, react to answers, and point toward features,
but they must never imply that app content is government-issued or guaranteed.

## Art Direction

- Use self-authored SVG only for mascot art. Do not use raster images, traced
  third-party art, stock icons, or copyrighted characters.
- Keep the family modern, rounded, and Scandinavian: simple silhouettes, clean
  fills, small facial details, and restrained decoration.
- Prefer trustworthy over childish. Expressions should be warm and readable
  at 48-96 px without becoming exaggerated.
- Use stable geometry across expressions so DELIGHT can animate small changes
  without swapping to unrelated poses.
- Avoid national-symbol overload. Swedish blue and gold are accents; the
  whole character should not look like a flag.

## Mascot Family

Primary mascot: **Dala**

- A simplified Dala horse inspired study buddy.
- Shape language: sturdy body, arched neck, short legs, rounded muzzle, compact
  mane, and a small saddle panel.
- Personality: calm coach, proud when the learner succeeds, thoughtful when
  explaining mistakes.

Secondary mascot: **Lumi**

- A small lantern/bookmark companion for hints, source notes, and review mode.
- Shape language: rounded vertical body, soft glow panel, tiny page-ribbon feet.
- Personality: quiet helper, useful for study tips and source context.

## Palette

Base all mascot SVG colors on existing app and site tokens.

| Purpose | Token/source | Hex |
|---|---|---|
| Ink outline | `colors.text` / `--ink` | `#0b1f33` |
| Primary blue | `colors.swedishBlue` / `--blue` | `#006aa7` |
| Deep blue shadow | `colors.navy` / `--blue-deep` | `#003a5c` |
| Gold accent | `colors.swedishGold` / `--gold` | `#fecc00` |
| Soft gold fill | `colors.badgeBlueBg` / `--gold-soft` | `#fff3cf` |
| App surface | `colors.surface` / `--white` | `#ffffff` |
| Cool panel fill | `colors.surfaceWarm` | `#eaf0f7` |
| Border detail | `colors.border` | `#dbe3ec` |
| Success reaction | `colors.success` | `#1e874b` |
| Oops reaction | `colors.warning` | `#c77700` |
| Accent teal | `colors.teal` | `#0e7c8a` |
| Accent rose | `colors.pink` | `#b5527a` |

Usage ratios:

- 55-70% neutral surface/cool panel fills.
- 15-25% primary blue and deep blue.
- 5-10% gold.
- 5-10% expression or celebration accents.

Accessibility notes:

- Use `#0b1f33` for eyes, mouth, and essential outlines.
- Do not place gold text or line details on white.
- On dark site surfaces, retain ink outlines only when the character sits on a
  light body fill; otherwise use light surface strokes for edge separation.

## SVG Construction

- Default viewBox: `0 0 128 128` for full mascots.
- Icon-sized companions may use `0 0 64 64`, but keep proportions compatible
  with the 128 grid.
- Use semantic grouping IDs: `body`, `face`, `decor`, `expression`, `shadow`.
- Keep strokes rounded: `stroke-linecap="round"` and `stroke-linejoin="round"`.
- Prefer fills plus 2-4 px strokes over complex gradients.
- Gradients are allowed only for subtle glow or shadow and must remain under
  three stops.
- Avoid filters in reusable app assets. Static site hover shadows can be CSS.
- Keep each expression SVG under 12 KB before gzip where practical.

## Expression Set

Every mascot needs the same named expression API:

| Expression | Use | Visual changes |
|---|---|---|
| `idle` | Default state | relaxed eyes, small smile, neutral posture |
| `happy` | Correct answer | lifted cheeks, brighter eyes, subtle upward tilt |
| `oops` | Incorrect answer | softened eyes, small open mouth, no shame cue |
| `thinking` | Loading, hints, review | looking aside or down, one brow/ear tilt |
| `celebrate` | Streaks, milestone, completion | raised pose, gold/teal confetti accents |

Expression changes should be localized to face, head angle, and one or two
decor details. Do not redraw body proportions between expressions.

## Motion Handoff

- Animate translation, rotation, opacity, and scale only.
- Keep idle motion tiny: 2-4 px vertical movement or 2 degrees rotation.
- Respect reduced motion by showing the idle SVG without looping movement.
- Celebration confetti can animate independently from the mascot body.
- Oops motion should be a gentle settle, not a shake.

## Component Expectations

Future `components/mascot` work should expose a typed API similar to:

```ts
type MascotId = 'dala' | 'lumi';
type MascotExpression = 'idle' | 'happy' | 'oops' | 'thinking' | 'celebrate';
```

Components should accept size, expression, optional accessibility label, and
test ID. They should not own quiz state or scoring logic.

## File Naming

- SVG assets: `assets/mascots/<mascot>/<expression>.svg`
- Shared small accents: `assets/illustrations/mascot-<name>.svg`
- Render components: `components/mascot/<Name>Mascot.tsx`
- Public docs: this guide remains the source of truth for palette and poses.

## Quality Checklist

- Self-authored SVG and no external attribution needed.
- Uses only approved palette values or documented opacity variants.
- Reads clearly at 48 px, 64 px, and 96 px.
- Works on light app surfaces and dark site surfaces.
- Has matching `idle`, `happy`, `oops`, `thinking`, and `celebrate` variants.
- Runs through SVG optimization before commit.
- Does not touch content, scoring, question data, or localization files.
