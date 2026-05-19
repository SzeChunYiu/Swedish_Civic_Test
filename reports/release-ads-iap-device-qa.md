# Release Ads/IAP Device QA

This report is the release index for the machine-readable Remove Ads device QA
artifacts. Each platform entry must point to a JSON artifact under
`reports/release-device-qa/`; release preflight validates those artifacts before
the v1.0 Remove Ads gate can close.

## Platform Artifacts

- iOS artifact: `reports/release-device-qa/ios.json`
- Android artifact: `reports/release-device-qa/android.json`

## Required Checks

Each platform JSON artifact must record device, OS version, build id, build URL,
proof screenshots, proof logs, reviewer, review timestamp, and passing results
for these checks:

- `admob-test-ads-study-screens`
- `remove-ads-purchase-hides-ads`
- `entitlement-persists-after-relaunch`
- `restore-purchase-restores-entitlement`
- `att-status-documented`
- `ump-consent-documented`
- `mock-exam-shows-no-ads`
