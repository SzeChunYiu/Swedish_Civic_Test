# 2026-05-15 — Batch 11 monetization safety

## Added

- AdMob test-unit configuration for banner, interstitial, and native/result placements.
- `shouldShowAd` safety gate that blocks exam ads and respects premium ad-disable entitlement.
- Banner, native-card, and quiz-completion interstitial placeholder placements.
- Premium entitlement presets and profile premium preview banner.
- Monetization tests covering test-only units, premium ad disabling, and no ad imports on the exam screen.

## Verification

- RED: `node --test scripts/monetization.test.js` failed before test ad units and `shouldShowAd` existed.
- GREEN: `npm run validate` passes with monetization tests included.

## Still external/blocking

- Real AdMob account/app creation is not done in code.
- RevenueCat remains intentionally deferred until store products are approved.
