# Civic Test Parallel Productivity Protocol

Use this with every `codex-prompts*.txt` lane. The project goal is not to create
more audits; it is to ship a better Swedish citizenship test app in small,
verified product atoms.

## One atom per worker cycle

1. Read `GOAL.md`, this file, and your lane doc.
2. Pick one product atom that fits one compact-safe iteration.
3. Touch at least one product path when product work is available: `app/`,
   `components/`, `content/`, `data/`, `lib/`, `types/`, `scripts/`, or `tests/`.
4. Run the nearest verification for that atom before broader checks.
5. Handoff with files changed, command result, blocker if any, and next atom.

Audit-only, queue-only, and report-only iterations are rejected unless the
manager explicitly marks them `[allow-meta]` because they unblock release.

## Manager speed rules

- Convert broad requests into atomic build/content/UI/test tasks.
- Accept only verified product deltas or justified release-infra deltas.
- Keep workers out of the same writable file at the same time.
- Stop or reassign panes that repeatedly produce audits instead of app changes.
- Schedule heavy commands intentionally; do not run EAS, Playwright, and Expo
  export in multiple panes at once.

## CPU/RAM discipline

- Prefer focused commands: targeted unit/test script, lint on changed surface,
  schema/content validator, or one Playwright route.
- Do not start watchers or dev servers unless the current atom needs them.
- One heavy process per pane. If a browser/export/build is running, wait or
  hand off before starting another.
- Reuse existing `node_modules`; do not reinstall dependencies in worker loops.

## Prompt shape

Prompts stay short and point here. Details live in lane docs. Each worker should
ship one verified atom before any broad audit, then repeat until rate-limited.
