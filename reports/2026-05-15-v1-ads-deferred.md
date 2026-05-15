# v1.0 ads deferred evidence — 2026-05-15

## Purpose

Keep the v1.0 release surface free of visible test-ad placeholders and avoid
requiring an AdMob app record before the first store submission.

## Implementation

- `lib/monetization/ads.ts` exports `REAL_ADS_ENABLED_FOR_V1 = false`.
- `shouldShowAd(...)` returns `false` before checking any placement-specific
  test unit.
- Existing AdMob test unit IDs remain documented for future integration work,
  but they are not rendered by the current v1.0 app path.
- `components/monetization/PremiumBanner.tsx` now says premium and ads are
  deferred for v1.0 instead of prompting users to upgrade to remove ads.
- `scripts/monetization.test.js` verifies the fail-closed ad behavior.

## Browser smoke

Expo web smoke on 2026-05-15:

- `/home`: no visible test-ad placeholder; 0 console errors, 1 known React
  Native web `pointerEvents` deprecation warning.
- `/learn`: no visible test-ad placeholder; 0 console errors, 1 known React
  Native web `pointerEvents` deprecation warning.
- `/profile`: shows "Premium and ads are deferred for v1.0"; 0 console errors,
  1 known React Native web `pointerEvents` deprecation warning.

## Remaining external gate

AdMob account setup is deferred, not complete. If real ads are enabled later,
the project must create an AdMob app record, replace test units, and re-review
Apple privacy labels, Google Play Data safety answers, and in-app/public privacy
copy before submission.
