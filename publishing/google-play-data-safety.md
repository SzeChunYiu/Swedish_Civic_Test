# Google Play Data safety — ad-supported v1.0 draft

Reference:

- Google Play Data safety help:
  https://support.google.com/googleplay/android-developer/answer/10787469
- Google Mobile Ads SDK Play data disclosure:
  https://developers.google.com/admob/android/privacy/play-data-disclosure

## Data collection

Answer **Yes, data is collected** for the v1.0 release draft.

The app itself still has no account system, developer profile database, remote
progress sync, support form, analytics SDK, or crash reporting SDK. Study
progress, settings, mistakes, XP, streaks, bookmarks, and audio preference stay
on the local device.

The release binary includes Google Mobile Ads, Google UMP consent, and a
one-time Remove Ads non-consumable in-app product for **29 SEK**. Google Mobile
Ads automatically collects end-user data for advertising, analytics, and fraud
prevention, so the old no-collection answer is not valid for this release
posture.

## Data sharing

Answer **Yes, data is shared** for Google Mobile Ads SDK data that is sent to
Google or advertising partners for ad delivery, measurement, analytics, and
fraud prevention.

## Data types to review in Play Console

- **Location / approximate location** — Google Mobile Ads collects IP address,
  which may be used to estimate general location.
- **App activity / app interactions** — Google Mobile Ads collects interaction
  information such as app launch, taps, and video views.
- **App info and performance / diagnostics** — Google Mobile Ads collects SDK and
  app performance information such as app launch time, hang rate, and energy
  usage.
- **Device or other IDs** — Google Mobile Ads collects Android advertising ID,
  app set ID, and, where applicable, other device/account identifiers.
- **Financial info / purchase history** — Google Play Billing and the app runtime
  process the Remove Ads purchase/restore state for app functionality. The app
  stores a local, versioned Remove Ads entitlement record on the device; when
  needed for restore or revalidation, that record can include the store product
  ID, purchase token or transaction ID, receipt validation status,
  receipt-validation timestamp, and whether the grant came from purchase or
  restore.

## Purposes

- Advertising or marketing: Google Mobile Ads on study screens.
- Analytics: Google Mobile Ads measurement and SDK performance signals.
- Fraud prevention, security, and compliance: Google Mobile Ads integrity and
  abuse-prevention signals.
- App functionality: Remove Ads purchase, restore, and local entitlement state.

## Security practices and user controls

- Google Mobile Ads reports SDK data as encrypted in transit.
- Users can reset or delete the Android advertising ID in Android settings.
- The app gates real ad serving through Google UMP consent where required.
- Remove Ads disables ad placements for the local entitlement state.
- Users can clear local app data through the operating system to remove local
  study progress and the local entitlement cache.

## Binary review checklist before Google Play submission

- Confirm `EXPO_PUBLIC_REAL_ADS_ENABLED` and real AdMob unit IDs match the build
  being submitted.
- Confirm the AdMob app/app-ads.txt setup and Play Console Data safety answers
  match the final Google Mobile Ads SDK behavior.
- Confirm UMP consent appears in regions where consent is required.
- Confirm Remove Ads purchase and restore use the configured Play in-app product
  and the displayed price remains **29 SEK**.
- Update this file before submission if analytics, crash reporting, accounts,
  remote content, or support collection is enabled.
