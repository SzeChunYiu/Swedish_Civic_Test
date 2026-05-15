# Native prebuild smoke — 2026-05-15

## Purpose

Run Expo native prebuild in isolated temporary copies to catch Android/iOS native
configuration issues before EAS account access is available. This does not build
with Gradle or Xcode and does not replace EAS preview builds or physical-device
tests.

## Initial Android finding

Command run in `tmp/native-prebuild-work` with `node_modules` symlinked from the
repo:

```bash
npx expo prebuild --no-install --platform android --clean
```

Initial result: prebuild completed, but Expo warned:

```text
android: userInterfaceStyle: Install expo-system-ui in your project to enable this feature.
```

## Remediation

- Installed the Expo SDK 54-compatible `expo-system-ui` package with
  `npx expo install expo-system-ui`.
- Added `scripts/build-config.test.js` coverage so `userInterfaceStyle: "light"`
  requires an `expo-system-ui` dependency.

## Final verification

Android isolated prebuild:

```bash
npx expo prebuild --no-install --platform android --clean
```

Result: `✔ Finished prebuild` with no `userInterfaceStyle` warning.

iOS isolated prebuild:

```bash
npx expo prebuild --no-install --platform ios --clean
```

Result: `✔ Finished prebuild`.

## Scope and limitation

This is a local native-project generation smoke. It does not require Expo/EAS
authentication, but it also does not prove Gradle/Xcode compilation, app-store
signing, Android/iOS installability, audio behavior on physical devices, or store
submission readiness.
