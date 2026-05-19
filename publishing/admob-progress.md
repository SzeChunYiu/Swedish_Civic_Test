# AdMob setup — COMPLETE (operator-driven, remote, 2026-05-17)

Publisher ID (shared): pub-2451892671779738 (in publishing/public-site/app-ads.txt)

## iOS — app + 6 ad units DONE

App name: Almost Swedish | not on store
IOS_APP_ID = ca-app-pub-2451892671779738~8452000382
IOS_BANNER_HOME = ca-app-pub-2451892671779738/9086425208 # home_banner
IOS_BANNER_CHAPTER_LIST = ca-app-pub-2451892671779738/6947347029 # chapter_list_banner
IOS_INTERSTITIAL_QUIZ_DONE = ca-app-pub-2451892671779738/4697570745 # quiz_completed_interstitial
IOS_NATIVE_RESULTS = ca-app-pub-2451892671779738/6460261868 # results_native
IOS_APP_OPEN_LAUNCH = ca-app-pub-2451892671779738/4328922542 # app_open_launch
IOS_REWARDED_EXTRA_EXAM = ca-app-pub-2451892671779738/3906250711 # rewarded_extra_exam

## Android — app + 6 ad units DONE

App name: Almost Swedish | not on store
ANDROID_APP_ID = ca-app-pub-2451892671779738~5027760693
AND_BANNER_HOME = ca-app-pub-2451892671779738/8775434010 # home_banner
AND_BANNER_CHAPTER_LIST = ca-app-pub-2451892671779738/6755775339 # chapter_list_banner
AND_INTERSTITIAL_QUIZ_DONE = ca-app-pub-2451892671779738/2022094490 # quiz_completed_interstitial
AND_NATIVE_RESULTS = ca-app-pub-2451892671779738/5442693665 # results_native
AND_APP_OPEN_LAUNCH = ca-app-pub-2451892671779738/2329445168 # app_open_launch
AND_REWARDED_EXTRA_EXAM = ca-app-pub-2451892671779738/9896943994 # rewarded_extra_exam

## Remaining (operator)

- [ ] App Store Connect: 29 SEK non-consumable IAP id com.billyyiu.swedishcivictest.removeads
- [ ] Play Console: 29 SEK in-app product id removeads
- [ ] Factory: wire these into `EXPO_PUBLIC_ADMOB_*` (real-unit path); keep test units for dev

NOTE: factory builds/tests vs Google TEST units; these real IDs are the final pre-submission swap.
