# 08 — Monetization and Ads

## Monetization model

Use a freemium model.

### Free

Includes:

- chapter practice,
- limited mock exams,
- mistake review,
- basic progress,
- ads.

### Premium

Includes:

- no ads,
- unlimited mock exams,
- advanced statistics,
- full mistake review,
- extra challenge modes,
- optional offline packs later.

## Premium pricing (v1.0 → v1.1)

v1.0 ships **Remove Ads** only at **29 SEK** one-time non-consumable (see GOAL.md).

v1.1 introduces **Pro Lifetime** at **59 SEK** one-time non-consumable. No
monthly or yearly tier — the citizenship test is a one-shot exam, lifetime
converts better than subscription for this audience. See
[13_pro_tier.md](13_pro_tier.md) for the full entitlement matrix and upgrade
path for existing Remove Ads buyers.

| SKU | Product ID | Price | Type |
|---|---|---|---|
| Remove Ads | `com.billyyiu.swedishcivictest.removeads` | 29 SEK | non-consumable |
| Pro Lifetime | `com.billyyiu.swedishcivictest.prolifetime` | 59 SEK | non-consumable |

RevenueCat is not used. The app talks to StoreKit / Google Play Billing directly
via `react-native-iap` (already wired for Remove Ads). Two non-consumable SKUs
is simpler than a subscription cohort for this audience.

## Ads

Use Google AdMob.

Ad locations:

| Screen | Format |
|---|---|
| Home | Banner or native |
| Quiz completed screen | Interstitial |
| Results screen | Native |
| Unlock extra mock exam | Rewarded |
| Chapter list | Small banner |

Do not show ads:

- inside mock exam,
- directly under answer options,
- while the user is choosing an answer,
- in the middle of explanation reading,
- in a way that creates accidental clicks.

## Ad strategy

Recommended:

1. Light ads at launch.
2. Prioritize trust and retention.
3. Offer ad-free upgrade.
4. Use rewarded ads only for optional extras.
5. Avoid aggressive interstitials.

## Rewarded ads

Possible uses:

- unlock one extra mock exam,
- get bonus challenge mode,
- restore one streak freeze.

Do not block core learning behind too many ads.

## Store listing wording

Safe wording:

- Independent study app.
- Practice for the Swedish citizenship civic test.
- Based on public UHR study material.
- Swedish and English explanations.
- Mock exams and mistake review.

Avoid:

- Official Swedish citizenship app.
- Real exam questions.
- Guaranteed pass.
- UHR approved.
- Apply for citizenship here.

## Ad policy checklist

Before launch:

- configure AdMob app IDs,
- use test ads during development,
- obtain privacy consent where required,
- disclose ads in store pages,
- complete Google Play Data Safety form,
- complete Apple privacy labels,
- include privacy policy,
- remove empty/test ad units before production.

## Privacy

Ad SDKs may collect device or advertising identifiers depending on configuration.

The privacy policy must disclose:

- ads,
- analytics,
- crash reporting,
- purchases,
- local progress,
- any third-party SDKs.

## Recommended app placements

### Free user flow

1. User studies 10 questions.
2. User completes session.
3. Show results.
4. Show one interstitial or native ad.
5. Offer premium lightly.

### Premium user flow

- no ads,
- same learning functionality,
- premium badge optional.

## Revenue priorities

For this type of education app:

1. Trust and retention first.
2. Premium second.
3. Ads third.

Too many ads will hurt reviews and reduce trust.
