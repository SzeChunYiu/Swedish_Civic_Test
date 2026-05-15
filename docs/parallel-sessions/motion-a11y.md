# MOTION-A11Y Lane — Sweden Citizenship Test Prep (UI/UX team)


## Role

You build **motion utilities** in `lib/motion/` and **accessibility utilities** in `lib/a11y/`. Components and screens consume your hooks/utilities; you do not edit them.

## Required reading every iteration

1. `DESIGN.md` (motion + a11y sections).
2. `lib/theme/motion.ts` (durations/easings — DESIGN-TOKENS owns).
3. `docs/parallel-sessions/UIUX_BOARD.md`.
4. `docs/parallel-sessions/journals/uiux-motion-a11y.md`.

## Writable scope

- `lib/motion/`
- `lib/a11y/`
- `docs/parallel-sessions/journals/uiux-motion-a11y.md`.

## Forbidden paths

- `lib/theme/`, `components/`, `app/`, `data/`, `types/`.

## Delivery contract

1. All durations/easings imported from `lib/theme/motion.ts` (not hardcoded).
2. Respect `AccessibilityInfo.isReduceMotionEnabled()` — utilities must short-circuit animations to instant when reduce-motion is on.
3. Hooks named `useX` per React rules. No side effects at module scope.
4. A11y utilities use React Native's `AccessibilityInfo` API; no platform-specific hacks unless documented.

## One-iteration cycle

Pick lowest-numbered from `codex-tasks/uiux-motion-a11y.txt`. Suggested initial queue (one per iteration):

1. **`lib/motion/useReducedMotion.ts`** — hook returning current reduce-motion preference, subscribes to changes.
2. **`lib/motion/useFadeIn.ts`** — fade-in `Animated.Value` driver respecting reduce-motion.
3. **`lib/motion/useSpringPress.ts`** — scale-down-on-press spring for buttons/cards.
4. **`lib/motion/useProgress.ts`** — animated numeric progress (0→target) with reduce-motion fallback to instant.
5. **`lib/a11y/announce.ts`** — wrapper around `AccessibilityInfo.announceForAccessibility` with debounce.
6. **`lib/a11y/focusOrder.ts`** — helpers for setting `accessibilityElementsHidden` / `importantForAccessibility` on overlay/modal patterns.
7. **`lib/a11y/contrast.ts`** — pure function: given two token colors, return WCAG ratio; export `assertAA(fg, bg)` for dev-time checks.
8. **`lib/motion/haptics.ts`** — thin wrapper over `expo-haptics` with semantic names (`tapLight`, `correct`, `incorrect`).
9. **`lib/motion/index.ts`** + **`lib/a11y/index.ts`** — barrel exports.

## Verification

```bash
npx tsc --noEmit && echo TS-OK
# reduce-motion respected:
grep -n "isReduceMotionEnabled\|useReducedMotion" lib/motion/<file>.ts && echo "reduce-motion handled"
```

## Compact-safe stop rule

One utility/hook per iteration. Verified. Journaled. Stop.

## Handoff format (append to `docs/parallel-sessions/journals/uiux-motion-a11y.md`)

```
## Iteration <N> — <YYYY-MM-DD>
Utility: <name + path>
Public API: <exported names + signatures>
Reduce-motion handling: yes/N/A — <how>
Verification: <commands + results>
Blocked? no/yes — <reason>
Next: <suggested follow-up>
```
