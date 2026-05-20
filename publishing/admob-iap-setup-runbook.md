# AdMob + IAP — operator setup runbook

These steps need a human account owner; the factory cannot create accounts,
generate real ad unit IDs, or create store products. Do these, paste the IDs
into the marked config, and the factory builds/tests the rest.

App identity (from publishing/release-readiness.md):

- iOS bundle id: `com.billyyiu.almostswedish`
- Android package: `com.billyyiu.almostswedish`
- App name: Almost Swedish

## Part A — Google AdMob (real ads)

1. Create/sign in to AdMob: https://admob.google.com → Apps → **Add app**
   (do this twice: one iOS app, one Android app, both not-yet-on-store = "No").
2. Note each **AdMob App ID** (`ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`).
3. For EACH platform create these **ad units** (Ad units → Add ad unit):
   | Placement (code key) | Format |
   |---------------------------------|---------------|
   | `home_banner` | Banner |
   | `chapter_list_banner` | Banner |
   | `quiz_completed_interstitial` | Interstitial |
   | `results_native` | Native |
   | `app_open_launch` | App open |
   | `rewarded_extra_exam` | Rewarded |
   Record each unit id (`ca-app-pub-XXXX/ZZZZZZZZZZ`), 6 × 2 = 12 total.
4. AdMob → app-ads.txt: copy the publisher line AdMob gives you. The factory
   will host it at `publishing/public-site/app-ads.txt` (served from the public
   GitHub Pages site already used for support/privacy).
5. Set the app **content rating** and, in App settings, mark "Directed to
   children" = **No** (study app for adults).
6. Hand the factory: 2 App IDs + 12 unit IDs. They go into a NEW
   `lib/monetization/ad-units.real.ts` (gitignored if you prefer) or via the
   `EXPO_PUBLIC_ADMOB_*` env keys the factory will define — do NOT hardcode in
   tracked source. Test units stay the default for dev.

## Part B — "Remove Ads" in-app purchase (29 SEK, one-time)

Product model: **non-consumable**, one-time unlock, sets `adsDisabled=true`.

### Apple — App Store Connect

1. App Store Connect → your app → **In-App Purchases** → Create →
   **Non-Consumable**.
2. Reference Name: `Remove Ads`; Product ID: `com.billyyiu.swedishcivictest.removeads`.
3. Price: pick the tier closest to **29 SEK** (Sweden) — Apple sets the matrix
   for other countries automatically.
4. Add localized display name/description (EN + SV), review screenshot.
5. Create a **Sandbox tester** (Users & Access → Sandbox) for QA.

### Google — Play Console

1. Play Console → your app → Monetize → Products → **In-app products** → Create.
2. Product ID: `removeads` (must match the iOS suffix logic the factory wires).
3. Price: **29 SEK**. Activate the product.
4. License testing: add the tester Google account (Setup → License testing).

Hand the factory: the two product IDs + confirm prices live.

## Part C — "Pro Lifetime" in-app purchase (59 SEK, one-time, v1.1)

Only start this after v1.0 mobile is live and the Pro lane resumes. This is a
separate non-consumable from v1.0 Remove Ads.

Product model: **non-consumable**, one-time Pro unlock, sets the Pro Lifetime
entitlement and includes ad-free behavior.

### Apple — App Store Connect

1. App Store Connect → your app → **In-App Purchases** → Create →
   **Non-Consumable**.
2. Reference Name: `Pro Lifetime`; Product ID:
   `com.billyyiu.almostswedish.prolifetime`.
3. Price: pick the tier closest to **59 SEK** (Sweden) — Apple sets the matrix
   for other countries automatically.
4. Add localized display name/description (EN + SV), review screenshot.

### Google — Play Console

1. Play Console → your app → Monetize → Products → **In-app products** → Create.
2. Product ID: `com.billyyiu.almostswedish.prolifetime`.
3. Price: **59 SEK**. Activate the product.

Hand the factory: confirm the Pro Lifetime product ID
`com.billyyiu.almostswedish.prolifetime` is live at 59 SEK on both stores.

## Part D — Compliance (factory drafts, operator submits)

- iOS: enable **App Tracking Transparency** — the factory adds the ATT prompt
  (`expo-tracking-transparency`); you approve the wording.
- EEA: factory integrates Google **UMP** consent form; you confirm the
  privacy/consent copy.
- Factory updates `publishing/privacy-labels.md` + `publishing/google-play-data-safety.md`
  to declare: ads SDK collects device/ad identifiers, plus the IAP. You submit
  those answers in the consoles when creating the store records.

## Part E — Hand-off checklist (paste back to the operator session)

```
[ ] AdMob iOS App ID:        ca-app-pub-____~____
[ ] AdMob Android App ID:    ca-app-pub-____~____
[ ] 12 ad unit IDs (6 iOS + 6 Android) — pasted to factory
[ ] app-ads.txt publisher line
[ ] iOS IAP product id:      com.billyyiu.swedishcivictest.removeads (price live: Y/N)
[ ] Android IAP product id:  removeads (price live: Y/N)
[ ] iOS Pro Lifetime id:     com.billyyiu.almostswedish.prolifetime (59 SEK live: Y/N)
[ ] Android Pro Lifetime id: com.billyyiu.almostswedish.prolifetime (59 SEK live: Y/N)
[ ] Sandbox/license tester accounts created
[ ] EAS build access granted to factory for preview builds
```

Until Part A/B IDs exist, the factory builds & tests the FULL pipeline against
Google's public test units + a mock purchase provider, so nothing is blocked
except the final real-unit swap + on-device sign-off.
