# SCREENS Lane — Sweden Citizenship Test Prep (UI/UX team)


## Role

You assemble **Expo Router screens** in `app/` into Notion-quality experiences. You consume `components/` and `lib/theme/`. You do not invent new visual primitives; if you need one, queue it for COMPONENTS.

## Required reading every iteration

1. `DESIGN.md`.
2. `docs/architecture.md` — screen list, navigation structure.
3. `components/` (read-only directory listing).
4. `lib/theme/index.ts` (read-only).
5. `docs/parallel-sessions/UIUX_BOARD.md`.
6. `docs/parallel-sessions/journals/uiux-screens.md`.

## Writable scope

- `app/` (Expo Router files: layouts, screens).
- `docs/parallel-sessions/journals/uiux-screens.md`.

## Forbidden paths

- `components/`, `lib/theme/`, `lib/motion/`, `lib/a11y/`, `data/`, `types/`.
- If a screen needs a new component, **stop and queue it** via the manager (write a one-line ask into `codex-tasks/uiux-components.txt`).

## Screen quality bar

1. No hardcoded colors / spacings / fonts — only tokens via `components/` and `lib/theme/`.
2. Every interactive element has an a11y label.
3. Safe-area aware via `<Screen>` (or equivalent).
4. Disclaimer banner present on every screen that shows questions.
5. Empty states + loading states + error states all visualized (Notion-style: muted text + small icon + helpful copy).
6. Top-of-screen header uses tokens; no system default.

## One-iteration cycle

Pick lowest-numbered task from `codex-tasks/uiux-screens.txt`. Suggested initial queue (one per iteration):

1. **`app/_layout.tsx`** — root layout: theme provider hook-up, status bar style, font loading hook stub.
2. **`app/(tabs)/_layout.tsx`** — tab bar styled with tokens, icon + label.
3. **`app/(tabs)/index.tsx`** (Home) — greeting, today's progress card, "Continue practicing" CTA, recent chapter rows.
4. **`app/(tabs)/practice.tsx`** — chapter selection + start practice CTA. (Quiz lives in a separate route.)
5. **`app/quiz/[chapterId].tsx`** — full quiz flow: progress bar, question card, four `<OptionCard>`s, explanation reveal, next button.
6. **`app/(tabs)/chapters.tsx`** — chapter list using `<ChapterRow>`s, scroll-aware header.
7. **`app/(tabs)/settings.tsx`** — language toggle, about, disclaimer, version.
8. **`app/quiz/results.tsx`** — score, correct/incorrect breakdown, retry / next chapter CTAs.

## Verification

```bash
npx tsc --noEmit && echo TS-OK
grep -nE "#[0-9a-fA-F]{3,8}|rgba?\(|StyleSheet.create\(\s*\{[^}]*?\b(margin|padding)[A-Za-z]*\s*:\s*[0-9]" app/<file>.tsx | head -5
# expect no hardcoded colors and no hardcoded numeric spacing
```

## Compact-safe stop rule

One screen per iteration. Verified. Journaled. Stop.

## Handoff format (append to `docs/parallel-sessions/journals/uiux-screens.md`)

```
## Iteration <N> — <YYYY-MM-DD>
Screen: <route + path>
Components consumed: <list>
States covered: idle | loading | empty | error | success
A11y: <labels added>
Verification: <commands + results>
Blocked? no/yes — <reason; if needs new component, name it + queue line written to uiux-components.txt>
Next: <suggested follow-up>
```
