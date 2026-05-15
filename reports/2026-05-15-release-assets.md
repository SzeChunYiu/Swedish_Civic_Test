# Release assets — 2026-05-15

## Purpose

Replace the missing/default Expo release asset surface with project-owned
branding assets before store build attempts.

## Assets

| Asset | Size | Purpose |
|---|---:|---|
| `assets/icon.png` | 1024 × 1024 | Top-level Expo app icon |
| `assets/adaptive-icon.png` | 1024 × 1024 | Android adaptive icon foreground |
| `assets/splash-icon.png` | 1242 × 2436 | Splash screen image |

## Configuration

- `app.json` top-level `expo.icon` points to `./assets/icon.png`.
- `app.json` `expo.splash.image` points to `./assets/splash-icon.png`.
- `app.json` `expo.android.adaptiveIcon.foregroundImage` points to
  `./assets/adaptive-icon.png`.
- `app.json` `expo.android.adaptiveIcon.backgroundColor` is `#005293`.

## Verification

- `node --test scripts/app-assets.test.js` verifies asset paths and PNG
  dimensions.
- `npm run validate` includes `npm run test:app-assets`.

## Remaining release caveat

These assets unblock the build configuration surface, but they do not replace
store-required screenshots or physical-device review. Screenshots are still
tracked separately in `publishing/screenshot-shotlist.md`.
