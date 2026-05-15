# 2026-05-15 — Batch 10 compliance pages

## Added

- Disclaimer route with independent, not-official, not-real-exam wording.
- Privacy route describing no-account MVP behavior and local progress/settings storage.
- Terms route describing study-only use and no guarantee of exam or citizenship outcomes.
- Sources route linking UHR education material and pointing to the section map/content database.
- Reusable legal page and compliance links components.
- Compliance links on onboarding, profile, and settings surfaces.
- Test coverage for required compliance/source pages.

## Verification

- RED: `node --test scripts/compliance-pages.test.js` failed before the routes existed.
- GREEN: `npm run test:compliance` passes.
