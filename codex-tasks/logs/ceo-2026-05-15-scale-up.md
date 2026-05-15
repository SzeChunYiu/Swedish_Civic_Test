# Archived Scale-Up Directive — 2026-05-15

Status: **archived inactive / not executed in this cleanup commit**.

Reason: the v1.0 app code, content, publishing docs, hosted public URLs, and local release-preflight machinery are already in place. The remaining blockers are external account/device/store gates tracked in `reports/release-gates.json` and GitHub issue #1. The generated QA/release/split-UIUX scaffolds from this directive were preserved as inactive future drafts under `docs/parallel-sessions/archive/2026-05-15-inactive-qa-release-drafts/` so they do not create new active v1.0 gates.

Archived at: 2026-05-15T18:07:11Z

---

[OPERATOR → CEO | 2026-05-15 ~20:05 CEST] SCALE-UP DIRECTIVE.

User direction (billy): develop civic-test at maximum productive speed. Run more teams in parallel. Make sure every team is shipping product code, not docs-only churn.

CURRENT STATE (verified by operator just before this directive):
- civic-meta (CEO, you): ALIVE, in poll loop.
- civic-team-build (MANAGER-build + SETUP + CONTENT): ALIVE.
- civic-team-uiux (5-pane): STUCK — daemon stalls after "dashboard already running"; never spawns 5 panes. Replace with the split below.
- Node load gate has been raised to MAX_LOAD_PER_CPU=38 (was 1.0) so new sessions can spawn.

REQUIRED ACTIONS:

1. RETIRE civic-team-uiux (the broken 5-pane session). Run:
     csup stop civic-test --host=civic-team-uiux-lunarc

2. BOOTSTRAP **civic-team-uiux-design** (3 panes). YOU AUTHOR:
   - `codex-prompts-team-uiux-design.txt` with 3 /goal lines under 50 words each:
       PANE 0 = MANAGER-uiux-design. Reads DESIGN.md, docs/parallel-sessions/uiux-manager.md, UIUX_BOARD.md. Accepts tokens + components. Iterates until rate-limited.
       PANE 1 = DESIGN-TOKENS. Reads DESIGN.md + design-tokens.md. Builds one lib/theme/ file per iteration. Iterates until rate-limited.
       PANE 2 = COMPONENTS. Reads DESIGN.md + components.md. Builds one components/ file per iteration using lib/theme tokens only. Iterates until rate-limited.
   - Add host block `civic-team-uiux-design-lunarc` in `.codex-supervisor.toml` (mirror civic-team-build-lunarc but session=civic-team-uiux-design, prompts=codex-prompts-team-uiux-design.txt). The host already exists in ~/.config/csup/hosts.toml with MAX_PANES=3 and MAX_LOAD_PER_CPU=38.
   - Add UIUX-DESIGN-Batch-1 row to docs/parallel-sessions/TEAM_PLAN.md "Active parallel batches" table BEFORE creating the prompts file (so the project linter accepts it).
   - Then: csup start civic-test --host=civic-team-uiux-design-lunarc

3. BOOTSTRAP **civic-team-uiux-runtime** (3 panes). YOU AUTHOR:
   - `codex-prompts-team-uiux-runtime.txt` with 3 /goal lines:
       PANE 0 = MANAGER-uiux-runtime. Reads DESIGN.md + uiux-manager.md + UIUX_BOARD.md. Accepts screens + motion/a11y. Iterates until rate-limited.
       PANE 1 = SCREENS. Reads DESIGN.md + screens.md. Polishes one app/ screen per iteration using components and theme only. Iterates until rate-limited.
       PANE 2 = MOTION-A11Y. Reads DESIGN.md + motion-a11y.md. Builds one lib/motion or lib/a11y utility per iteration respecting reduce-motion. Iterates until rate-limited.
   - Add host block `civic-team-uiux-runtime-lunarc` in `.codex-supervisor.toml`. Host exists in ~/.config/csup/hosts.toml with MAX_PANES=3.
   - Add UIUX-RUNTIME-Batch-1 to TEAM_PLAN.md.
   - csup start civic-test --host=civic-team-uiux-runtime-lunarc

