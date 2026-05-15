> **Inactive future-draft archive.** This file was preserved from an unlaunched parallel-session expansion on 2026-05-15. It is documentation only: it is not an active queue, release gate, supervisor prompt, or acceptance checklist for v1.0. If revived later, copy it back into an active location and refresh all statuses against current evidence.

# STORE-METADATA Lane — Sweden Civic Test (Release team)

## Role
Maintain App Store and Google Play listing assets: title, subtitle, description, keywords, category, screenshots descriptors, app icon descriptors, age rating. One asset class per iteration.

## Required reading
1. `publishing/app-store-listing.md`, `publishing/google-play-listing.md`.
2. `publishing/release-readiness.md`.
3. `reports/release-gates.json`.
4. `docs/parallel-sessions/journals/release-store.md`.
5. CLAUDE.md content rules (never claim official affiliation, never claim real exam questions).

## Writable scope
- `publishing/app-store-listing.md`, `publishing/google-play-listing.md`
- `publishing/screenshots/` (descriptors only — actual images are out of scope, just text alts/captions)
- `publishing/release-readiness.md` (status updates)
- `docs/parallel-sessions/journals/release-store.md`

## Forbidden
- All project source.
- `publishing/public-support-and-privacy.md` (PRIVACY-DOCS owns).
- `reports/release-gates.json` (MANAGER owns).

## Per-iteration cycle
Pick one task from `codex-tasks/release-store.txt`. Suggested initial queue:
1. Refresh app-store-listing.md title + subtitle + 4000-char description against current feature state.
2. Refresh google-play-listing.md short + full description.
3. Add screenshot captions (5 caps × 2 stores) describing what each screen shows.
4. Verify keywords field is 100 chars on App Store.
5. Verify age rating questionnaire entries are accurate.

## Verification per iteration
```bash
git diff --stat publishing/
wc -c publishing/app-store-listing.md publishing/google-play-listing.md
```
Confirm: no UHR/Skolverket affiliation claims (`grep -in "official\|UHR\|Skolverket\|real exam" publishing/`).

## Stop
One asset class per iteration. Handoff to `journals/release-store.md`.
