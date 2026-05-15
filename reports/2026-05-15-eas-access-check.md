# EAS access check — 2026-05-15

## Purpose

Check whether this machine can proceed from local readiness into EAS preview,
internal, or production builds without additional account setup.

## Commands and results

| Command | Result |
|---|---|
| `command -v eas >/dev/null 2>&1` before adding a dev dependency | `eas cli not found` |
| `npm uninstall --save-dev eas-cli` | removed local `eas-cli` after Expo Doctor flagged project-local install; build scripts now use pinned `npx --yes eas-cli@18.13.0` |
| `npx --yes eas-cli@18.13.0 --version` | `eas-cli/18.13.0 darwin-arm64 node-v26.0.0` |
| `npx --yes eas-cli@18.13.0 whoami` | exit 1, `Not logged in` |
| `npm exec -- expo-doctor` after removing local `eas-cli` | `17/17 checks passed. No issues detected!` |
| `npm audit --omit=dev --audit-level=high` | exit 0; reports 4 moderate production advisories under Expo/PostCSS, no high-or-critical production advisory at this threshold |

The initial `npx` run printed transient dependency deprecation warnings from the
EAS CLI install path. After the Expo Doctor finding, the build scripts now use
pinned `npx --yes eas-cli@18.13.0` commands and no longer depend on a global
`eas` binary or a project-local `eas-cli` dependency.

## Conclusion

EAS CLI availability is now pinned through `npx --yes eas-cli@18.13.0`. EAS
build/upload remains blocked on Expo account authentication from this machine.
This does not invalidate local app readiness, but it prevents generating the
preview build needed for physical Android/iOS audio testing and store internal
release evidence.

## Next action to unblock

1. Log in to Expo/EAS on this machine or provide an Expo token through the
   approved secure channel.
2. Re-run `npx --yes eas-cli@18.13.0 whoami` and record the account name in a copied
   release evidence file.
3. Run `npm run build:preview` to create an internal build for physical-device
   testing.
4. Record Android/iOS install and audio smoke evidence in
   `reports/release-evidence-YYYY-MM-DD.md`.
