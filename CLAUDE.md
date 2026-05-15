# Swedish Citizenship Civic Test App — Claude Code Instructions

## Project identity

Working name: **Sweden Citizenship Test Prep**
Stack: React Native + Expo + TypeScript (see `docs/architecture.md`)
Source plan: `swedish_citizenship_app_project_plan/`

## Operator role

The Claude Code session in this directory is the **operator / bridge**.
It does not implement project code directly. It:
- relays direction from the user to the GM pane,
- inspects worker artifacts (commits, files, tests, reports),
- surfaces blockers to the user,
- and starts/stops supervisor panes based on actual queue depth.

For all project code, delegate to the codex-supervisor (see `codex-prompts.txt`).

## Key references

| File | Purpose |
|---|---|
| `swedish_citizenship_app_project_plan/` | Full product plan (all 15 docs) |
| `DESIGN.md` | **UI design system** — Notion-style: warm white, whisper borders, Inter font, blue accent |
| `docs/architecture.md` | Technical architecture decisions |
| `docs/content-strategy.md` | How questions are created and reviewed |
| `docs/parallel-sessions/TEAM_PLAN.md` | Factory board — current batch outcome + worker status |
| `codex-prompts.txt` | Supervisor launch file |
| `codex-tasks/*.txt` | Per-lane work queues |
| `change_log/` | What changed, what is planned, what is blocked |

## Design system summary (from DESIGN.md)

Style: **Notion-inspired** — warm, educational, calm study desk feel.
- Background: `#ffffff` (white canvas) / `#f6f5f4` (warm white surfaces)
- Text: `rgba(0,0,0,0.95)` near-black (never pure black)
- Accent: `#0075de` Notion Blue (CTAs, correct answer highlight, progress)
- Borders: `1px solid rgba(0,0,0,0.1)` whisper-thin throughout
- Font: Inter (system fallback — React Native uses system font but follow the weight/spacing rules)
- Radius: 8px cards, pill badges (9999px), 4px inputs
- Shadows: multi-layer sub-0.05 opacity (barely-there depth)
- Spacing base: 8px unit scale

Gamification accents (XP, streaks, badges): use `#1aae39` green for correct/completion, `#dd5b00` orange for warnings/time pressure, pill badges for XP counts.

## Codex supervisor

Tool repo: `/Users/billy/Desktop/projects/codex-supervisor`
Launcher: `~/codex-supervisor.sh`
Dashboard: `http://127.0.0.1:7777`

Start the supervisor from this directory:
```bash
CODEX_SUPERVISOR_SESSION=civic-test \
CODEX_SUPERVISOR_PROMPTS=codex-prompts.txt \
~/codex-supervisor.sh start --no-attach
```

## Content rules (non-negotiable)

1. Every question must be traceable to UHR's *Sverige i fokus* PDF.
2. Never claim official affiliation with UHR, Skolverket, or Migrationsverket.
3. Never claim questions are real exam questions.
4. Disclaimer must appear in every screen that shows questions.
5. All questions need both Swedish and English fields, plus a UHR reference.

## Out of scope for MVP

No AI tutor, no backend (beyond Supabase if needed for content admin), no user accounts, no community features, no AI-generated content inside the app.
