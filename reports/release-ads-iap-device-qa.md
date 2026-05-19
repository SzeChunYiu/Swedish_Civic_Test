# Release Ads/IAP Device QA

This report is the manual gate for the ad-supported v1.0 release. It must be
filled with final iOS and Android evidence before release preflight can treat
Remove Ads device QA as closed.

Required evidence rules:

- Replace every placeholder with concrete device, build, reviewer, timestamp,
  and artifact evidence.
- Use ISO UTC for `Reviewed at`.
- Link either an HTTPS artifact URL or a repo-local artifact path under
  `reports/`, `publishing/`, `content/`, or `assets/`.
- Check every item only after observing the behavior on that platform.

## iOS

- Device: TBD
- Build: TBD
- Evidence artifact: reports/release-device-qa/TBD-ios.md
- Reviewer: TBD
- Reviewed at: TBD

- [ ] AdMob test ads rendered on study screens
- [ ] Remove Ads purchase removed ads
- [ ] Entitlement persisted after relaunch
- [ ] Restore purchase restored entitlement
- [ ] ATT prompt/status documented
- [ ] EEA UMP consent prompt rendered
- [ ] Timed exam screens showed no ads

## Android

- Device: TBD
- Build: TBD
- Evidence artifact: reports/release-device-qa/TBD-android.md
- Reviewer: TBD
- Reviewed at: TBD

- [ ] AdMob test ads rendered on study screens
- [ ] Remove Ads purchase removed ads
- [ ] Entitlement persisted after relaunch
- [ ] Restore purchase restored entitlement
- [ ] ATT prompt/status documented
- [ ] EEA UMP consent prompt rendered
- [ ] Timed exam screens showed no ads
