# Web export smoke — 2026-05-15

## Purpose

Verify that the Expo Router web production export can bundle the current app,
assets, routes, and TypeScript/React Native Web dependencies without requiring
Expo/EAS account authentication.

## Command

```bash
npm run release:web-export-smoke
```

## Result

`npm run release:web-export-smoke` passed and exported to `dist-web`. This smoke is now also executed by `npm run release:preflight`.

Observed output:

- Web bundle generated from `node_modules/expo-router/entry.js`.
- `dist-web/index.html` exists.
- `dist-web/metadata.json` exists.
- Export size: about 1.2 MB.
- `dist-web/index.html` contains `Sweden Citizenship Test Prep`.

The export emitted only the known local `NO_COLOR`/`FORCE_COLOR` Node warnings
from the Expo toolchain.

## Scope and limitation

This is a local web production-bundle smoke test. It does not replace EAS
preview/production builds, native device installs, Android/iOS audio tests, or
store submission evidence.
