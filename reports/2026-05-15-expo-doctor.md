# Expo Doctor — 2026-05-15

## Purpose

Run Expo Doctor against the release candidate to catch Expo/native dependency
issues not covered by TypeScript, unit tests, content validation, or web export.

## Initial finding

Command:

```bash
npm exec -- expo-doctor
```

Initial result: `16/17 checks passed` and Expo Doctor flagged a local
`eas-cli` dependency as a legacy/local CLI install. The advice was to remove
`eas-cli` from project dependencies and use `npx` or a global CLI instead.

## Remediation

- Removed project-local `eas-cli` from `devDependencies` and `package-lock.json`.
- Changed EAS build/submit scripts to pinned `npx --yes eas-cli@18.13.0 ...`
  invocations.
- Changed release preflight EAS CLI/auth checks to pinned `npx --yes
  eas-cli@18.13.0 ...` invocations.
- Updated build-config and release-preflight tests to cover the new behavior.

## Final verification

Command:

```bash
npm exec -- expo-doctor
```

Result at 2026-05-15 18:36 CEST:

```text
17/17 checks passed. No issues detected!
```

## Scope and limitation

Expo Doctor passing improves local Expo/native readiness, but it does not replace
EAS authentication, EAS preview/production builds, Android/iOS physical-device
audio checks, store records, public HTTPS URLs, final screenshots, or store
submission evidence.
