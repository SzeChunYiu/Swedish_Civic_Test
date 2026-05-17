# AdMob setup — progress (operator-driven, remote)

## iOS app — CREATED
- Name: Sweden Citizenship Test Prep
- Platform: iOS, not yet on store
- AdMob App ID: ca-app-pub-2451892671779738~8452000382
- Internal id: 8452000382

## Publisher ID (shared iOS+Android)
- pub-2451892671779738  -> already written into publishing/public-site/app-ads.txt

## Remaining (human/operator account tasks)
- [ ] 6 iOS ad units: home_banner(Banner) chapter_list_banner(Banner) quiz_completed_interstitial(Interstitial) results_native(Native) app_open_launch(AppOpen) rewarded_extra_exam(Rewarded)
- [ ] Android app (package com.billyyiu.swedishcivictest, not on store) + same 6 ad units
- [ ] App Store Connect + Play Console 29 SEK non-consumable Remove Ads IAP
- [ ] Paste 2 App IDs + 12 unit IDs into EXPO_PUBLIC_ADMOB_* (factory wires)

NOTE: factory builds/tests against Google public TEST units; real IDs are the final pre-submission swap (GOAL.md out-of-scope for factory).
