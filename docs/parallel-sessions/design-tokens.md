# DESIGN-TOKENS Lane — Sweden Citizenship Test Prep (UI/UX team)


## Role

You own the **design token system** in `lib/theme/`. Every color, spacing unit, font size, radius, shadow, and motion duration in the app must come from here. Hardcoded values elsewhere are bugs.

> **HARD EXCEPTION — Swedish flag colors (do not tokenize).** The
> Swedish flag's blue (≈ `#006AA7`) and yellow (≈ `#FECC00`) are
> **fixed national constants**. They must NEVER be theme/palette
> tokens and must NEVER change when the palette or theme changes
> (dark mode, accent swaps, palette switch). Expose them as immutable
> brand constants (e.g. `lib/theme/flag.ts` with literal hex), used
> verbatim by every flag rendering (flag band, hero, mascots,
> favicons, the static `site/`). Treat any flag element that recolors
> with the theme as a P0 bug. Other lanes consume these constants;
> do not "fix" the flag by routing it through tokens.

## Required reading every iteration

1. `DESIGN.md` — single source of truth.
2. `docs/parallel-sessions/UIUX_BOARD.md` — your acceptance rows + queue pointer.
3. `docs/parallel-sessions/journals/uiux-design-tokens.md` — prior handoffs.

## Writable scope

- `lib/theme/` (create if missing)
  - `lib/theme/colors.ts`
  - `lib/theme/spacing.ts`
  - `lib/theme/typography.ts`
  - `lib/theme/radius.ts`
  - `lib/theme/shadows.ts`
  - `lib/theme/motion.ts`
  - `lib/theme/index.ts` (re-export)
- `docs/parallel-sessions/journals/uiux-design-tokens.md`

## Forbidden paths

- `components/`, `app/`, `data/`, `types/`, `lib/motion/`, `lib/a11y/`.
- Anything outside `lib/theme/`.

## One-iteration cycle

Pick lowest-numbered task from `codex-tasks/uiux-design-tokens.txt`. Suggested initial queue:

1. **colors.ts** — Notion palette from DESIGN.md: `canvas`, `surface`, `text`, `textMuted`, `accent`, `border`, `success` (#1aae39), `warning` (#dd5b00), `correctBg`, `incorrectBg`. Each as a typed const with JSDoc citing DESIGN.md line.
2. **spacing.ts** — 8px base scale: `space[0..10]` mapping to multiples of 4/8 per DESIGN.md.
3. **typography.ts** — Inter weights/sizes/lineHeights per DESIGN.md. Export `text.h1`, `text.h2`, `text.body`, `text.caption`, `text.label` as `TextStyle` objects.
4. **radius.ts** — `radius.card = 8`, `radius.pill = 9999`, `radius.input = 4`.
5. **shadows.ts** — Multi-layer sub-0.05 opacity shadows. Export `shadow.card`, `shadow.elevated`.
6. **motion.ts** — Durations (`fast: 120`, `base: 200`, `slow: 320`) + easings.
7. **index.ts** — barrel export `export * from './colors'` etc.

After each: `npx tsc --noEmit`.

## Verification

```bash
npx tsc --noEmit && echo TS-OK
grep -rE "#[0-9a-fA-F]{6}|rgba?\(" components/ app/ 2>/dev/null | grep -v 'theme' | head -5
```
Second command should return nothing (no hardcoded colors outside `lib/theme/`). If hits exist, log them in journal so MANAGER can queue COMPONENTS/SCREENS refactors.

## Compact-safe stop rule

One file per iteration, verified, journaled, stop.

## Handoff format (append to `docs/parallel-sessions/journals/uiux-design-tokens.md`)

```
## Iteration <N> — <YYYY-MM-DD>
Task: <file created/updated>
Artifacts: <paths>
Verification: <command + result>
DESIGN.md citations: <lines/sections referenced>
Blocked? no/yes — <reason>
Next: <suggested next file or refactor>
```
