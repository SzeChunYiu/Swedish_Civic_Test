# COMPONENTS Lane — Sweden Citizenship Test Prep (UI/UX team)


## Role

You build the **reusable component library** in `components/`. Every component must consume tokens from `lib/theme/` and ship with: explicit prop types, sensible defaults, accessibility props, and a Notion-quality visual.

## Required reading every iteration

1. `DESIGN.md` — visual language.
2. `lib/theme/index.ts` — available tokens (read only; DESIGN-TOKENS owns it).
3. `docs/parallel-sessions/UIUX_BOARD.md`.
4. `docs/parallel-sessions/journals/uiux-components.md`.

## Writable scope

- `components/` (and subdirs).
- `docs/parallel-sessions/journals/uiux-components.md`.

## Forbidden paths

- `lib/theme/` (read-only — request changes via UIUX_BOARD).
- `app/`, `data/`, `types/`, `lib/motion/`, `lib/a11y/`.

## Component delivery contract

For every component:

1. Functional component, named export, TypeScript props interface in same file.
2. All visual values from `lib/theme/` — no hardcoded colors, spacing, radius, shadow.
3. Accessibility: `accessibilityRole`, `accessibilityLabel` (or accept as prop), `accessibilityState` for stateful controls.
4. Pressable elements use `Pressable` with `hitSlop` and pressed-state styling from tokens.
5. Default props documented in JSDoc above the interface.

## One-iteration cycle

Pick lowest-numbered task from `codex-tasks/uiux-components.txt`. Suggested initial queue (one per iteration):

1. **`<Surface>`** — base white/warm-white card wrapper with optional border + shadow.
2. **`<Text>`** — Inter text with `variant` prop (`h1|h2|body|caption|label`) using `typography` tokens.
3. **`<Button>`** — primary (accent blue) / secondary (border) / ghost variants; sm/md/lg sizes; loading + disabled states.
4. **`<OptionCard>`** — quiz answer option: idle / selected / correct (green) / incorrect (red border) states. Pressable. A11y as radio.
5. **`<PillBadge>`** — XP/streak counter (radius.pill). Variants: neutral / accent / success / warning.
6. **`<ProgressBar>`** — accent fill, rounded, animated width (uses `lib/motion/` once available — until then static).
7. **`<ChapterRow>`** — Notion-style list row: title + secondary text + chevron.
8. **`<DisclaimerBanner>`** — required independent-app disclaimer; subtle warm surface, small caption text.
9. **`<Screen>`** — page wrapper with safe area + padding tokens.
10. **`<Divider>`** — whisper-thin border token.

## Verification

```bash
npx tsc --noEmit && echo TS-OK
# token discipline check on the file you just touched:
grep -nE "#[0-9a-fA-F]{3,8}|rgba?\(|\b[0-9]+\s*,\s*[0-9]+\s*,\s*[0-9]+\)" components/<file>.tsx && echo "HARDCODED — FIX" || echo "tokens-only OK"
```

## Compact-safe stop rule

One component per iteration. Verified. Journaled. Stop.

## Handoff format (append to `docs/parallel-sessions/journals/uiux-components.md`)

```
## Iteration <N> — <YYYY-MM-DD>
Component: <name + path>
Variants/states implemented: <list>
Tokens used: <colors.*, spacing.*, typography.*, ...>
A11y props: <list>
Verification: <commands + results>
Blocked? no/yes — <reason>
Next: <suggested follow-up>
```
