# Local main integration — 2026-05-15

## Purpose

Record how the validated release-readiness branch was integrated when no Git
remote exists for opening the planned review-facing PR.

## Repository state before integration

- `main`: `89d3833 chore: initial project structure — AI scaffold + codex supervisor setup`
- `batch/2026-05-15-foundation`: `4cab819 chore: add native prebuild release gate`
- Git remote: none configured, so a PR cannot be opened from this checkout.

## Integration action

Verified that `main` was an ancestor of `batch/2026-05-15-foundation`, then
fast-forwarded local `main` to the validated batch branch.

Commands:

```bash
git merge-base --is-ancestor main batch/2026-05-15-foundation
git checkout main
git merge --ff-only batch/2026-05-15-foundation
```

Result:

- `main`: `4cab819 chore: add native prebuild release gate`
- `batch/2026-05-15-foundation`: retained at `4cab819`
- No merge commit was created.

## Verification on local main

Command:

```bash
npm run release:preflight
```

Result at 2026-05-15 19:01 CEST:

- Local validation: READY.
- Expo Doctor: READY.
- Web export smoke: READY.
- Android/iOS native prebuild smoke: READY.
- Pinned npx EAS CLI: READY.
- EAS auth: BLOCKED, `Not logged in`.
- Android/iOS physical-device audio, store records, public URLs, final
  screenshots, and submission evidence: BLOCKED external gates.

## Scope and limitation

This completes local branch integration only. It does not replace a remote PR,
EAS builds, physical-device tests, hosted public URLs, store records,
screenshots, TestFlight/Google Play internal testing, or production submission.
