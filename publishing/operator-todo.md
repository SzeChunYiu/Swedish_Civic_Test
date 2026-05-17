# Operator TO-DO — blocked on account owner (billy)

Updated: 2026-05-17. These are NOT factory-doable; they need your accounts/payment.
Once each account is set up and logged into Chrome, Claude can drive the rest hands-off (same as AdMob).

## 1. Apple "Remove Ads" IAP (needs paid Apple Developer Program, $99/yr)
- [ ] Apple Developer Program membership active
- [ ] Register App ID com.billyyiu.swedishcivictest
- [ ] App Store Connect: create app record
- [ ] In-App Purchases > Non-Consumable: Reference Name "Remove Ads",
      Product ID com.billyyiu.swedishcivictest.removeads, price tier ~29 SEK,
      EN+SV name/description, review screenshot
- [ ] Create a Sandbox tester (Users & Access > Sandbox)

## 2. Google Play "Remove Ads" IAP (needs Play Console account, $25 one-time)
- [ ] Play Console developer account registered (individual, ID verify, $25)
- [ ] Create app record
- [ ] Monetize > Products > In-app products > Create:
      Product ID removeads, price 29 SEK, Activate
- [ ] Setup > License testing: add tester account

## 3. Final pre-submission (after 1+2)
- [ ] Grant EAS build access; factory wires real AdMob IDs into EXPO_PUBLIC_ADMOB_*
- [ ] On-device QA sign-off (reports/release-ads-iap-device-qa.md)

## DONE (no action needed)
- [x] AdMob: 2 apps + 12 ad units created; IDs in publishing/admob-progress.md
- [x] app-ads.txt has real publisher pub-2451892671779738
- [x] civic 7/7 factory acceptance green
