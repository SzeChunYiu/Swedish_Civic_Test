# SETUP Lane — Sweden Citizenship Test Prep

## Role

You are the **SETUP worker** for Batch 0. You own the Expo scaffold, folder structure, and basic quiz screen.

## Required reading at every iteration start

1. `docs/parallel-sessions/TEAM_PLAN.md` — acceptance checklist rows A2, A3, A7
2. `docs/architecture.md` — target folder structure and stack
3. `DESIGN.md` — **UI design system** (Notion style). Read this before building any screen.
4. `docs/parallel-sessions/journals/setup.md` — your prior handoffs

## Writable scope

- `app/`
- `components/`
- `lib/`
- `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`
- `docs/parallel-sessions/journals/setup.md`

## Forbidden paths (read-only for this lane)

- `data/` — owned by CONTENT lane
- `types/` — owned by CONTENT lane
- `docs/parallel-sessions/TEAM_PLAN.md` — owned by GM + VALIDATOR

## One-iteration cycle

Pick the **lowest-numbered incomplete task** from `codex-tasks/setup.txt`:

### Task 1: Expo scaffold

```bash
cd /Users/billy/Desktop/projects/Swedish_Civic_Test
npx create-expo-app@latest . --template blank-typescript --yes 2>/dev/null || \
  npx create-expo-app . --template blank-typescript
npx expo install expo-router zustand @react-native-mmkv/mmkv react-native-mmkv expo-speech
```

Then add Expo Router entry point per Expo Router docs.

### Task 2: Folder structure

Create all directories and placeholder files from `docs/architecture.md`.
Each placeholder should export an empty object or empty array with the correct TypeScript type.
Import from `types/content.ts` (which CONTENT lane creates — read-only for you).

### Task 3: Basic quiz screen

In `app/(tabs)/practice.tsx`, build a minimal screen that:
- imports `questions` from `data/questions.ts`
- displays the first question's `questionSv` and four answer options
- marks the selected answer correct or incorrect
- shows `explanationSv` after selection

Use Zustand for session state. Keep it minimal — no styles beyond flex layout.

## Verification after each task

```bash
npx tsc --noEmit && echo "TypeScript OK"
npx expo start --non-interactive --no-dev 2>&1 | head -20
```

## Compact-safe stop rule

Complete one task, verify it, write handoff to journal, stop.
Do not move to the next task in the same iteration.

## Handoff format (append to docs/parallel-sessions/journals/setup.md)

```
## Iteration <N> — <YYYY-MM-DD>
Task completed: <task number + one-line description>
Artifacts changed: <file list>
Verification: <command + result summary>
Blocked? no / yes — <reason>
Next suggested validator action: check <artifact>
```
