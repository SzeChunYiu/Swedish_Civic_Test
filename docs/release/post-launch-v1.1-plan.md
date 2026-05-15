# Post-launch v1.1 plan

## Purpose

This plan is intentionally post-launch. It must not loosen the v1.0 release gates in
`reports/2026-05-15-completion-audit.md` or replace device/store verification.

## Entry criteria

Start v1.1 planning only after all of the following v1.0 evidence exists:

- Android physical-device smoke test is recorded.
- iOS physical-device or TestFlight smoke test is recorded.
- App Store Connect and Google Play internal testing records exist.
- Privacy labels and Google Play Data safety answers are re-reviewed against the
  exact SDKs enabled in the submitted build.
- At least one post-launch feedback source exists, such as store review notes,
  support email reports, or a manually collected issue log.

## Candidate themes

| Theme | Candidate work | Why defer past v1.0 | Evidence needed before build |
|---|---|---|---|
| Content depth | Add reviewed explanations, glossary entries, and harder chapter drills | v1.0 already has 500 published UHR-referenced questions | Content QA sample, source trace, content validation |
| Personalization | Chapter-specific weak-area review sessions | Requires learning from first user behavior | Local-only progress metrics or support feedback |
| Accessibility | Larger text mode, improved contrast audit, better screen-reader labels | Needs physical-device review | Android/iOS accessibility smoke notes |
| Store conversion | Real screenshots, revised listing text, ASO keyword tuning | Should use actual v1.0 screenshots and store feedback | Store analytics or review notes |
| Monetization | Decide whether to enable real AdMob or defer ads; evaluate optional premium | Changes privacy/data-safety review and user trust | Updated SDK/privacy review and account records |
| Reliability | Crash reporting or lightweight privacy-preserving analytics | Adds data collection obligations | Privacy review, opt-out copy, SDK-specific tests |

## Non-goals for v1.1

- No official-affiliation claims.
- No claim that app questions are real exam questions.
- No backend or account system unless there is measured need.
- No real ad, purchase, crash, or analytics SDK without updating privacy labels,
  data-safety answers, and in-app privacy copy first.

## First v1.1 triage checklist

1. Export/store all launch evidence in `reports/`.
2. Collect first-week issues into a short issue ledger.
3. Categorize each issue as content, UX, device, store, monetization, or privacy.
4. Prioritize only fixes with evidence from users, store review, or device tests.
5. Re-run `npm run validate` and targeted device smoke tests before any v1.1 build.
