# Store screenshot shotlist

Use this shotlist after installing an EAS preview or production build on target
screens. Browser screenshots may help draft copy, but store-ready screenshots
must come from real devices, simulator/store tooling accepted by the platform,
or another method allowed by the store review process.

Machine-readable route coverage lives in `publishing/screenshot-manifest.json`.
Web-draft capture evidence is recorded in
`reports/2026-05-15-web-draft-screenshots.md`.

## Required screens

| Priority | Screen | Route / setup | Message to show | Notes |
|---:|---|---|---|---|
| 1 | Home dashboard | `/home` after onboarding | 500-question UHR-based study coverage, streak/progress overview | Avoid implying official affiliation |
| 2 | Learn chapters | `/learn` | 13 chapters aligned to UHR study material | Show chapter cards and question counts |
| 3 | Practice question | `/practice` | Swedish question, answer options, independent-study disclaimer | Do not reveal official-exam wording claims |
| 4 | Explanation/progress | Answer one practice question | Immediate explanation, source reference, progress tracking | Prefer a correct-answer state |
| 5 | Mock exam | `/exam` | Timed 20-question mock exam, no ads during exam | Capture before answering to show timer |
| 6 | Mistakes/review | `/mistakes` with sample wrong answer history if available | Weak-area review and spaced repetition | If no data exists, do not fabricate production data |
| 7 | Profile/settings | `/profile` or `/settings` | Audio setting, local-only study progress, privacy-aware design | Good for privacy/support messaging |
| 8 | Sources/compliance | `/sources` or `/privacy` | UHR source attribution and independent-app language | Use if reviewers ask about content provenance |

## Device targets

| Platform | Minimum suggested captures |
|---|---|
| iOS | 6.7-inch iPhone, 6.1-inch iPhone, and any required App Store Connect sizes |
| Android | Phone portrait screenshots for Google Play listing; tablet only if tablet support is claimed |

## Capture rules

- Use Swedish UI/question text where possible; English translations may appear as
  support text but should not dominate the listing.
- Keep the independent-study disclaimer visible in at least one screenshot.
- Do not show real personal data, Apple/Google account details, or private keys.
- Do not include `TEST AD` banners in final store screenshots unless the app is
  deliberately shipping with ads disabled and placeholders removed from the
  production surface.
- Re-capture screenshots after any UI, monetization, or privacy-copy change.

## Screenshot acceptance checklist

- [ ] Captured from the exact release candidate or a build with identical UI.
- [ ] App name and store listing title are consistent.
- [ ] No official-affiliation or guaranteed-exam-result claim is visible.
- [ ] Mock exam screenshot shows no ads.
- [ ] Privacy/source pages match `publishing/privacy-labels.md` and
      `publishing/google-play-data-safety.md`.
- [ ] File names include platform, device size, route, and date.