4. BOOTSTRAP **civic-team-qa** (3 panes). YOU AUTHOR:
   - `codex-prompts-team-qa.txt`:
       PANE 0 = MANAGER-qa. Reads docs/parallel-sessions/qa.md + QA_BOARD.md. Runs typecheck/lint/validate:content; accepts/rejects worker tests; queues gaps. Iterates until rate-limited.
       PANE 1 = E2E. Reads qa-e2e.md. Adds one Playwright spec per iteration covering practice/quiz/results golden paths. Iterates until rate-limited.
       PANE 2 = UNIT. Reads qa-unit.md. Adds one Jest/RTL unit test per iteration for components, hooks, or validators. Iterates until rate-limited.
   - Lane md files YOU author: docs/parallel-sessions/qa.md, qa-e2e.md, qa-unit.md, QA_BOARD.md. Writable scope per lane:
       MANAGER-qa: QA_BOARD.md + codex-tasks/qa-*.txt + ceo-inbox.txt (escalations only).
       E2E: tests/e2e/, first-iter playwright.config.ts, journals/qa-e2e.md.
       UNIT: tests/unit/, first-iter jest.config.js, journals/qa-unit.md.
   - QA acceptance bar: every test must assert behavior (not internals), run in CI, no real network.
   - Add host `civic-team-qa-lunarc`, add QA-Batch-1 to TEAM_PLAN, start.

5. BOOTSTRAP **civic-team-release** (3 panes). YOU AUTHOR:
   - `codex-prompts-team-release.txt`:
       PANE 0 = MANAGER-release. Reads release.md + RELEASE_BOARD.md + reports/release-gates.json. Accepts store + privacy updates against gates. Iterates until rate-limited.
       PANE 1 = STORE-METADATA. Reads release-store.md. Refreshes one app-store / google-play asset per iteration. Iterates until rate-limited.
       PANE 2 = PRIVACY-DOCS. Reads release-privacy.md. Refreshes one privacy/support/legal doc per iteration; verifies hosted URLs return 200. Iterates until rate-limited.
   - Lane md files YOU author: release.md, release-store.md, release-privacy.md, RELEASE_BOARD.md. Writable scope:
       MANAGER-release: RELEASE_BOARD.md + codex-tasks/release-*.txt + reports/release-gates.json + ceo-inbox.txt.
       STORE-METADATA: publishing/app-store-listing.md, publishing/google-play-listing.md, publishing/screenshots/, publishing/release-readiness.md, journals/release-store.md.
       PRIVACY-DOCS: publishing/public-support-and-privacy.md, publishing/post-eas-auth-runbook.md, publishing/legal/, journals/release-privacy.md.
   - Hard content rules (NON-NEGOTIABLE — see CLAUDE.md): never claim UHR/Skolverket/Migrationsverket affiliation; never claim practice questions are real exam questions; disclaimer present on every screen showing questions and on every store listing.
   - Add host `civic-team-release-lunarc`, add RELEASE-Batch-1 to TEAM_PLAN, start.

6. PRODUCTIVITY GATE for ALL teams (build + uiux-design + uiux-runtime + qa + release):
   - Each MANAGER must REJECT worker iterations that are docs-only or only touched codex-tasks/. Workers must touch project source (`app/`, `components/`, `lib/`, `types/`, `data/`, `tests/`, `publishing/`) per iteration.
   - Each team must commit at least one source-touching change per hour while alive.
   - Manager reports productivity (commits-touching-source vs total commits) in their next handoff.

7. ORDER OF OPERATIONS:
   a. Update TEAM_PLAN.md with all 4 new batch rows (UIUX-DESIGN, UIUX-RUNTIME, QA, RELEASE), one commit.
   b. Stop legacy uiux, write 4 prompts files and 4 lane sets, one commit per team.
   c. Update .codex-supervisor.toml with 4 host blocks (mirror existing build-lunarc shape).
   d. Stagger-launch the 4 new sessions with ≥20s between each `csup start` (avoid start-lock collisions).
   e. Verify each session with `csup status civic-test` until "all panes prompted" appears in its log.
   f. Append [CEO → OPERATOR] status report to this file: which teams are live, which had errors, productivity ratio for build team since 19:50.

8. ESCALATIONS to operator (append [CEO → OPERATOR] block at top of this file): any host start failure after 2 retries; any team showing 0 source commits after 2 hours.

Archive this directive to codex-tasks/logs/ceo-2026-05-15-scale-up.md after step 7 completes.

