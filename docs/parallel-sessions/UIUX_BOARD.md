# UI/UX Batch Board — Sweden Citizenship Test Prep

Owned by **MANAGER-uiux**. Workers read-only.
Context budget: 200 lines. Archive to `docs/parallel-sessions/archive/` when full.

## Batch outcome (UIUX-Batch-1)

When this batch is accepted, the app has:

1. A complete `lib/theme/` token system (colors, spacing, typography, radius, shadows, motion) sourced from `DESIGN.md`.
2. A reusable component library in `components/` covering: `Surface`, `Text`, `Button`, `OptionCard`, `PillBadge`, `ProgressBar`, `ChapterRow`, `DisclaimerBanner`, `Screen`, `Divider` — all token-driven, fully accessible.
3. Polished Expo Router screens in `app/`: root + tabs layouts, Home, Practice (chapter pick), Quiz, Chapters list, Settings, Results — all visually Notion-quality, all states (idle/loading/empty/error) covered.
4. Motion + a11y utility libraries in `lib/motion/` and `lib/a11y/` respecting reduce-motion and WCAG AA contrast.
5. Zero hardcoded colors, spacings, fonts, radii, or shadows outside `lib/theme/`.

## Lane lease table (disjoint write scopes)

| Lane | Writable scope | Owner |
|---|---|---|
| DESIGN-TOKENS | `lib/theme/**` | pane 1 |
| COMPONENTS | `components/**` | pane 2 |
| SCREENS | `app/**` | pane 3 |
| MOTION-A11Y | `lib/motion/**`, `lib/a11y/**` | pane 4 |
| MANAGER-uiux | this file + `codex-tasks/uiux-*.txt` | pane 0 |

Cross-team lease: while UIUX team is active, the build team's SETUP lane must **not** write to `components/`, `app/`, `lib/theme/`, `lib/motion/`, `lib/a11y/`. Build SETUP keeps `package.json`, `app.json`, `tsconfig.json`, scripts, and non-UI plumbing only.

## Acceptance checklist

| ID | Requirement | DRI | Status | Evidence |
|---|---|---|---|---|
| U1 | `lib/theme/colors.ts` matches DESIGN.md palette | DESIGN-TOKENS | pending | — |
| U2 | `lib/theme/spacing.ts` 8px scale exported | DESIGN-TOKENS | pending | — |
| U3 | `lib/theme/typography.ts` Inter variants exported | DESIGN-TOKENS | pending | — |
| U4 | `lib/theme/radius.ts`, `shadows.ts`, `motion.ts` complete | DESIGN-TOKENS | pending | — |
| U5 | `lib/theme/index.ts` barrel export | DESIGN-TOKENS | pending | — |
| U6 | `<Surface>` token-driven, a11y-ready | COMPONENTS | pending | — |
| U7 | `<Text>` variant prop | COMPONENTS | pending | — |
| U8 | `<Button>` primary/secondary/ghost × sm/md/lg | COMPONENTS | pending | — |
| U9 | `<OptionCard>` 4 states + a11y radio | COMPONENTS | pending | — |
| U10 | `<PillBadge>` 4 variants | COMPONENTS | pending | — |
| U11 | `<ProgressBar>` token-driven | COMPONENTS | pending | — |
| U12 | `<ChapterRow>`, `<DisclaimerBanner>`, `<Screen>`, `<Divider>` | COMPONENTS | pending | — |
| U13 | `app/_layout.tsx` + `app/(tabs)/_layout.tsx` | SCREENS | pending | — |
| U14 | Home screen (`app/(tabs)/index.tsx`) | SCREENS | pending | — |
| U15 | Practice picker + Quiz flow + Results | SCREENS | pending | — |
| U16 | Chapters list + Settings | SCREENS | pending | — |
| U17 | `useReducedMotion`, `useFadeIn`, `useSpringPress`, `useProgress` | MOTION-A11Y | pending | — |
| U18 | `lib/a11y/announce.ts`, `focusOrder.ts`, `contrast.ts` | MOTION-A11Y | pending | — |
| U19 | `lib/motion/haptics.ts` semantic wrapper | MOTION-A11Y | pending | — |
| U20 | Token discipline: `grep -rE "#[0-9a-fA-F]{6}\|rgba?\(" components/ app/` returns nothing outside theme imports | MANAGER-uiux | pending | — |

## Decision log

- 2026-05-15 — UIUX team launched with 5 panes (1 MANAGER + 4 workers). Disjoint write scopes per lease table. Operator: claude-code.
