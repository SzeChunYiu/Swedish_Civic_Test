# Apple App Privacy labels — ad-supported v1.0 draft

Reference:

- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Apple User Privacy and Data Use / ATT:
  https://developer.apple.com/app-store/user-privacy-and-data-use/
- Google Mobile Ads SDK iOS App Store data disclosure:
  https://developers.google.com/ad-manager/mobile-ads-sdk/ios/privacy/data-disclosure

## Current answer

Select **Yes, data is collected from this app** for the v1.0 release draft.

The app itself still has no account system, developer profile database, remote
progress sync, support form, analytics SDK, or crash reporting SDK. Study
progress, settings, mistakes, XP, streaks, bookmarks, and audio preference stay
on the local device.

The release binary does include Google Mobile Ads, App Tracking Transparency,
Google UMP consent, and a one-time Remove Ads non-consumable IAP for **29 SEK**.
Those SDK/store paths mean the old no-collection answer is no longer the safe
release posture.

## Data types to review in App Store Connect

- **Identifiers / Device ID** — Google Mobile Ads may use the device advertising
  identifier or app/developer-bounded identifiers for third-party advertising
  and analytics. The app requests ATT before tracking-based advertising.
- **Usage Data / Product Interaction** — Google Mobile Ads may process app
  launches, taps, ad views, video views, and other interaction signals for ad
  delivery, measurement, and SDK performance.
- **Advertising Data** — Google Mobile Ads may process which ads were served or
  viewed for advertising and analytics.
- **Diagnostics** — Google Mobile Ads may process crash logs, performance data,
  app launch time, hang rate, and energy usage to improve SDK reliability and ad
  performance.
- **Purchases** — App Store in-app purchase infrastructure and the app runtime
  process the Remove Ads non-consumable purchase/restore state for app
  functionality. The app stores only the local `adsDisabled` entitlement flag.
- **Location review** — Google Mobile Ads may use IP address to estimate general
  location. Confirm whether the final Xcode privacy report requires a Coarse
  Location disclosure for the submitted binary.

## Uses and tracking posture

- Third-party advertising: Google Mobile Ads on study screens.
- Analytics / measurement: Google Mobile Ads SDK performance and ad measurement
  signals.
- App functionality: Remove Ads purchase, restore, and local entitlement state.
- Tracking: the app includes `expo-tracking-transparency`; on iOS, tracking-based
  advertising must wait for ATT authorization. Where required, Google UMP consent
  must be gathered before real AdMob serving.
- Non-personalized ads: if consent does not allow personalized ad serving, the
  runtime blocks or limits ad serving according to the consent decision.

## Binary review checklist before App Store submission

- Confirm `EXPO_PUBLIC_REAL_ADS_ENABLED` and real AdMob unit IDs match the build
  being submitted.
- Review the generated Xcode privacy report and Google Mobile Ads privacy
  manifest for the exact SDK versions in the binary.
- Confirm ATT prompt wording from `app.json` appears in the native build.
- Confirm UMP consent appears in regions where consent is required.
- Confirm Remove Ads purchase and restore use iOS product id
  `com.billyyiu.almostswedish.removeads` and Android product id `removeads`;
  the displayed price remains **29 SEK**.
- Update this file before submission if analytics, crash reporting, accounts,
  remote content, or support collection is enabled.
