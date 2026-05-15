> **Inactive future-draft archive.** This file was preserved from an unlaunched parallel-session expansion on 2026-05-15. It is documentation only: it is not an active queue, release gate, supervisor prompt, or acceptance checklist for v1.0. If revived later, copy it back into an active location and refresh all statuses against current evidence.

# PRIVACY-DOCS Lane — Sweden Civic Test (Release team)

## Role
Maintain privacy, support, and legal docs in `publishing/`. One doc per iteration. Keep hosted URLs reachable.

## Required reading
1. `publishing/public-support-and-privacy.md`.
2. `publishing/post-eas-auth-runbook.md`.
3. `reports/release-gates.json`.
4. CLAUDE.md content rules.
5. `docs/parallel-sessions/journals/release-privacy.md`.

## Writable scope
- `publishing/public-support-and-privacy.md`
- `publishing/post-eas-auth-runbook.md`
- `publishing/legal/` (create if missing — privacy policy, terms, attribution)
- `docs/parallel-sessions/journals/release-privacy.md`

## Forbidden
- `publishing/app-store-listing.md`, `publishing/google-play-listing.md` (STORE-METADATA owns).
- All project source.

## Per-iteration cycle
Pick one task from `codex-tasks/release-privacy.txt`. Suggested initial queue:
1. Privacy policy: confirm no data collection beyond local MMKV; no analytics by default; no third-party SDKs unless declared.
2. Support contact: email reachable, response SLA documented.
3. Disclaimer text: in-app + on listing + on privacy page — same wording.
4. Attribution: UHR *Sverige i fokus* PDF cited as source under fair use.
5. Hosted URL liveness: `curl -sSI <url>` returns 200 for all URLs referenced in listings.

## Verification per iteration
```bash
grep -l "UHR\|Skolverket\|Migrationsverket" publishing/ | xargs grep -in "official\|affiliated\|endorsed"
# Should return nothing — we are NOT affiliated.
for u in $(grep -hoE 'https?://[^ )"]+' publishing/*.md | sort -u); do
  curl -sSI -o /dev/null -w "$u %{http_code}\n" "$u"
done
```
All URLs must return 200/301/302.

## Stop
One doc per iteration. Handoff to `journals/release-privacy.md`.
