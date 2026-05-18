# Remove Ads / AdMob Device QA Sign-Off

Status: BLOCKED - template awaiting physical-device evidence.

Use this file for the final ad-supported v1.0 device gate after EAS preview
builds are installed on real Android and iOS devices. Do not mark the
`ads-iap-device-qa` release gate READY until every checklist item below is
filled with concrete build IDs, devices, tester names, timestamps, and proof
artifact paths or URLs.

## Build Under Test

- Git commit: TBD
- App version/build: TBD
- Android EAS preview build: TBD
- iOS EAS preview/TestFlight build: TBD
- Tester: TBD
- Checked at UTC: TBD

## Android

- Device and OS: TBD
- [ ] AdMob test units render on free study screens.
- [ ] Remove Ads purchase flow for 29 SEK removes all ad placements.
- [ ] `adsDisabled=true` persists after force quit and relaunch.
- [ ] Restore purchase re-enables the ad-free state after reinstall or local reset.
- [ ] Google UMP / EEA consent prompt appears where required before real ad serving.
- [ ] Mock exam screen stays ad-free before, during, and after submission.
- Proof artifact: TBD

## iOS

- Device and OS: TBD
- [ ] AdMob test units render on free study screens.
- [ ] Remove Ads purchase flow for 29 SEK removes all ad placements.
- [ ] `adsDisabled=true` persists after force quit and relaunch.
- [ ] Restore purchase re-enables the ad-free state after reinstall or local reset.
- [ ] App Tracking Transparency prompt appears before tracking-based advertising.
- [ ] Google UMP / EEA consent prompt appears where required before real ad serving.
- [ ] Mock exam screen stays ad-free before, during, and after submission.
- Proof artifact: TBD

## Final Sign-Off

- [ ] Android and iOS checks above passed on the named EAS preview builds.
- [ ] Privacy labels and Google Play Data safety copy were reviewed against the tested build.
- [ ] No ad appears on the exam screen in either platform pass.
- [ ] Evidence path or URL is referenced from `reports/release-gates.json` under
      `ads-iap-device-qa`.
