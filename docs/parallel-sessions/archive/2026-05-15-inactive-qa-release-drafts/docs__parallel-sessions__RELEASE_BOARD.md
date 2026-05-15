> **Inactive future-draft archive.** This file was preserved from an unlaunched parallel-session expansion on 2026-05-15. It is documentation only: it is not an active queue, release gate, supervisor prompt, or acceptance checklist for v1.0. If revived later, copy it back into an active location and refresh all statuses against current evidence.

# Release Board — Sweden Civic Test

Owned by MANAGER-release. Workers read-only.

## Batch outcome (RELEASE-Batch-1)
- `publishing/app-store-listing.md` + `publishing/google-play-listing.md` 100% complete and compliant (no UHR affiliation claims, disclaimer present).
- Privacy policy + support docs published at reachable URLs.
- All URLs referenced in listings return 200/301/302 via curl.
- `reports/release-gates.json` updated to reflect current gate states; release-readiness.md kept in sync.

## Lane lease
| Lane | Writable scope | Owner |
|---|---|---|
| MANAGER-release | this board + release-*.txt queues + reports/release-gates.json | pane 0 |
| STORE-METADATA | publishing/app-store-listing.md, publishing/google-play-listing.md, publishing/release-readiness.md, publishing/screenshots/ | pane 1 |
| PRIVACY-DOCS | publishing/public-support-and-privacy.md, publishing/post-eas-auth-runbook.md, publishing/legal/ | pane 2 |

## Acceptance checklist
| ID | Requirement | DRI | Status |
|---|---|---|---|
| R1 | App Store title (30 char) + subtitle (30 char) + 4000-char description | STORE-METADATA | pending |
| R2 | App Store keywords (100 char, comma-sep) | STORE-METADATA | pending |
| R3 | Google Play short (80) + full (4000) description | STORE-METADATA | pending |
| R4 | Both listings include disclaimer (no UHR affiliation, not real exam questions) | STORE-METADATA | pending |
| R5 | Screenshot captions (≥5 per store) | STORE-METADATA | pending |
| R6 | Privacy policy published at reachable URL, linked from both listings | PRIVACY-DOCS | pending |
| R7 | Support contact reachable | PRIVACY-DOCS | pending |
| R8 | UHR attribution under fair use | PRIVACY-DOCS | pending |
| R9 | All URLs in listings return 200/301/302 | PRIVACY-DOCS | pending |
| R10 | `reports/release-gates.json` reflects current state | MANAGER-release | pending |
