Iteration: 2026-05-19T00:11+02:00
Rows moved to accepted: none in A1-A8; accepted
`SITE-AUDIT-STATIC-ASSET-REFERENCE-GUARD-1` as a SETUP/static-site guard on
current `origin/main`.
Rows blocked: `REVIEWER-SITE-LIVE-DEPLOY-STALE-1` remains blocked on external
production deploy capacity/operator evidence; no Vercel CLI was run.
Evidence: current `origin/main` `415e73c` includes source commit `0c3cb0e`
for the asset-reference guard, with later coordination/verify commits only for
this scope. Clean manager worktree `/tmp/sct-manager-build-asset-HsMNM5`
passed `npm run test:static-site-asset-references` 1/1,
`npm run test:static-site-account-scope` 2/2,
`node --check scripts/static-site-asset-references.test.js`, targeted
Prettier, `npm run typecheck -- --pretty false`, `npm run lint`,
`npm run test:ownership`, and `git diff --check 0c3cb0e^..0c3cb0e`. Spot
inspection confirmed the guard enumerates local `src`/`href` references in
`site/index.html`, skips external/data/mail/hash references, fails missing
local files, and rejects the stale `signin.js` reference.
Next worker task queued: SETUP remains source-held unless fresh current-main
P0 site or release source evidence appears. DATA-INTEGRITY remains routed to
q651-q700 q663/q670/q671 before the remaining generated single-choice
meta-stem/explanation cleanup.
