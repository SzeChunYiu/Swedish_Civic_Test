# External release blockers

## Purpose

Keep every non-code v1.0 release blocker tied to concrete evidence, the
SzeChunYiu tracker, and the exact release-preflight gate that must turn READY
before store submission.

Tracker: https://github.com/SzeChunYiu/Swedish_Civic_Test/issues/11

## Required command loop

If `release:github-secrets-check` reports a missing Expo token and you have a
valid local token in `EXPO_TOKEN` or macOS Keychain service `EXPO_TOKEN`, set
the repository Actions secret without printing the value:

```bash
npm run release:set-expo-token-secret -- --out reports/set-expo-token-secret-latest.md
```

If the token is still absent, generate the current non-secret owner request and
post the report body to issue #11:

```bash
npm run release:expo-token-request -- --out reports/expo-token-owner-request-latest.md
```

If you have a valid Expo token but do not want to keep it in shell history,
paste or pipe it into the local macOS Keychain helper first. The report redacts
the token and the follow-up bootstrap command can read the `EXPO_TOKEN`
Keychain service:

```bash
printf '%s' "$EXPO_TOKEN" | npm run release:store-expo-token-keychain -- --token-stdin --out reports/store-expo-token-keychain-latest.md
```

To run the full secret-set, secret-verify, and external-loop dispatch sequence
in one fail-closed command after exporting a local token or storing it in macOS
Keychain service `EXPO_TOKEN`:

```bash
npm run release:expo-token-bootstrap -- --out reports/expo-token-bootstrap-latest.md
```

Run the full safe evidence loop after each evidence update:

```bash
npm run release:external-blocker-loop -- --out reports/external-release-loop-latest.md
```

To dispatch the same check in GitHub Actions from the CLI and record the run URL:

```bash
npm run release:external-loop-dispatch -- --out reports/external-loop-dispatch-latest.md
```

You can also run the same check from GitHub Actions with the manual
`External release blocker loop` workflow. It uploads
`reports/external-release-loop-latest.md` as the `external-release-loop`
artifact even when gates are still blocked.
When this workflow runs in GitHub Actions, it uses injected `EXPO_TOKEN` for
secret-presence checks and `GH_TOKEN: ${{ github.token }}` with `actions: write`
to dispatch the follow-up EAS preview workflow.

The loop runs these commands in order and continues after expected blocked exits:
it writes intermediate command artifacts under `/tmp` so `release:preflight`
can still evaluate the repository clean-worktree gate.

```bash
npx --yes eas-cli@18.13.0 whoami
npm run release:eas-access-check -- --out reports/eas-access-check-latest.md
npm run release:github-secrets-check -- --out reports/github-release-secrets-latest.md
npm run release:expo-token-request -- --out reports/expo-token-owner-request-latest.md
# In GitHub Actions this check uses the injected EXPO_TOKEN environment variable
# instead of gh secret-list permissions.
npm run release:eas-preview-dispatch -- --run-build false --out reports/eas-preview-dispatch-latest.md
npm run release:preflight
npm run release:blockers-snapshot
npm run release:completion-audit
npm run release:issue-update
npm run release:evidence-index
```

Use `scripts/update-release-gate.js` or `npm run release:gate` to update
`reports/release-gates.json`; do not hand-wave a READY gate without concrete
evidence.

Use `npm run release:evidence-stub -- --list` to inspect scaffold paths, then
`npm run release:evidence-stub -- --gate <gate>` to create the exact non-secret
evidence file scaffold for a blocked manual gate before filling it.
Use `npm run release:evidence-index` to summarize which blocked gates still
need scaffold files versus filled evidence.

## Blocker checklist

| Gate                          | Required evidence                                                                                                                                  | Where to record                                                                                   | Current status |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| `eas-auth`                    | Successful `npx --yes eas-cli@18.13.0 whoami` output or approved Expo token state                                                                  | `reports/2026-05-15-eas-access-check.md`, `reports/eas-access-check-latest.md`, issue #11 comment | BLOCKED        |
| `eas-build-artifacts`         | Android and iOS EAS build IDs, URLs, profiles, artifact types, readiness                                                                           | `reports/eas-build-artifacts/eas-build-artifacts.json` or dated release evidence                  | BLOCKED        |
| `android-device-audio`        | Android installed build, device/OS, Swedish audio smoke, proof artifact                                                                            | `reports/device-smoke/android.json` or dated release evidence                                     | BLOCKED        |
| `ios-device-audio`            | iOS/TestFlight installed build, device/OS, Swedish audio smoke, proof artifact                                                                     | `reports/device-smoke/ios.json` or dated release evidence                                         | BLOCKED        |
| `store-records`               | App Store Connect and Google Play app URLs, bundle/package IDs, AdMob app readiness, Remove Ads IAP at 29 SEK, support/privacy URLs entered, listing metadata/account ownership review | `reports/store-records/store-records.json` or dated release evidence                              | BLOCKED        |
| `store-credentials`           | Non-secret App Store Connect submit identifiers and Google Play service-account metadata/fingerprint                                               | `reports/store-credentials/store-credentials.json` or dated release evidence                      | BLOCKED        |
| `privacy-review`              | Final Apple privacy labels and Google Play Data safety review against generated binary, including Google Mobile Ads real-ad path, Remove Ads IAP at 29 SEK, and ATT/UMP consent review | `reports/privacy-review/privacy-review.json` or dated release evidence                            | BLOCKED        |
| `release-owner-approval`      | Final owner approval after all pre-submission gates are ready, including approved commit and no-known-blockers assertion                           | `reports/release-owner-approval/release-owner-approval.json` or dated release evidence            | BLOCKED        |
| `device-screenshots`          | Final store screenshots from accepted device/store tooling with manifest, locale, dimensions, content review                                       | `reports/final-store-screenshots/manifest.json` or dated release evidence                         | BLOCKED        |
| `submission`                  | TestFlight/internal test, production submission IDs/statuses, first-week monitoring report                                                         | `reports/submission/submission.json`, `reports/monitoring/v1-week1.md`, or dated release evidence | BLOCKED        |

## Recently cleared manual gate

- `store-policy-questionnaires`: READY on 2026-05-16 from local Apple age rating/export/content-rights/no-affiliation review and Google Play content rating/target audience/ads/gambling/government-affiliation review recorded in `reports/store-policy-questionnaires/store-policy-questionnaires.json`. Final console entry/submission remains covered by the store-records and submission blockers.

## READY rule

A gate can move to READY only when `npm run release:preflight` accepts its
evidence and no contradictory placeholder, missing, stale, or blocker language
remains in `reports/release-gates.json`.
