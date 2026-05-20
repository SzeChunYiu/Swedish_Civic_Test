# Operator TO-DO — blocked on account owner (billy)

Updated: 2026-05-17.

=====================================================================
## PART A — v1.0 mobile release (DO THESE TO SHIP NOW)
=====================================================================

### A1. Apple "Remove Ads" IAP (needs Apple Developer Program, $99/yr)
- [ ] Apple Developer Program membership active
- [ ] Register App ID com.billyyiu.swedishcivictest
- [ ] App Store Connect: create app record
- [ ] IAP > Non-Consumable: "Remove Ads", id com.billyyiu.almostswedish.removeads,
      ~29 SEK, EN+SV copy, screenshot; create Sandbox tester

### A2. Google Play "Remove Ads" IAP (needs Play Console, $25 one-time)
- [ ] Play Console account registered
- [ ] Create app record
- [ ] In-app product id removeads, 29 SEK, Activate; add license tester

### A3. Final pre-submission
- [ ] Grant EAS build access (factory wires real AdMob IDs into EXPO_PUBLIC_ADMOB_*)
- [ ] On-device QA sign-off

### DONE
- [x] AdMob 2 apps + 12 ad units (publishing/admob-progress.md)
- [x] app-ads.txt real publisher pub-2451892671779738
- [x] civic 7/7 factory acceptance green

=====================================================================
## PART B — v1.1 (ONLY after v1.0 mobile is LIVE; see v1.1-milestone-spec.md)
=====================================================================
Do NOT start these until the mobile app is shipped.
- [ ] Create Supabase project (free tier); save URL + anon key for factory
- [ ] Google Cloud: OAuth 2.0 client (web + iOS + Android) for Supabase Auth
- [ ] Facebook: developer app + Login product; App ID/secret into Supabase
- [ ] Google AdSense account — apply AFTER web site is live & trafficked
      (AdSense only approves live sites; cannot gate release on it)
- [ ] (neural_grow gets the same login/progress milestone — see ng repo spec)

### A4. Web version host (free, no payment) — YOUR one step
- [ ] Go to vercel.com, Sign Up, Continue with GitHub (free, no card)
- [ ] Authorize Vercel for the SzeChunYiu account; Add New Project >
      Import SzeChunYiu/Swedish_Civic_Test
- [ ] Stop at the configure screen (do NOT guess settings) and tell Claude;
      Claude sets build cmd / output / SPA + hands you the live URL
- [ ] (optional, paid ~10/yr) custom domain later
