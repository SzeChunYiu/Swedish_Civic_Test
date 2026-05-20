# Release Ads/IAP Device QA

This report is the manual gate for the ad-supported v1.0 release. Release
preflight reads the per-platform JSON artifacts below and treats the gate as
closed only after both artifacts record concrete device, build, reviewer,
timestamp, proof-file, and observed check results.

## Platform Artifacts

- iOS artifact: `reports/release-device-qa/ios.json`
- Android artifact: `reports/release-device-qa/android.json`

## Required Checks

Each platform artifact must record these check ids with `result: "passed"`:

- `admob-test-ads-study-screens`
- `remove-ads-purchase-hides-ads`
- `entitlement-persists-after-relaunch`
- `restore-purchase-restores-entitlement`
- `att-status-documented`
- `ump-consent-documented`
- `mock-exam-shows-no-ads`

Use ISO UTC for `reviewedAt`. Proof entries may be repo-local files beside the
JSON artifact or HTTPS artifact URLs.
